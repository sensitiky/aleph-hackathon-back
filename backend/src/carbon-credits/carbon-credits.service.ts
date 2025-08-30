import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EthersService } from '../blockchain/ethers.service';
import { CreditMetadata } from '../common/interfaces/credit-metadata.interface';
import { MintCreditDto } from './dto/mint-credit.dto';
import { RetireCreditDto } from './dto/retire-credit.dto';

@Injectable()
export class CarbonCreditsService {
  private readonly logger = new Logger(CarbonCreditsService.name);

  constructor(private ethersService: EthersService) {}

  async verifyProject(projectId: string) {
    try {
      this.logger.log(`Verificando proyecto: ${projectId}`);
      
      const contract = this.ethersService.getContract();
      const tx = await contract.verifyProject(projectId);
      
      this.logger.log(`Transacción enviada: ${tx.hash}`);
      const receipt = await this.ethersService.waitForTransaction(tx.hash);
      
      this.logger.log(`Proyecto ${projectId} verificado exitosamente en bloque ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      this.logger.error(`Error verificando proyecto ${projectId}:`, error.message);
      throw new BadRequestException(`Error verificando proyecto: ${error.message}`);
    }
  }

  async mintCredit(mintData: MintCreditDto) {
    try {
      this.logger.log(`Creando crédito para ${mintData.toAddress} con cantidad: ${mintData.amount}`);
      this.logger.log(`Datos recibidos:`, JSON.stringify(mintData, null, 2));

      this.logger.log(`Validando dirección: ${mintData.toAddress}`);
      const isValidAddress = this.ethersService.isAddress(mintData.toAddress);
      this.logger.log(`Dirección válida: ${isValidAddress}`);
      
      if (!isValidAddress) {
        throw new BadRequestException('Dirección de destinatario inválida');
      }

      // Verificar que el proyecto esté verificado
      const isVerified = await this.isProjectVerified(mintData.projectId);
      if (!isVerified) {
        throw new BadRequestException(`El proyecto ${mintData.projectId} no está verificado`);
      }
      this.logger.log(`Proyecto ${mintData.projectId} está verificado`);

      this.logger.log(`Validaciones pasadas, creando metadata...`);

      // Convertir DTO a estructura de metadata del contrato
      const metadata = {
        projectId: mintData.projectId,
        projectName: mintData.projectName,
        creditType: mintData.creditType,
        vintageYear: BigInt(mintData.vintageYear),
        methodology: mintData.methodology,
        country: mintData.country,
        region: mintData.region,
        issuanceDate: BigInt(0), // Se setea en el contrato
        verificationBody: mintData.verificationBody,
        ipfsHash: mintData.ipfsHash,
        isRetired: false,
        retiredBy: '0x0000000000000000000000000000000000000000',
        retiredAt: BigInt(0)
      };

      const contract = this.ethersService.getContract();
      const tx = await contract.mintCredit(mintData.toAddress, BigInt(mintData.amount), metadata);
      
      this.logger.log(`Transacción de mint enviada: ${tx.hash}`);
      const receipt = await this.ethersService.waitForTransaction(tx.hash);
      
      // Extraer creditId del evento
      const creditId = await this.extractCreditIdFromReceipt(receipt);
      
      this.logger.log(`Crédito ${creditId} creado exitosamente en bloque ${receipt.blockNumber}`);
      
      return {
        receipt,
        creditId
      };
    } catch (error) {
      this.logger.error(`Error creando crédito:`, error.message);
      throw new BadRequestException(`Error creando crédito de carbono: ${error.message}`);
    }
  }

  async retireCredit(retireData: RetireCreditDto) {
    try {
      this.logger.log(`Retirando crédito ${retireData.creditId.toString()} con cantidad: ${retireData.amount.toString()}`);

      const contract = this.ethersService.getContract();
      const tx = await contract.retireCredit(
        retireData.creditId,
        retireData.amount,
        retireData.reason
      );
      
      this.logger.log(`Transacción de retiro enviada: ${tx.hash}`);
      const receipt = await this.ethersService.waitForTransaction(tx.hash);
      
      this.logger.log(`Crédito ${retireData.creditId.toString()} retirado exitosamente en bloque ${receipt.blockNumber}`);
      
      return receipt;
    } catch (error) {
      this.logger.error(`Error retirando crédito ${retireData.creditId.toString()}:`, error.message);
      throw new BadRequestException(`Error retirando crédito: ${error.message}`);
    }
  }

  async getBalance(address: string): Promise<bigint> {
    try {
      if (!this.ethersService.isAddress(address)) {
        throw new BadRequestException('Dirección inválida');
      }

      return await this.ethersService.getBalance(address);
    } catch (error) {
      this.logger.error(`Error obteniendo balance para ${address}:`, error.message);
      throw new BadRequestException(`Error obteniendo balance: ${error.message}`);
    }
  }

  async getUserCredits(address: string): Promise<bigint[]> {
    try {
      if (!this.ethersService.isAddress(address)) {
        throw new BadRequestException('Dirección inválida');
      }

      const contract = this.ethersService.getContract();
      return await contract.getUserCredits(address);
    } catch (error) {
      this.logger.error(`Error obteniendo créditos para ${address}:`, error.message);
      throw new BadRequestException(`Error obteniendo créditos del usuario: ${error.message}`);
    }
  }

  async getCreditMetadata(creditId: bigint): Promise<CreditMetadata> {
    try {
      const contract = this.ethersService.getContract();
      return await contract.getCreditMetadata(creditId);
    } catch (error) {
      this.logger.error(`Error obteniendo metadata del crédito ${creditId.toString()}:`, error.message);
      throw new BadRequestException(`Error obteniendo metadata: ${error.message}`);
    }
  }

  async getStats() {
    try {
      const contract = this.ethersService.getContract();
      return await contract.getStats();
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas:`, error.message);
      throw new BadRequestException(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  async getTotalSupply(): Promise<bigint> {
    try {
      return await this.ethersService.getTotalSupply();
    } catch (error) {
      this.logger.error(`Error obteniendo total supply:`, error.message);
      throw new BadRequestException(`Error obteniendo total supply: ${error.message}`);
    }
  }

  async getTotalRetiredCredits(): Promise<bigint> {
    try {
      const contract = this.ethersService.getContract();
      return await contract.totalRetiredCredits();
    } catch (error) {
      this.logger.error(`Error obteniendo créditos retirados:`, error.message);
      throw new BadRequestException(`Error obteniendo créditos retirados: ${error.message}`);
    }
  }

  async isProjectVerified(projectId: string): Promise<boolean> {
    try {
      const contract = this.ethersService.getContract();
      return await contract.verifiedProjects(projectId);
    } catch (error) {
      this.logger.error(`Error verificando estado del proyecto ${projectId}:`, error.message);
      throw new BadRequestException(`Error verificando estado del proyecto: ${error.message}`);
    }
  }

  private async extractCreditIdFromReceipt(receipt: any): Promise<string> {
    try {
      // Buscar el evento CreditMinted en los logs
      const creditMintedTopic = '0x...'; // Topic del evento CreditMinted (se obtendría del ABI)
      
      for (const log of receipt.logs) {
        if (log.topics[0] === creditMintedTopic) {
          // El creditId es el primer parámetro indexado del evento
          return log.topics[1];
        }
      }
      
      // Fallback: obtener desde el contrato
      const contract = this.ethersService.getContract();
      const filter = contract.filters.CreditMinted();
      const events = await contract.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
      
      if (events.length > 0) {
        const event = events[events.length - 1];
        if ('args' in event) {
          return event.args.creditId.toString();
        }
      }
      
      return 'unknown';
    } catch (error) {
      this.logger.warn('No se pudo extraer creditId del receipt:', error.message);
      return 'unknown';
    }
  }
}