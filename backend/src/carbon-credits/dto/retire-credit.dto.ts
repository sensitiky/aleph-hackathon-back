import { IsString, IsNotEmpty, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RetireCreditDto {
  @ApiProperty({
    description: 'ID del crédito a retirar',
    example: '1'
  })
  @Transform(({ value }) => BigInt(value))
  @IsPositive({ message: 'El ID del crédito debe ser positivo' })
  creditId: bigint;

  @ApiProperty({
    description: 'Cantidad de tokens a retirar',
    example: '50'
  })
  @Transform(({ value }) => BigInt(value))
  @IsPositive({ message: 'La cantidad debe ser positiva' })
  amount: bigint;

  @ApiProperty({
    description: 'Razón del retiro',
    example: 'Compensación de huella de carbono empresa XYZ'
  })
  @IsString({ message: 'La razón debe ser una cadena' })
  @IsNotEmpty({ message: 'La razón del retiro es requerida' })
  reason: string;
}