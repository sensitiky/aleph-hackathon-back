import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({
    description: 'Hash de la transacción',
    example: '0x1234567890abcdef...'
  })
  transactionHash: string;

  @ApiProperty({
    description: 'Estado de la transacción',
    example: 'SUCCESS',
    enum: ['SUCCESS', 'FAILED', 'PENDING']
  })
  status: string;

  @ApiProperty({
    description: 'Número de bloque',
    example: '12345678'
  })
  blockNumber?: string;

  @ApiProperty({
    description: 'Gas utilizado',
    example: '21000'
  })
  gasUsed?: string;

  @ApiProperty({
    description: 'Mensaje descriptivo',
    example: 'Transacción exitosa'
  })
  message: string;

  @ApiProperty({
    description: 'Datos adicionales de la transacción',
    required: false
  })
  data?: any;

  static success(
    hash: string, 
    blockNumber?: string, 
    gasUsed?: string, 
    message: string = 'Transacción exitosa',
    data?: any
  ): TransactionResponseDto {
    return {
      transactionHash: hash,
      status: 'SUCCESS',
      blockNumber,
      gasUsed,
      message,
      data
    };
  }

  static failed(message: string, data?: any): TransactionResponseDto {
    return {
      transactionHash: null,
      status: 'FAILED',
      message,
      data
    };
  }

  static pending(hash: string, message: string = 'Transacción pendiente'): TransactionResponseDto {
    return {
      transactionHash: hash,
      status: 'PENDING',
      message
    };
  }
}