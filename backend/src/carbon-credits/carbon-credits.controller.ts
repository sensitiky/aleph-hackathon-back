import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse
} from '@nestjs/swagger';
import { CarbonCreditsService } from './carbon-credits.service';
import { MintCreditDto } from './dto/mint-credit.dto';
import { RetireCreditDto } from './dto/retire-credit.dto';
import { VerifyProjectDto } from './dto/verify-project.dto';
import { TransactionResponseDto } from '../common/dto/transaction-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../entities/user.entity';

@ApiTags('carbon-credits')
@Controller('carbon-credits')
export class CarbonCreditsController {
  private readonly logger = new Logger(CarbonCreditsController.name);

  constructor(private readonly carbonCreditsService: CarbonCreditsService) {}

  @Post('projects/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VERIFIER)
  @ApiOperation({ summary: 'Verificar un proyecto de carbono' })
  @ApiResponse({
    status: 201,
    description: 'Proyecto verificado exitosamente',
    type: TransactionResponseDto
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiInternalServerErrorResponse({ description: 'Error interno del servidor' })
  async verifyProject(@Body() verifyProjectDto: VerifyProjectDto) {
    try {
      const receipt = await this.carbonCreditsService.verifyProject(verifyProjectDto.projectId);
      
      return TransactionResponseDto.success(
        receipt.hash,
        receipt.blockNumber?.toString(),
        receipt.gasUsed?.toString(),
        `Proyecto ${verifyProjectDto.projectId} verificado exitosamente`
      );
    } catch (error) {
      this.logger.error(`Error verificando proyecto: ${error.message}`);
      throw new HttpException(
        error.message || 'Error verificando proyecto',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('mint')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MINTER)
  @ApiOperation({ summary: 'Crear nuevos créditos de carbono' })
  @ApiResponse({
    status: 201,
    description: 'Créditos de carbono creados exitosamente',
    type: TransactionResponseDto
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos o proyecto no verificado' })
  async mintCredit(@Body() mintCreditDto: MintCreditDto) {
    try {
      const result = await this.carbonCreditsService.mintCredit(mintCreditDto);
      
      return TransactionResponseDto.success(
        result.receipt.hash,
        result.receipt.blockNumber?.toString(),
        result.receipt.gasUsed?.toString(),
        `Crédito de carbono creado exitosamente`,
        { creditId: result.creditId }
      );
    } catch (error) {
      this.logger.error(`Error creando crédito: ${error.message}`);
      throw new HttpException(
        error.message || 'Error creando crédito de carbono',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('retire')
  @ApiOperation({ summary: 'Retirar créditos de carbono (offset)' })
  @ApiResponse({
    status: 201,
    description: 'Créditos retirados exitosamente',
    type: TransactionResponseDto
  })
  @ApiBadRequestResponse({ description: 'Balance insuficiente o datos inválidos' })
  async retireCredit(@Body() retireCreditDto: RetireCreditDto) {
    try {
      const receipt = await this.carbonCreditsService.retireCredit(retireCreditDto);
      
      return TransactionResponseDto.success(
        receipt.hash,
        receipt.blockNumber?.toString(),
        receipt.gasUsed?.toString(),
        `Crédito ${retireCreditDto.creditId.toString()} retirado exitosamente`
      );
    } catch (error) {
      this.logger.error(`Error retirando crédito: ${error.message}`);
      throw new HttpException(
        error.message || 'Error retirando crédito',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('balance/:address')
  @Public()
  @ApiOperation({ summary: 'Obtener balance de créditos de una dirección' })
  @ApiParam({ name: 'address', description: 'Dirección Ethereum' })
  @ApiResponse({
    status: 200,
    description: 'Balance obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        balance: { type: 'string' }
      }
    }
  })
  async getBalance(@Param('address') address: string) {
    try {
      const balance = await this.carbonCreditsService.getBalance(address);
      
      return {
        address,
        balance: balance.toString()
      };
    } catch (error) {
      this.logger.error(`Error obteniendo balance: ${error.message}`);
      throw new HttpException(
        error.message || 'Error obteniendo balance',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('user/:address/credits')
  @Public()
  @ApiOperation({ summary: 'Obtener IDs de créditos de un usuario' })
  @ApiParam({ name: 'address', description: 'Dirección Ethereum del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Créditos del usuario obtenidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        credits: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  async getUserCredits(@Param('address') address: string) {
    try {
      const credits = await this.carbonCreditsService.getUserCredits(address);
      
      return {
        address,
        credits: credits.map(id => id.toString())
      };
    } catch (error) {
      this.logger.error(`Error obteniendo créditos del usuario: ${error.message}`);
      throw new HttpException(
        error.message || 'Error obteniendo créditos del usuario',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('metadata/:creditId')
  @Public()
  @ApiOperation({ summary: 'Obtener metadata de un crédito específico' })
  @ApiParam({ name: 'creditId', description: 'ID del crédito' })
  @ApiResponse({
    status: 200,
    description: 'Metadata obtenida exitosamente'
  })
  async getCreditMetadata(@Param('creditId') creditId: string) {
    try {
      const metadata = await this.carbonCreditsService.getCreditMetadata(BigInt(creditId));
      
      // Convertir BigInts a strings para JSON
      return {
        ...metadata,
        vintageYear: metadata.vintageYear.toString(),
        issuanceDate: metadata.issuanceDate.toString(),
        retiredAt: metadata.retiredAt.toString()
      };
    } catch (error) {
      this.logger.error(`Error obteniendo metadata: ${error.message}`);
      throw new HttpException(
        error.message || 'Error obteniendo metadata del crédito',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Obtener estadísticas generales del contrato' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalSupply: { type: 'string' },
        totalCredits: { type: 'string' },
        totalRetired: { type: 'string' },
        activeCredits: { type: 'string' }
      }
    }
  })
  async getStats() {
    try {
      const stats = await this.carbonCreditsService.getStats();
      
      return {
        totalSupply: stats.totalSupply.toString(),
        totalCredits: stats.totalCredits.toString(),
        totalRetired: stats.totalRetired.toString(),
        activeCredits: stats.activeCredits.toString()
      };
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas: ${error.message}`);
      throw new HttpException(
        error.message || 'Error obteniendo estadísticas',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('total-supply')
  @Public()
  @ApiOperation({ summary: 'Obtener supply total de tokens' })
  @ApiResponse({
    status: 200,
    description: 'Total supply obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalSupply: { type: 'string' }
      }
    }
  })
  async getTotalSupply() {
    try {
      const totalSupply = await this.carbonCreditsService.getTotalSupply();
      
      return {
        totalSupply: totalSupply.toString()
      };
    } catch (error) {
      this.logger.error(`Error obteniendo total supply: ${error.message}`);
      throw new HttpException(
        error.message || 'Error obteniendo total supply',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('projects/:projectId/verified')
  @Public()
  @ApiOperation({ summary: 'Verificar si un proyecto está verificado' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto' })
  @ApiResponse({
    status: 200,
    description: 'Estado de verificación obtenido',
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        isVerified: { type: 'boolean' }
      }
    }
  })
  async isProjectVerified(@Param('projectId') projectId: string) {
    try {
      const isVerified = await this.carbonCreditsService.isProjectVerified(projectId);
      
      return {
        projectId,
        isVerified
      };
    } catch (error) {
      this.logger.error(`Error verificando estado del proyecto: ${error.message}`);
      throw new HttpException(
        error.message || 'Error verificando estado del proyecto',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}