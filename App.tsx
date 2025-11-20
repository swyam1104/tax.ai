import React, { useState } from 'react';
import { Upload, FileText, Loader2, ArrowRight, CheckCircle2, BrainCircuit } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { extractFinancialData, generateAiAdvice } from './services/geminiService';
import { calculateNewRegime, calculateOldRegime } from './services/taxEngine';
import { IncomeDetails, Deductions, TaxResult, AiAdvice, AppState } from './types';

const SAMPLE_TEXT = `My annual package is 15 Lakhs.
Basic salary is 6 Lakhs.
I get HRA of 3 Lakhs but I pay rent of 15000 per month.
I have invested 1.2 Lakhs in PPF and 50,000 in LIC under 80C.
I also pay 20,000 for health insurance.`;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [inputText, setInputText] = useState('');
  const [data, setData] = useState<{
    income: IncomeDetails;
    deductions: Deductions;
    newRegime: TaxResult;
    oldRegime: TaxResult;
    advice: AiAdvice;
  } | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setAppState(AppState.ANALYZING);
    
    try {
      // 1. Extract Data using AI
      const { income, deductions } = await extractFinancialData(inputText);
      
      // 2. Calculate Taxes (Deterministic)
      const newRegime = calculateNewRegime(income);
      const oldRegime = calculateOldRegime(income, deductions);
      
      // 3. Get Advice (AI)
      const advice = await generateAiAdvice(income, deductions, newRegime.totalTax, oldRegime.totalTax);
      
      setData({ income, deductions, newRegime, oldRegime, advice });
      setAppState(AppState.RESULTS);
    } catch (e) {
      console.error(e);
      setAppState(AppState.ERROR);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        // For a real PDF parser we'd need pdf.js, here assuming text/json or pasting
        setInputText(text.substring(0, 2000)); // Limit char count for demo
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <FileText size={20} strokeWidth={3} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Tax<span className="text-indigo-600">.AI</span></span>
          </div>
          <div className="text-sm font-medium text-slate-500">
            FY 2024-25
          </div>
        </div>
      </nav>

      <main className="py-12 px-4">
        {appState === AppState.IDLE && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                Tax Planning, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Simplified by AI</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Paste your salary details, Form-16 text, or just describe your income. 
                We'll extract the numbers, calculate taxes, and suggest savings.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-2 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto">
                <button 
                  onClick={() => setInputText(SAMPLE_TEXT)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all whitespace-nowrap"
                >
                  Try Sample Data
                </button>
              </div>
              
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your financial details here... e.g., 'My annual CTC is 12 Lakhs, Basic is 50%...'"
                  className="w-full h-64 p-6 resize-none focus:outline-none text-lg bg-slate-900 text-white placeholder:text-slate-400"
                />
                
                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                   <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors">
                     <Upload size={18} />
                     <span className="text-sm">Upload Text</span>
                     <input type="file" className="hidden" accept=".txt,.json,.csv" onChange={handleFileUpload} />
                   </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={!inputText}
                  className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze My Tax
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
               <div className="space-y-2">
                 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <FileText size={24} />
                 </div>
                 <h3 className="font-semibold text-slate-800">Smart Extraction</h3>
                 <p className="text-sm text-slate-500">Understanding unorganized text like emails or casual notes.</p>
               </div>
               <div className="space-y-2">
                 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <CheckCircle2 size={24} />
                 </div>
                 <h3 className="font-semibold text-slate-800">Regime Comparison</h3>
                 <p className="text-sm text-slate-500">Instantly compares Old vs New tax regimes for lowest liability.</p>
               </div>
               <div className="space-y-2">
                 <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <BrainCircuit size={24} />
                 </div>
                 <h3 className="font-semibold text-slate-800">AI Savings Tips</h3>
                 <p className="text-sm text-slate-500">Personalized suggestions on how to save more tax legally.</p>
               </div>
            </div>
          </div>
        )}

        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
              <Loader2 className="animate-spin text-indigo-600 relative z-10" size={64} />
            </div>
            <h2 className="mt-8 text-2xl font-bold text-slate-800">Analyzing your finances...</h2>
            <p className="text-slate-500 mt-2 animate-pulse">Crunching numbers across tax regimes</p>
          </div>
        )}

        {appState === AppState.RESULTS && data && (
          <Dashboard
            income={data.income}
            deductions={data.deductions}
            newRegime={data.newRegime}
            oldRegime={data.oldRegime}
            advice={data.advice}
            onReset={() => setAppState(AppState.IDLE)}
          />
        )}
        
        {appState === AppState.ERROR && (
           <div className="max-w-md mx-auto text-center pt-20">
             <div className="text-red-500 mb-4 flex justify-center"><FileText size={48} /></div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h3>
             <p className="text-slate-500 mb-6">We couldn't process that text. Please try pasting cleaner data or ensure your API key is active.</p>
             <button onClick={() => setAppState(AppState.IDLE)} className="text-indigo-600 font-medium hover:underline">Try Again</button>
           </div>
        )}
      </main>
      
      <footer className="border-t border-slate-200 bg-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; 2024 Tax.AI. For demonstration purposes only.</p>
          <p className="mt-1">Not a substitute for professional CA advice. Standard Deduction assumed ₹50k (Old) / ₹75k (New).</p>
        </div>
      </footer>
    </div>
  );
};

export default App;