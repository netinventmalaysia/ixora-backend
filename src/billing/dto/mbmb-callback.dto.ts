import { IsBoolean, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

// Flexible DTO to accept MBMB payment callback payload
export class MbmbCallbackDto {
  // Billing reference we sent as orderid in payment/submit
  @IsString()
  @IsNotEmpty()
  orderid: string;

  // Gateway status string/code, e.g., 'Paid', '1', '00', 'Failed'
  @IsOptional()
  @IsString()
  status?: string; // e.g., '00'

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
  paydate?: string; // 'YYYY-MM-DD HH:mm:ss'

  // Optional verification fields (vcode, etc.)
  @IsOptional()
  @IsString()
  vcode?: string;

  @IsOptional()
  @IsString()
  error_desc?: string;

  @IsOptional()
  @IsString()
  error_code?: string;

  @IsOptional()
  @IsString()
  skey?: string;

  @IsOptional()
  @IsString()
  domain?: string; // 'SB_mbmb'

  @IsOptional()
  @IsString()
  currency?: string; // 'MYR'

  @IsOptional()
  @IsString()
  appcode?: string;

  @IsOptional()
  @IsString()
  channel?: string; // 'Credit'

  @IsOptional()
  @IsString()
  extraP?: string; // JSON string

  @IsOptional()
  @IsNumberString()
  treq?: string; // often 1

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsNumberString()
  vendor_id?: string;

  @IsOptional()
  @IsString()
  vendor_method?: string;

  @IsOptional()
  @IsString()
  callbackPaymentUrl?: string;
}
