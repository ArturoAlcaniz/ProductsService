import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BaseService } from "../../commons/service.commons";
import { Product } from "$/../../../entities-lib/src/entities/product.entity";
import { ProductImage } from "$/../../../entities-lib/src/entities/productimage.entity";

@Injectable()
export class ProductImagesService extends BaseService<ProductImage> {
    constructor(
        @InjectRepository(ProductImage) private productImageRepository: Repository<ProductImage>
    ){
        super();
    }

    getRepository(): Repository<ProductImage> {
        return this.productImageRepository;
    }

    createProductImage(name: string, product: Product): ProductImage {
        let productImage = new ProductImage()
        productImage.product = product
        productImage.name = name
        return productImage;
    }
}