import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TransactionHistoryService } from './transaction-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';

@ApiTags('transaction-history')
@Controller('transactions')
export class TransactionHistoryController {
  constructor(
    private readonly transactionHistoryService: TransactionHistoryService,
  ) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Crear nueva transacción en el historial' })
  @ApiResponse({
    status: 201,
    description: 'Transacción creada exitosamente',
  })
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionHistoryService.createTransaction(createTransactionDto);
  }

  @Patch(':txHash')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar estado de transacción' })
  @ApiParam({ name: 'txHash', description: 'Hash de la transacción' })
  @ApiResponse({
    status: 200,
    description: 'Transacción actualizada exitosamente',
  })
  async updateTransaction(
    @Param('txHash') txHash: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionHistoryService.updateTransaction(txHash, updateTransactionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VERIFIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las transacciones (solo admins)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['mint', 'transfer', 'retire', 'approve', 'burn'] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'confirmed', 'failed'] })
  @ApiResponse({
    status: 200,
    description: 'Lista de transacciones obtenida exitosamente',
  })
  async getAllTransactions(@Query() query: TransactionQueryDto) {
    return this.transactionHistoryService.findAll(query);
  }

  @Get('my-transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener transacciones del usuario autenticado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Transacciones del usuario obtenidas exitosamente',
  })
  async getMyTransactions(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionHistoryService.findByUser(req.user.id, page, limit);
  }

  @Get('hash/:txHash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener transacción por hash' })
  @ApiParam({ name: 'txHash', description: 'Hash de la transacción' })
  @ApiResponse({
    status: 200,
    description: 'Transacción obtenida exitosamente',
  })
  async getTransactionByHash(@Param('txHash') txHash: string) {
    return this.transactionHistoryService.findByTxHash(txHash);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VERIFIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener transacciones de un usuario específico' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Transacciones del usuario obtenidas exitosamente',
  })
  async getUserTransactions(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionHistoryService.findByUser(userId, page, limit);
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener transacciones de un proyecto' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Transacciones del proyecto obtenidas exitosamente',
  })
  async getProjectTransactions(
    @Param('projectId') projectId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionHistoryService.findByProject(projectId, page, limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de transacciones del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalTransactions: { type: 'number' },
        pendingTransactions: { type: 'number' },
        confirmedTransactions: { type: 'number' },
        failedTransactions: { type: 'number' },
        totalVolume: { type: 'string' },
        transactionsByType: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getTransactionStats(@Request() req: any) {
    return this.transactionHistoryService.getTransactionStats(req.user.id);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas globales de transacciones (solo admin)' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas globales obtenidas exitosamente',
  })
  async getGlobalTransactionStats() {
    return this.transactionHistoryService.getTransactionStats();
  }
}