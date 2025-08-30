import { IsNotEmpty, IsPositive, IsEthereumAddress } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class TransferDto {
  @ApiProperty({
    description: 'Dirección del destinatario',
    example: '0x742d35Cc6327C0532C5EBfc3F19d0C7e6F4A1322'
  })
  @IsEthereumAddress({ message: 'Debe ser una dirección Ethereum válida' })
  @IsNotEmpty({ message: 'La dirección del destinatario es requerida' })
  toAddress: string;

  @ApiProperty({
    description: 'Cantidad de tokens a transferir',
    example: '100'
  })
  @Transform(({ value }) => BigInt(value))
  @IsPositive({ message: 'La cantidad debe ser positiva' })
  amount: bigint;
}

export class TransferFromDto extends TransferDto {
  @ApiProperty({
    description: 'Dirección del remitente',
    example: '0x8ba1f109551bD432803012645Hac136c3c4b25E0'
  })
  @IsEthereumAddress({ message: 'Debe ser una dirección Ethereum válida' })
  @IsNotEmpty({ message: 'La dirección del remitente es requerida' })
  fromAddress: string;
}

export class ApproveDto {
  @ApiProperty({
    description: 'Dirección del spender (quien puede gastar)',
    example: '0x742d35Cc6327C0532C5EBfc3F19d0C7e6F4A1322'
  })
  @IsEthereumAddress({ message: 'Debe ser una dirección Ethereum válida' })
  @IsNotEmpty({ message: 'La dirección del spender es requerida' })
  spenderAddress: string;

  @ApiProperty({
    description: 'Cantidad de tokens a aprobar',
    example: '1000'
  })
  @Transform(({ value }) => BigInt(value))
  @IsPositive({ message: 'La cantidad debe ser positiva' })
  amount: bigint;
}