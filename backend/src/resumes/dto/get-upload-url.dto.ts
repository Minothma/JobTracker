import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GetUploadUrlDto {
  @IsString()
  @IsNotEmpty({ message: 'Original filename is required' })
  @MaxLength(255)
  filename: string;

  @IsString()
  @IsNotEmpty({ message: 'Version label is required (e.g. "Fullstack v1", "Backend 2026")' })
  @MaxLength(100)
  version_label: string;
}
