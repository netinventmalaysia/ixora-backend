import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RazerCallbackDto {
  @IsString()
  @IsNotEmpty()
  reference: string; // our IXORA reference to find the billing

  @IsString()
  @IsNotEmpty()
  status: string; // e.g., 'Paid', 'Failed', 'Pending'

  @IsNumber()
  amount: number; // paid amount

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  refNo?: string;

  @IsString()
  @IsOptional()
  paidAt?: string; // ISO string

  @IsString()
  @IsOptional()
  signature?: string; // if verification required later
}
