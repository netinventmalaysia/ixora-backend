import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBillingItemDto {
  @IsString()
  @IsNotEmpty()
  order_no: string;

  @IsString()
  @IsNotEmpty()
  jenis: string; // 01,02,04,05

  @IsString()
  @IsNotEmpty()
  no_akaun: string;

  @IsNumber()
  amaun: number;
}

export class CreateBillingDto {
  @IsString()
  @IsNotEmpty()
  reference: string; // IXORA ref

  @IsNumber()
  businessId: number;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillingItemDto)
  items: CreateBillingItemDto[];
}
