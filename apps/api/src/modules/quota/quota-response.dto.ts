import { ApiProperty } from '@nestjs/swagger';

export class QuotaResponseDto {
  @ApiProperty() plan!: string;
  @ApiProperty() limit!: number;
  @ApiProperty() used!: number;
  @ApiProperty() remaining!: number;
  @ApiProperty() resetsAt!: string;
}
