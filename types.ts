export interface IncomeDetails {
  grossSalary: number;
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  specialAllowance: number;
  lta: number;
  otherIncome: number;
}

export interface Deductions {
  section80C: number; // Limit 1.5L
  section80D: number; // Health Insurance
  section80CCD: number; // NPS
  standardDeduction: number; // Fixed 75k (New) / 50k (Old) - Logic updated for FY25
  hraExemption: number; // Calculated
  professionalTax: number;
}

export interface TaxResult {
  regime: 'OLD' | 'NEW';
  taxableIncome: number;
  taxAmount: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  breakdown: {
    slab: string;
    rate: number;
    amount: number;
  }[];
}

export interface AiAdvice {
  summary: string;
  savingsPotential: number;
  suggestions: {
    category: string;
    action: string;
    estimatedSaving: number;
  }[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}
