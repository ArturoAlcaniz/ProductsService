import {IsNotEmpty, IsString} from "class-validator";

export class DeleteProductDto {
    @IsNotEmpty()
    @IsString()
    readonly id: string;
}