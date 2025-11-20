import { GoogleGenAI, Type } from "@google/genai";
import { IncomeDetails, Deductions, AiAdvice } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas ---

const ExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    grossSalary: { type: Type.NUMBER, description: "Total Annual Gross Salary" },
    basicSalary: { type: Type.NUMBER, description: "Annual Basic Salary component" },
    hraReceived: { type: Type.NUMBER, description: "Annual House Rent Allowance received from employer" },
    rentPaid: { type: Type.NUMBER, description: "Annual Rent paid by the user (if mentioned)" },
    investments80C: { type: Type.NUMBER, description: "Total investments under 80C (PPF, ELSS, LIC, EPF)" },
    medicalPremium80D: { type: Type.NUMBER, description: "Medical insurance premiums paid" },
    nps80CCD: { type: Type.NUMBER, description: "Investments in National Pension System" },
    otherIncome: { type: Type.NUMBER, description: "Income from other sources (Interest, Dividend)" }
  },
  required: ["grossSalary", "basicSalary"],
};

const AdviceSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A friendly, human-readable summary of the tax situation." },
    savingsPotential: { type: Type.NUMBER, description: "Estimated amount of tax the user could still save." },
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "E.g., 80C, 80D, NPS" },
          action: { type: Type.STRING, description: "Specific action to take (e.g., 'Invest ₹50k in ELSS')" },
          estimatedSaving: { type: Type.NUMBER, description: "Tax saved by taking this action" }
        }
      }
    }
  }
};

// --- Methods ---

export const extractFinancialData = async (inputText: string): Promise<{ income: IncomeDetails, deductions: Deductions }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract annual financial details from the following text. Assume amounts are in INR. If a value is missing, use 0. 
      
      Text: "${inputText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: ExtractionSchema,
      },
    });

    const data = JSON.parse(response.text || '{}');

    return {
      income: {
        grossSalary: data.grossSalary || 0,
        basicSalary: data.basicSalary || (data.grossSalary ? data.grossSalary * 0.4 : 0), // Fallback heuristic
        hraReceived: data.hraReceived || 0,
        rentPaid: data.rentPaid || 0,
        specialAllowance: 0, // Hard to infer
        lta: 0,
        otherIncome: data.otherIncome || 0,
      },
      deductions: {
        section80C: data.investments80C || 0,
        section80D: data.medicalPremium80D || 0,
        section80CCD: data.nps80CCD || 0,
        standardDeduction: 75000, // Default for FY25
        hraExemption: 0, // Calculated later
        professionalTax: 2400, // Standard approx
      }
    };
  } catch (error) {
    console.error("Extraction Error", error);
    throw new Error("Failed to extract data. Please try manual entry.");
  }
};

export const generateAiAdvice = async (income: IncomeDetails, deductions: Deductions, taxNew: number, taxOld: number): Promise<AiAdvice> => {
  try {
    const prompt = `
      Analyze this Indian Taxpayer's profile for FY 2024-25.
      
      Data:
      Gross Salary: ₹${income.grossSalary}
      80C Investments: ₹${deductions.section80C} (Limit 1.5L)
      80D Medical: ₹${deductions.section80D}
      Rent Paid: ₹${income.rentPaid}
      
      Calculated Tax (New Regime): ₹${taxNew}
      Calculated Tax (Old Regime): ₹${taxOld}
      
      Provide 3 specific, actionable suggestions to save tax. Focus on utilizing unused limits (80C, NPS 80CCD(1B), Health Insurance).
      Keep the tone encouraging and simple.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: AdviceSchema,
        temperature: 0.7
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Advice Error", error);
    return {
      summary: "We couldn't generate specific advice right now, but maximizing your 80C is always a good start!",
      savingsPotential: 0,
      suggestions: []
    };
  }
};