import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty } from 'class-validator';

export class UpdateWalletDto {
  @ApiProperty({
    description: 'Nueva dirección de wallet Ethereum',
    example: '0x742d35Cc6634C0532925a3b8D357C0A2a9c42F4E',
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;
}