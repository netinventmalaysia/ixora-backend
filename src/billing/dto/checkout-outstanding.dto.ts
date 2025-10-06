import { Type } from 'class-transformer';
import { IsArray, ArrayMinSize, ValidateNested, IsString, IsNotEmpty, IsNumber, IsOptional, IsEmail, IsInt, Min } from 'class-validator';

// Individual bill item the frontend sends from outstanding lookups
export class CheckoutBillItemDto {
  @IsString() @IsNotEmpty()
  account_no: string; // no_akaun or equivalent

  @IsString() @IsNotEmpty()
  item_type: string; // jenis (01 assessment, 02 booth, etc.)

  @Type(() => Number)
  @IsNumber()
  amount: number; // amount to charge for this line

  @IsString() @IsOptional()
  bill_no?: string; // optional external bill number
}

export class CheckoutOutstandingDto {
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutBillItemDto)
  bills: CheckoutBillItemDto[];

  @IsString() @IsNotEmpty()
  reference: string; // client generated or reuse existing pattern

  @IsOptional()
  @Type(() => Number)
  @IsInt() @Min(1)
  businessId?: number; // link to a business if applicable

  @IsOptional()
  @Type(() => Number)
  @IsInt() @Min(1)
  userId?: number; // initiating user (optional)

  @IsString() @IsNotEmpty()
  billName: string;

  @IsEmail()
  billEmail: string;

  @IsString() @IsNotEmpty()
  billMobile: string;

  @IsString() @IsNotEmpty()
  billDesc: string; // description aggregate
}
