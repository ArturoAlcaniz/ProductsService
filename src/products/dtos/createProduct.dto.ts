import {IsDecimal, IsNotEmpty, IsOptional, IsString} from "class-validator";

export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    readonly productname: string;

    @IsNotEmpty()
    @IsString()
    readonly description: string;

    @IsNotEmpty()
    @IsString()
    readonly category: string;

    @IsString()
    readonly startsell: string;

    @IsString()
    readonly endsell: string;

    @IsNotEmpty()
    @IsDecimal()
    readonly price: string;

    @IsOptional()
    readonly images: Array<Express.Multer.File>;
}
