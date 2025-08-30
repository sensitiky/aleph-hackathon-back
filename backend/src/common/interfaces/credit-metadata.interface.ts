import { CreditType } from '../enums/credit-type.enum';

export interface CreditMetadata {
  projectId: string;
  projectName: string;
  creditType: CreditType;
  vintageYear: bigint;
  methodology: string;
  country: string;
  region: string;
  issuanceDate: bigint;
  verificationBody: string;
  ipfsHash: string;
  isRetired: boolean;
  retiredBy: string;
  retiredAt: bigint;
}

export interface CreditStats {
  totalSupply: bigint;
  totalCredits: bigint;
  totalRetired: bigint;
  activeCredits: bigint;
}