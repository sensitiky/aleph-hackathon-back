import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EthersService } from '../blockchain/ethers.service';
import { TransferDto, TransferFromDto, ApproveDto } from './dto/transfer.dto';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(private ethersService: EthersService) {}

  async transfer(transferData: TransferDto) {
    try {
      this.logger.log(`Transfiriendo ${transferData.amount.toString()} tokens a ${transferData.toAddress}`);

      if (!this.ethersService.isAddress(transferData.toAddress)) {
        throw new BadRequestException('Dirección de destinatario inválida');
      }

      const contract = this.ethersService.getContract();
      const tx = await contract.transfer(transferData.toAddress, transferData.amount);
      
      this.logger.log(`Transacción de transferencia enviada: ${tx.hash}`);
      const receipt = await this.ethersService.waitForTransaction(tx.hash);
      
      this.logger.log(`Transferencia exitosa en bloque ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      this.logger.error(`Error en transferencia a ${transferData.toAddress}:`, error.message);
      throw new BadRequestException(`Error en transferencia: ${error.message}`);
    }
  }

  async transferFrom(transferData: TransferFromDto) {
    try {
      this.logger.log(`Transfiriendo ${transferData.amount.toString()} tokens de ${transferData.fromAddress} a ${transferData.toAddress}`);

      if (!this.ethersService.isAddress(transferData.fromAddress)) {
        throw new BadRequestException('Dirección de remitente inválida');
      }
      if (!this.ethersService.isAddress(transferData.toAddress)) {
        throw new BadRequestException('Dirección de destinatario inválida');
      }

      const contract = this.ethersService.getContract();
      const tx = await contract.transferFrom(
        transferData.fromAddress,
        transferData.toAddress,
        transferData.amount
      );
      
      this.logger.log(`Transacción de transferencia delegada enviada: ${tx.hash}`);
      const receipt = await this.ethersService.waitForTransaction(tx.hash);
      
      this.logger.log(`Transferencia delegada exitosa en bloque ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      this.logger.error(`Error en transferencia delegada:`, error.message);
      throw new BadRequestException(`Error en transferencia delegada: ${error.message}`);
    }
  }

  async approve(approveData: ApproveDto) {
    try {
      this.logger.log(`Aprobando ${approveData.amount.toString()} tokens para ${approveData.spenderAddress}`);

      if (!this.ethersService.isAddress(approveData.spenderAddress)) {
        throw new BadRequestException('Dirección de spender inválida');
      }

      const contract = this.ethersService.getContract();
      const tx = await contract.approve(approveData.spenderAddress, approveData.amount);
      
      this.logger.log(`Transacción de aprobación enviada: ${tx.hash}`);
      const receipt = await this.ethersService.waitForTransaction(tx.hash);
      
      this.logger.log(`Aprobación exitosa en bloque ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      this.logger.error(`Error en aprobación para ${approveData.spenderAddress}:`, error.message);
      throw new BadRequestException(`Error en aprobación: ${error.message}`);
    }
  }

  async getAllowance(ownerAddress: string, spenderAddress: string): Promise<bigint> {
    try {
      if (!this.ethersService.isAddress(ownerAddress)) {
        throw new BadRequestException('Dirección de owner inválida');
      }
      if (!this.ethersService.isAddress(spenderAddress)) {
        throw new BadRequestException('Dirección de spender inválida');
      }

      const contract = this.ethersService.getContract();
      const allowance = await contract.allowance(ownerAddress, spenderAddress);
      
      this.logger.debug(`Allowance de ${ownerAddress} para ${spenderAddress}: ${allowance.toString()}`);
      return allowance;
    } catch (error) {
      this.logger.error(`Error obteniendo allowance:`, error.message);
      throw new BadRequestException(`Error obteniendo allowance: ${error.message}`);
    }
  }

  async hasBalance(address: string, amount: bigint): Promise<boolean> {
    try {
      if (!this.ethersService.isAddress(address)) {
        throw new BadRequestException('Dirección inválida');
      }

      const balance = await this.ethersService.getBalance(address);
      return balance >= amount;
    } catch (error) {
      this.logger.error(`Error verificando balance:`, error.message);
      return false;
    }
  }

  async hasAllowance(owner: string, spender: string, amount: bigint): Promise<boolean> {
    try {
      const allowance = await this.getAllowance(owner, spender);
      return allowance >= amount;
    } catch (error) {
      this.logger.error(`Error verificando allowance:`, error.message);
      return false;
    }
  }

  async increaseAllowance(spenderAddress: string, addedValue: bigint) {
    try {
      this.logger.log(`Incrementando allowance para ${spenderAddress} en ${addedValue.toString()}`);

      const signerAddress = await this.ethersService.getSigner().getAddress();
      const currentAllowance = await this.getAllowance(signerAddress, spenderAddress);
      const newAllowance = currentAllowance + addedValue;

      return await this.approve({ spenderAddress, amount: newAllowance });
    } catch (error) {
      this.logger.error(`Error incrementando allowance:`, error.message);
      throw new BadRequestException(`Error incrementando allowance: ${error.message}`);
    }
  }

  async decreaseAllowance(spenderAddress: string, subtractedValue: bigint) {
    try {
      this.logger.log(`Decrementando allowance para ${spenderAddress} en ${subtractedValue.toString()}`);

      const signerAddress = await this.ethersService.getSigner().getAddress();
      const currentAllowance = await this.getAllowance(signerAddress, spenderAddress);
      
      let newAllowance = currentAllowance - subtractedValue;
      if (newAllowance < 0n) {
        newAllowance = 0n;
      }

      return await this.approve({ spenderAddress, amount: newAllowance });
    } catch (error) {
      this.logger.error(`Error decrementando allowance:`, error.message);
      throw new BadRequestException(`Error decrementando allowance: ${error.message}`);
    }
  }
}