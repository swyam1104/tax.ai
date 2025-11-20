import { IncomeDetails, Deductions, TaxResult } from '../types';

// FY 2024-25 New Regime Slabs
const NEW_REGIME_SLABS = [
  { limit: 300000, rate: 0 },
  { limit: 700000, rate: 0.05 },
  { limit: 1000000, rate: 0.10 },
  { limit: 1200000, rate: 0.15 },
  { limit: 1500000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];

// FY 2024-25 Old Regime Slabs (General Citizen < 60)
const OLD_REGIME_SLABS = [
  { limit: 250000, rate: 0 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];

export const calculateHRAExemption = (basic: number, hraReceived: number, rentPaid: number, isMetro = true): number => {
  if (rentPaid === 0) return 0;
  const condition1 = hraReceived;
  const condition2 = isMetro ? 0.5 * basic : 0.4 * basic;
  const condition3 = rentPaid - (0.1 * basic);
  
  return Math.max(0, Math.min(condition1, condition2, condition3));
};

const calculateTaxForSlabs = (taxableIncome: number, slabs: typeof NEW_REGIME_SLABS): { tax: number, breakdown: any[] } => {
  let tax = 0;
  let previousLimit = 0;
  const breakdown = [];

  for (const slab of slabs) {
    if (taxableIncome > previousLimit) {
      const taxableAmount = Math.min(taxableIncome, slab.limit) - previousLimit;
      const slabTax = taxableAmount * slab.rate;
      tax += slabTax;
      
      if (slabTax > 0) {
        breakdown.push({
          slab: `₹${(previousLimit/100000).toFixed(1)}L - ₹${(Math.min(taxableIncome, slab.limit)/100000).toFixed(1)}L`,
          rate: slab.rate * 100,
          amount: slabTax
        });
      }
      previousLimit = slab.limit;
    } else {
      break;
    }
  }
  return { tax, breakdown };
};

export const calculateNewRegime = (income: IncomeDetails): TaxResult => {
  const standardDeduction = 75000; // Increased for FY25 New Regime
  const taxableIncome = Math.max(0, income.grossSalary + income.otherIncome - standardDeduction);

  let { tax, breakdown } = calculateTaxForSlabs(taxableIncome, NEW_REGIME_SLABS);

  // Rebate u/s 87A for New Regime (Income up to 7L is tax free)
  // Note: Marginal relief exists but keeping it simple for this demo
  if (taxableIncome <= 700000) {
    tax = 0;
    breakdown = [{ slab: 'Rebate u/s 87A', rate: 0, amount: 0 }];
  }

  const cess = tax * 0.04;
  
  return {
    regime: 'NEW',
    taxableIncome,
    taxAmount: tax,
    cess,
    totalTax: tax + cess,
    effectiveRate: taxableIncome > 0 ? ((tax + cess) / income.grossSalary) * 100 : 0,
    breakdown
  };
};

export const calculateOldRegime = (income: IncomeDetails, deductions: Deductions): TaxResult => {
  const hraExemption = calculateHRAExemption(income.basicSalary, income.hraReceived, income.rentPaid);
  
  // Caps
  const section80C = Math.min(deductions.section80C, 150000);
  const section80D = Math.min(deductions.section80D, 25000); // Assuming self < 60
  const section80CCD = Math.min(deductions.section80CCD, 50000);
  const standardDeduction = 50000; // Remains 50k for Old Regime

  const totalDeductions = section80C + section80D + section80CCD + standardDeduction + hraExemption + deductions.professionalTax;
  
  const taxableIncome = Math.max(0, income.grossSalary + income.otherIncome - totalDeductions);

  let { tax, breakdown } = calculateTaxForSlabs(taxableIncome, OLD_REGIME_SLABS);

  // Rebate u/s 87A for Old Regime (Income up to 5L)
  if (taxableIncome <= 500000) {
    tax = 0;
    breakdown = [{ slab: 'Rebate u/s 87A', rate: 0, amount: 0 }];
  }

  const cess = tax * 0.04;

  return {
    regime: 'OLD',
    taxableIncome,
    taxAmount: tax,
    cess,
    totalTax: tax + cess,
    effectiveRate: taxableIncome > 0 ? ((tax + cess) / income.grossSalary) * 100 : 0,
    breakdown
  };
};
