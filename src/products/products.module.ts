import {TypeOrmModule} from "@nestjs/typeorm";
import {Global, Module} from "@nestjs/common";
import {HttpModule} from "@nestjs/axios";
import {WinstonModule} from "nest-winston";
import {ThrottlerModule} from "@nestjs/throttler";
import { Product } from "$/../../../entities-lib/src/entities/product.entity";
import { Invoice } from "$/../../../entities-lib/src/entities/invoice.entity";
import { InvoiceItem } from "$/../../../entities-lib/src/entities/invoiceItem.entity";
import { ProductsService } from "./services/products.service";
import { ProductsController } from "./controllers/products.controller";
import { jwtConfig } from "$/../../../config-lib/src/jwt.config";
import { MulterModule } from "@nestjs/platform-express";
import { ProductImage } from "$/../../../entities-lib/src/entities/productimage.entity";
import { ProductImagesService } from "./services/productImages.service";
import { JwtModule } from "@nestjs/jwt";
import { UsersService } from "./services/users.service";
import { User } from "$/../../../entities-lib/src/entities/user.entity";

@Global()
@Module({
    imports: [
        MulterModule.register({
            dest: './files',
        }),
        TypeOrmModule.forFeature([Product,ProductImage,User,Invoice,InvoiceItem]),
        JwtModule.register(jwtConfig()),
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
        }),
        WinstonModule,
        ThrottlerModule,
    ],
    providers: [ProductsService,ProductImagesService,UsersService],
    controllers: [ProductsController],
    exports: [ProductsService,ProductImagesService,UsersService],
})
export class ProductsModule {}
