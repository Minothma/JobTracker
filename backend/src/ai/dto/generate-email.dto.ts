import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum EmailType {
  FOLLOW_UP = 'FOLLOW_UP',
  THANK_YOU = 'THANK_YOU',
  COLD_OUTREACH = 'COLD_OUTREACH',
  OFFER_NEGOTIATION = 'OFFER_NEGOTIATION',
}

export enum EmailTone {
  PROFESSIONAL = 'PROFESSIONAL',
  ENTHUSIASTIC = 'ENTHUSIASTIC',
  CONCISE = 'CONCISE',
}

export class GenerateEmailDto {
  @IsEnum(EmailType)
  @IsNotEmpty()
  type: EmailType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  company_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  role_title: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  recipient_name?: string;

  @IsEnum(EmailTone)
  @IsOptional()
  tone?: EmailTone = EmailTone.PROFESSIONAL;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  extra_notes?: string;
}
