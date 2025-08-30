import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TransactionType } from '../../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Hash de la transacción blockchain',
    example: '0x123abc...',
  })
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @ApiProperty({
    description: 'Tipo de transacción',
    enum: TransactionType,
    example: TransactionType.MINT,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Dirección de origen',
    example: '0x742d35Cc6634C0532925a3b8D357C0A2a9c42F4E',
  })
  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @ApiProperty({
    description: 'Dirección de destino',
    example: '0x742d35Cc6634C0532925a3b8D357C0A2a9c42F4E',
  })
  @IsString()
  @IsNotEmpty()
  toAddress: string;

  @ApiProperty({
    description: 'Cantidad de tokens',
    example: '1000000000000000000',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toString())
  amount: string;

  @ApiProperty({
    description: 'ID del crédito (opcional)',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  creditId?: string;

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
    description: 'Metadata adicional (JSON)',
    example: '{"description": "Token transfer"}',
    required: false,
  })
  @IsOptional()
  @IsString()
  metadata?: string;

  @ApiProperty({
    description: 'ID del usuario asociado',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'ID del proyecto asociado',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}