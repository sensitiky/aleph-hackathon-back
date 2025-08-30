import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse
} from '@nestjs/swagger';
import { TokensService } from './tokens.service';
import { TransferDto, TransferFromDto, ApproveDto } from './dto/transfer.dto';
import { TransactionResponseDto } from '../common/dto/transaction-response.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('tokens')
@Controller('tokens')
export class TokensController {
  private readonly logger = new Logger(TokensController.name);

  constructor(private readonly tokensService: TokensService) {}

  @Post('transfer')
  @ApiOperation({ summary: 'Transferir tokens ERC-20 a otra dirección' })
  @ApiResponse({
    status: 201,
    description: 'Transferencia exitosa',
    type: TransactionResponseDto
  })
  @ApiBadRequestResponse({ description: 'Balance insuficiente o dirección inválida' })
  async transfer(@Body() transferDto: TransferDto) {
    try {
      const receipt = await this.tokensService.transfer(transferDto);
      
      return TransactionResponseDto.success(
        receipt.hash,
        receipt.blockNumber?.toString(),
        receipt.gasUsed?.toString(),
        `Transferencia de ${transferDto.amount.toString()} tokens exitosa`
      );
    } catch (error) {
      this.logger.error(`Error en transferencia: ${error.message}`);
      throw new HttpException(
        error.message || 'Error en transferencia',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('transfer-from')
  @ApiOperation({ summary: 'Transferir tokens en nombre de otra dirección (delegada)' })
  @ApiResponse({
    status: 201,
    description: 'Transferencia delegada exitosa',
    type: TransactionResponseDto
  })
  @ApiBadRequestResponse({ description: 'Allowance insuficiente o direcciones inválidas' })
  async transferFrom(@Body() transferFromDto: TransferFromDto) {
    try {
      const receipt = await this.tokensService.transferFrom(transferFromDto);
      
      return TransactionResponseDto.success(
        receipt.hash,
        receipt.blockNumber?.toString(),
        receipt.gasUsed?.toString(),
        `Transferencia delegada de ${transferFromDto.amount.toString()} tokens exitosa`
      );
    } catch (error) {
      this.logger.error(`Error en transferencia delegada: ${error.message}`);
      throw new HttpException(
        error.message || 'Error en transferencia delegada',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('approve')
  @ApiOperation({ summary: 'Aprobar gasto de tokens a otra dirección' })
  @ApiResponse({
    status: 201,
    description: 'Aprobación exitosa',
    type: TransactionResponseDto
  })
  @ApiBadRequestResponse({ description: 'Dirección inválida' })
  async approve(@Body() approveDto: ApproveDto) {
    try {
      const receipt = await this.tokensService.approve(approveDto);
      
      return TransactionResponseDto.success(
        receipt.hash,
        receipt.blockNumber?.toString(),
        receipt.gasUsed?.toString(),
        `Aprobación de ${approveDto.amount.toString()} tokens exitosa`
      );
    } catch (error) {
      this.logger.error(`Error en aprobación: ${error.message}`);
      throw new HttpException(
        error.message || 'Error en aprobación',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('allowance/:owner/:spender')
  @Public()
  @ApiOperation({ summary: 'Obtener allowance entre dos direcciones' })
  @ApiParam({ name: 'owner', description: 'Dirección del propietario' })
  @ApiParam({ name: 'spender', description: 'Dirección del gastador' })
  @ApiResponse({
    status: 200,
    description: 'Allowance obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        spender: { type: 'string' },
        allowance: { type: 'string' }
      }
    }
  })
  async getAllowance(
    @Param('owner') owner: string,
    @Param('spender') spender: string
  ) {
    try {
      const allowance = await this.tokensService.getAllowance(owner, spender);
      
      return {
        owner,
        spender,
        allowance: allowance.toString()
      };
    } catch (error) {
      this.logger.error(`Error obteniendo allowance: ${error.message}`);
      throw new HttpException(
        error.message || 'Error obteniendo allowance',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('increase-allowance')
  @ApiOperation({ summary: 'Incrementar allowance existente' })
  @ApiResponse({
    status: 201,
    description: 'Allowance incrementado exitosamente',
    type: TransactionResponseDto
  })
  async increaseAllowance(@Body() body: { spenderAddress: string; addedValue: string }) {
    try {
      const receipt = await this.tokensService.increaseAllowance(
        body.spenderAddress,
        BigInt(body.addedValue)
      );
      
      return TransactionResponseDto.success(
        receipt.hash,
        receipt.blockNumber?.toString(),
        receipt.gasUsed?.toString(),
        `Allowance incrementado en ${body.addedValue} tokens`
      );
    } catch (error) {
      this.logger.error(`Error incrementando allowance: ${error.message}`);
      throw new HttpException(
        error.message || 'Error incrementando allowance',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('decrease-allowance')
  @ApiOperation({ summary: 'Decrementar allowance existente' })
  @ApiResponse({
    status: 201,
    description: 'Allowance decrementado exitosamente',
    type: TransactionResponseDto
  })
  async decreaseAllowance(@Body() body: { spenderAddress: string; subtractedValue: string }) {
    try {
      const receipt = await this.tokensService.decreaseAllowance(
        body.spenderAddress,
        BigInt(body.subtractedValue)
      );
      
      return TransactionResponseDto.success(
        receipt.hash,
        receipt.blockNumber?.toString(),
        receipt.gasUsed?.toString(),
        `Allowance decrementado en ${body.subtractedValue} tokens`
      );
    } catch (error) {
      this.logger.error(`Error decrementando allowance: ${error.message}`);
      throw new HttpException(
        error.message || 'Error decrementando allowance',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('balance/:address/sufficient/:amount')
  @Public()
  @ApiOperation({ summary: 'Verificar si una dirección tiene balance suficiente' })
  @ApiParam({ name: 'address', description: 'Dirección a verificar' })
  @ApiParam({ name: 'amount', description: 'Cantidad a verificar' })
  @ApiResponse({
    status: 200,
    description: 'Verificación completada',
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        amount: { type: 'string' },
        hasSufficientBalance: { type: 'boolean' }
      }
    }
  })
  async hasSufficientBalance(
    @Param('address') address: string,
    @Param('amount') amount: string
  ) {
    try {
      const hasBalance = await this.tokensService.hasBalance(address, BigInt(amount));
      
      return {
        address,
        amount,
        hasSufficientBalance: hasBalance
      };
    } catch (error) {
      this.logger.error(`Error verificando balance: ${error.message}`);
      throw new HttpException(
        error.message || 'Error verificando balance',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('allowance/:owner/:spender/sufficient/:amount')
  @Public()
  @ApiOperation({ summary: 'Verificar si hay allowance suficiente' })
  @ApiParam({ name: 'owner', description: 'Dirección del propietario' })
  @ApiParam({ name: 'spender', description: 'Dirección del gastador' })
  @ApiParam({ name: 'amount', description: 'Cantidad a verificar' })
  @ApiResponse({
    status: 200,
    description: 'Verificación completada',
    schema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        spender: { type: 'string' },
        amount: { type: 'string' },
        hasSufficientAllowance: { type: 'boolean' }
      }
    }
  })
  async hasSufficientAllowance(
    @Param('owner') owner: string,
    @Param('spender') spender: string,
    @Param('amount') amount: string
  ) {
    try {
      const hasAllowance = await this.tokensService.hasAllowance(
        owner,
        spender,
        BigInt(amount)
      );
      
      return {
        owner,
        spender,
        amount,
        hasSufficientAllowance: hasAllowance
      };
    } catch (error) {
      this.logger.error(`Error verificando allowance: ${error.message}`);
      throw new HttpException(
        error.message || 'Error verificando allowance',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}