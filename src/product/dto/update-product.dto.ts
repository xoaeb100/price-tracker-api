import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;
}
