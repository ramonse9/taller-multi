import { ApiProperty } from '@nestjs/swagger';

export class CatalogItemDto {
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
}

export class TimezoneCatalogItemDto {
  @ApiProperty() code!: string;
  @ApiProperty() description!: string;
}
