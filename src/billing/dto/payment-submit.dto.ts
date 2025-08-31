import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentSubmitDto {
  @IsString()
  @IsNotEmpty()
  orderId: string; // e.g., ETM2023070100001

  @IsNumber()
  amount: number; // e.g., 100.01

  @IsString()
  @IsNotEmpty()
  billName: string;

  @IsEmail()
  billEmail: string;

  @IsString()
  @IsNotEmpty()
  billMobile: string;

  @IsString()
  @IsNotEmpty()
  billDesc: string;

  @IsString()
  @IsOptional()
  country?: string; // default 'MY'
}
