import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class OnlineTransactionAcctDto {
  @IsString()
  @IsNotEmpty()
  orderNo: string;

  @IsString()
  @IsNotEmpty()
  // 01 Assessment, 02 Booth, 04 Compound, 05 Misc
  @IsIn(['01', '02', '04', '05'])
  jenis: string;

  @IsString()
  @IsNotEmpty()
  no_akaun: string;

  @IsNumber()
  amaun: number;
}

export class InsertOnlineBillDto {
  @IsString()
  @IsNotEmpty()
  orderNo: string;

  @IsString()
  @IsNotEmpty()
  orderTime: string; // ISO string in GMT+8

  @IsString()
  @IsNotEmpty()
  orderBank: string; // vendor receipt id

  @IsNumber()
  orderAmount: number; // must equal OnlineTransactionAcct.amaun

  @IsString()
  @IsIn(['C', 'N'])
  orderStatus: 'C' | 'N';

  @IsString()
  @IsNotEmpty()
  userId: string; // your system user id

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsEmail()
  buyerEmail: string;

  // Optional payment gateway fields
  @IsOptional()
  @IsString()
  transactionResponseCode?: string; // default '00'

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  transactionTime?: string;

  @IsOptional()
  @IsString()
  transactionBank?: string;

  @IsOptional()
  @IsString()
  transactionRefNo?: string;

  @IsOptional()
  @IsNumber()
  transactionAmount?: number;

  @IsObject()
  onlineTransactionAcct: OnlineTransactionAcctDto;
}
