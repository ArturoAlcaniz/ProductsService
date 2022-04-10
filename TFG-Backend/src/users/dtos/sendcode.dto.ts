import {IsNotEmpty, IsString, IsEmail} from "class-validator";

export class SendCodeDto {
    @IsNotEmpty({message: "email_empty"})
    @IsString()
    @IsEmail({}, {message: "invalid_email"})
    readonly email: string;
}
