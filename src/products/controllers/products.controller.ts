import {
    Body,
    Inject,
    Post,
    Req,
    Res,
    UseGuards,
    Controller,
    Get,
    UseInterceptors,
    UploadedFiles,
    Param,
    StreamableFile,
} from "@nestjs/common";
import {Response, Request} from "express";
import {User} from "@entities-lib/src/entities/user.entity";
import {UsersService} from "../services/users.service";
import {AuthenticatedGuard} from "../guards/authenticated.guard";
import {ApiOkResponse, ApiTags} from "@nestjs/swagger";
import {Logger} from "winston";
import {Throttle, ThrottlerGuard} from "@nestjs/throttler";
import {CreateProductDto} from "../dtos/createProduct.dto";
import {Category} from "@entities-lib/src/entities/categoryProduct.enum";
import {Product} from "@entities-lib/src/entities/product.entity";
import {ProductsService} from "../services/products.service";
import {FilesInterceptor} from "@nestjs/platform-express";
import {ProductImage} from "@entities-lib/src/entities/productimage.entity";
import {ProductImagesService} from "../services/productImages.service";
import fs, {createReadStream} from "fs";
import {join} from "path";
import {ModifyProductDto} from "../dtos/modifyProduct.dto";
import {DeleteProductDto} from "../dtos/deleteProduct.dto";
import {FindManyOptions, FindOptionsWhere, In, IsNull, Not} from "typeorm";
import {JwtService} from "@nestjs/jwt";
import multer from "multer";

@ApiTags("Product Controller")
@Controller("products")
export class ProductsController {
    constructor(
        private usersService: UsersService,
        private productsService: ProductsService,
        private productImagesService: ProductImagesService,
        private jwtService: JwtService,
        @Inject("winston")
        private readonly logger: Logger
    ) {}

    @UseGuards(ThrottlerGuard)
    @Throttle(10, 3000)
    @ApiOkResponse()
    @Post("create")
    @UseGuards(AuthenticatedGuard)
    @UseInterceptors(FilesInterceptor("images"))
    async create(
        @Body() payload: CreateProductDto,
        @Res({passthrough: true}) response: Response,
        @Req() request: Request,
        @UploadedFiles() images: Array<Express.Multer.File>
    ) {
        let user: User = await this.usersService.findOne({
            where: {
                id: this.jwtService.decode(request.cookies["jwt"])["userId"],
            },
        });

        let product: Product = this.productsService.createProduct(
            payload.productname,
            payload.description,
            payload.category,
            payload.startsell == "" ? null : payload.startsell,
            payload.endsell == "" ? null : payload.endsell,
            payload.price,
            user
        );

        product = await this.productsService.save(product);

        product = await this.productsService.save(product);

        let productImages: ProductImage[] = [];

        images.forEach((value) => {
            let productImage: ProductImage =
                this.productImagesService.createProductImage(
                    value.filename,
                    product
                );
            productImages.push(productImage);
        });

        if (await this.productImagesService.saveMany(productImages)) {
            response
                .status(200)
                .json({message: ["successfully_product_created"]});
        }
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(10, 3000)
    @ApiOkResponse()
    @Post("createWithoutImages")
    @UseGuards(AuthenticatedGuard)
    async createWithoutImages(
        @Body() payload: CreateProductDto,
        @Res({passthrough: true}) response: Response,
        @Req() request: Request
    ) {
        let user: User = await this.usersService.findOne({
            where: {
                id: this.jwtService.decode(request.cookies["jwt"])["userId"],
            },
        });

        let product: Product = this.productsService.createProduct(
            payload.productname,
            payload.description,
            payload.category,
            payload.startsell == "" ? null : payload.startsell,
            payload.endsell == "" ? null : payload.endsell,
            payload.price,
            user
        );

        if (await this.productsService.save(product)) {
            response
                .status(200)
                .json({message: ["successfully_product_created"]});
        }
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(100, 3000)
    @ApiOkResponse()
    @Post("delete")
    @UseGuards(AuthenticatedGuard)
    async delete(
        @Body() payload: DeleteProductDto,
        @Res({passthrough: true}) response: Response,
        @Req() request: Request
    ) {
        let user: User = await this.usersService.findOne({
            where: {
                id: this.jwtService.decode(request.cookies["jwt"])["userId"],
            },
        });

        let product: Product = await this.productsService
            .getRepository()
            .createQueryBuilder()
            .where("userid = :uid", {uid: user.id})
            .andWhere("id = :pid", {pid: payload.id})
            .getOne();

        this.logger.info(`Deleting product ${product.id}`);

        let images = await this.productImagesService
            .getRepository()
            .createQueryBuilder()
            .where("productid = :pid", {pid: payload.id})
            .getMany();

        let imageIds = images.map((image) => {
            return image.id;
        });

        if (images.length > 0) {
            await this.productImagesService.deleteMany(imageIds);
        }

        if ((await this.productsService.delete({id: product.id})).affected) {
            response
                .status(200)
                .json({message: ["successfully_product_deleted"]});
        }
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(100, 3000)
    @ApiOkResponse()
    @Post("modify")
    @UseGuards(AuthenticatedGuard)
    @UseInterceptors(FilesInterceptor("images"))
    async modify(
        @Body() payload: ModifyProductDto,
        @Res({passthrough: true}) response: Response,
        @Req() request: Request,
        @UploadedFiles() images: Array<Express.Multer.File>
    ) {
        let user: User = await this.usersService.findOne({
            where: {
                id: this.jwtService.decode(request.cookies["jwt"])["userId"],
            },
        });

        let product: Product = await this.productsService.findOne({
            relations: ["images"],
            where: {
                user: user,
                id: payload.id,
            } as FindOptionsWhere<Product>,
        });

        product.productName = payload.productname;
        product.description = payload.description;
        product.category = <Category>payload.category;
        product.starts = payload.startsell == "" ? null : payload.startsell;
        product.ends = payload.endsell == "" ? null : payload.endsell;
        product.price = payload.price;

        let ids: string[] = JSON.parse(payload.imagesAlreadyAdded);

        let idsOld: string[] = product.images.map((image) => image.id);

        let idsToDelete: string[] = idsOld.filter((id) => !ids.includes(id));

        if (idsToDelete.length > 0) {
            await this.productImagesService.deleteMany(idsToDelete);
        }

        let productImages: ProductImage[] = [];

        images.forEach((value) => {
            let productImage: ProductImage =
                this.productImagesService.createProductImage(
                    value.filename,
                    product
                );
            productImages.push(productImage);
        });

        if (
            await this.productImagesService.saveMany(productImages) &&
            await this.productsService.save(product)
        ) {
            response
                .status(200)
                .json({message: ["successfully_product_modified"]});
        }
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(100, 3000)
    @ApiOkResponse()
    @Get("obtain")
    @UseGuards(AuthenticatedGuard)
    async getProducts(
        @Res({passthrough: true}) response: Response,
        @Req() request: Request
    ) {
        let user: User = await this.usersService.findOne({
            where: {
                id: this.jwtService.decode(request.cookies["jwt"])["userId"],
            },
        });

        let products: Product[] = await this.productsService.find({
            relations: ["images"],
            where: {
                user: {id: user.id},
            },
        });

        return products;
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(100, 3000)
    @ApiOkResponse()
    @Get("obtainAllAvailable")
    async getAllProducts(
        @Res({passthrough: true}) response: Response,
        @Req() request: Request
    ) {
        let products: Product[] = await this.productsService.find({
            relations: ["images", "sold"],
            where: {
                sold: IsNull(),
            } as FindOptionsWhere<Product>,
        });

        return products;
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(100, 3000)
    @ApiOkResponse()
    @Get("obtainCategories")
    async getCategories() {
        return Object.values(Category);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(10, 3000)
    @ApiOkResponse()
    @Get("obtain/:product")
    @UseGuards(AuthenticatedGuard)
    async getProduct(@Param("product") product: string) {
        let p: Product = await this.productsService.findOne({
            relations: ["images"],
            where: {
                id: product,
            } as FindOptionsWhere<Product>,
        });

        return p;
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(100, 3000)
    @ApiOkResponse()
    @Get("image/:product")
    async getAvatar(
        @Param("product") product: string,
        @Res({passthrough: true}) response: Response,
        @Req() request: Request
    ) {
        let file = "files/{FILENAME}".replace("{FILENAME}", product);
        if (fs.existsSync(file)) {
            const f = createReadStream(join(process.cwd(), file));
            return new StreamableFile(f);
        }
    }

    @UseGuards(ThrottlerGuard)
    @Throttle(20, 3000)
    @ApiOkResponse()
    @Get("image")
    async getAvatarDefault(
        @Res({passthrough: true}) response: Response,
        @Req() request: Request
    ) {
        let file = "static-images/ProductImage.png";
        const f = createReadStream(join(process.cwd(), file));
        return new StreamableFile(f);
    }
}
