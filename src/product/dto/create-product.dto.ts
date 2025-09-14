import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Platform } from '../product.entity';

export class CreateProductDto {
  @IsOptional()
  url?: string;

  @IsEnum(['amazon', 'flipkart', 'croma', 'vijaysales'])
  platform!: Platform;

  @IsNumber()
  @Min(0)
  minPrice!: number;

  @IsNumber()
  @Min(0)
  maxPrice!: number;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty()
  @IsEmail()
  customerEmail?: string;

  @IsNotEmpty()
  @IsString()
  productId?: string;
}
