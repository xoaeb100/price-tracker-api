import {
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
  @IsUrl()
  @IsNotEmpty()
  url!: string;

  @IsEnum(['amazon', 'flipkart'])
  platform!: Platform;

  @IsNumber()
  @Min(0)
  targetPrice!: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
