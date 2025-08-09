import { IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(7)
    newPassword: string;
}