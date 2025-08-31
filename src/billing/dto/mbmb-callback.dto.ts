import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

// Flexible DTO to accept MBMB payment callback payload
export class MbmbCallbackDto {
  // Billing reference we sent as orderid in payment/submit
  @IsString()
  @IsNotEmpty()
  orderid: string;

  // Gateway status string/code, e.g., 'Paid', '1', '00', 'Failed'
  @IsOptional()
  @IsString()
  status?: string;

  // Amount may arrive as string; we normalize later
  @IsOptional()
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @IsString()
  tranID?: string;

  @IsOptional()
  @IsString()
  refNo?: string;

  @IsOptional()
  @IsString()
  paidAt?: string; // ISO date if provided

  // Optional verification fields (vcode, etc.)
  @IsOptional()
  @IsString()
  vcode?: string;

  @IsOptional()
  @IsString()
  error_desc?: string;
}
