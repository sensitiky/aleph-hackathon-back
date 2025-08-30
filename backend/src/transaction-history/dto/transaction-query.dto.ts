import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TransactionType, TransactionStatus } from '../../entities/transaction.entity';

export class TransactionQueryDto {
  @ApiProperty({
    description: 'Número de página',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Límite de resultados por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: 'Tipo de transacción',
    enum: TransactionType,
    example: TransactionType.MINT,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({
    description: 'Estado de la transacción',
    enum: TransactionStatus,
    example: TransactionStatus.CONFIRMED,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({
    description: 'ID del usuario',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'ID del proyecto',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({
    description: 'Fecha de inicio (ISO string)',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ? new Date(value).toISOString() : undefined)
  fromDate?: string;

  @ApiProperty({
    description: 'Fecha de fin (ISO string)',
    example: '2023-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ? new Date(value).toISOString() : undefined)
  toDate?: string;

  @ApiProperty({
    description: 'Dirección de origen',
    example: '0x742d35Cc6634C0532925a3b8D357C0A2a9c42F4E',
    required: false,
  })
  @IsOptional()
  @IsString()
  fromAddress?: string;

  @ApiProperty({
    description: 'Dirección de destino',
    example: '0x742d35Cc6634C0532925a3b8D357C0A2a9c42F4E',
    required: false,
  })
  @IsOptional()
  @IsString()
  toAddress?: string;
}