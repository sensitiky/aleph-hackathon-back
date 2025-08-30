import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyProjectDto {
  @ApiProperty({
    description: 'ID único del proyecto a verificar',
    example: 'PROJ-001-FOREST-2024'
  })
  @IsString({ message: 'El ID del proyecto debe ser una cadena' })
  @IsNotEmpty({ message: 'El ID del proyecto es requerido' })
  projectId: string;
}