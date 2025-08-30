import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, IsString } from 'class-validator';
import { TransactionStatus } from '../../entities/transaction.entity';

export class UpdateTransactionDto {
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
    description: 'Número de bloque',
    example: 12345,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  blockNumber?: number;

  @ApiProperty({
    description: 'Gas usado',
    example: '21000',
    required: false,
  })
  @IsOptional()
  @IsString()
  gasUsed?: string;

  @ApiProperty({
    description: 'Precio del gas',
    example: '20000000000',
    required: false,
  })
  @IsOptional()
  @IsString()
  gasPrice?: string;

  @ApiProperty({
    description: 'Mensaje de error (si la transacción falló)',
    example: 'Insufficient gas',
    required: false,
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}