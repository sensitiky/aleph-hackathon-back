import { IsString, IsNotEmpty, IsEnum, IsEthereumAddress, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { CreditType } from '../../common/enums/credit-type.enum';

export class MintCreditDto {
  @ApiProperty({
    description: 'Dirección del destinatario',
    example: '0x742d35Cc6327C0532C5EBfc3F19d0C7e6F4A1322'
  })
  @IsEthereumAddress({ message: 'Debe ser una dirección Ethereum válida' })
  @IsNotEmpty({ message: 'La dirección del destinatario es requerida' })
  toAddress: string;

  @ApiProperty({
    description: 'Cantidad de tokens a crear (en unidades)',
    example: 100
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  amount: number;

  @ApiProperty({
    description: 'ID único del proyecto',
    example: 'PROJ-001-FOREST-2024'
  })
  @IsString({ message: 'El ID del proyecto debe ser una cadena' })
  @IsNotEmpty({ message: 'El ID del proyecto es requerido' })
  projectId: string;

  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Reforestación Amazonia Colombia'
  })
  @IsString({ message: 'El nombre del proyecto debe ser una cadena' })
  @IsNotEmpty({ message: 'El nombre del proyecto es requerido' })
  projectName: string;

  @ApiProperty({
    description: 'Tipo de crédito de carbono',
    enum: CreditType,
    example: CreditType.FORESTRY
  })
  @IsEnum(CreditType, { message: 'Debe ser un tipo de crédito válido' })
  creditType: CreditType;

  @ApiProperty({
    description: 'Año vintage del crédito',
    example: 2024
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'El año vintage debe ser un número' })
  @Min(2000, { message: 'El año vintage debe ser mayor a 2000' })
  vintageYear: number;

  @ApiProperty({
    description: 'Metodología utilizada (VCS, CDM, etc.)',
    example: 'VCS Standard v4.3'
  })
  @IsString({ message: 'La metodología debe ser una cadena' })
  @IsNotEmpty({ message: 'La metodología es requerida' })
  methodology: string;

  @ApiProperty({
    description: 'País de origen del proyecto',
    example: 'Colombia'
  })
  @IsString({ message: 'El país debe ser una cadena' })
  @IsNotEmpty({ message: 'El país es requerido' })
  country: string;

  @ApiProperty({
    description: 'Región específica del proyecto',
    example: 'Amazonas'
  })
  @IsString({ message: 'La región debe ser una cadena' })
  @IsNotEmpty({ message: 'La región es requerida' })
  region: string;

  @ApiProperty({
    description: 'Organismo verificador',
    example: 'Verra Registry'
  })
  @IsString({ message: 'El organismo verificador debe ser una cadena' })
  @IsNotEmpty({ message: 'El organismo verificador es requerido' })
  verificationBody: string;

  @ApiProperty({
    description: 'Hash IPFS con documentación completa',
    example: 'QmXoYy...'
  })
  @IsString({ message: 'El hash IPFS debe ser una cadena' })
  @IsNotEmpty({ message: 'El hash IPFS es requerido' })
  ipfsHash: string;
}