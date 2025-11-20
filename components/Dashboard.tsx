import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { IncomeDetails, Deductions, TaxResult, AiAdvice } from '../types';
import { Download, RefreshCcw, TrendingDown, TrendingUp, ShieldCheck, BrainCircuit } from 'lucide-react';

interface DashboardProps {
  income: IncomeDetails;
  deductions: Deductions;
  newRegime: TaxResult;
  oldRegime: TaxResult;
  advice: AiAdvice | null;
  onReset: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const Dashboard: React.FC<DashboardProps> = ({ income, deductions, newRegime, oldRegime, advice, onReset }) => {
  const bestRegime = newRegime.totalTax < oldRegime.totalTax ? 'New Regime' : 'Old Regime';
  const savings = Math.abs(newRegime.totalTax - oldRegime.totalTax);

  const chartData = [
    {
      name: 'Old Regime',
      Tax: oldRegime.totalTax,
      'Net Income': income.grossSalary - oldRegime.totalTax,
    },
    {
      name: 'New Regime',
      Tax: newRegime.totalTax,
      'Net Income': income.grossSalary - newRegime.totalTax,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8 animate-fade-in-up">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Tax Analysis Report</h2>
        <button 
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCcw size={16} /> Start Over
        </button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recommendation Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg transform hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <span className="text-indigo-100 font-medium">Recommended</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{bestRegime}</h3>
          <p className="text-indigo-100 text-sm mb-4">Based on your current deductions</p>
          {savings > 0 ? (
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm">
              <TrendingDown size={16} />
              <span>Saves you {formatCurrency(savings)}</span>
            </div>
          ) : (
            <div className="text-sm opacity-90">Both regimes result in equal tax.</div>
          )}
        </div>

        {/* Income Summary */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h4 className="text-slate-500 text-sm font-medium mb-4 uppercase tracking-wider">Annual Income</h4>
          <div className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(income.grossSalary)}</div>
          <div className="space-y-2">
             <div className="flex justify-between text-sm text-slate-600">
               <span>Basic Salary</span>
               <span>{formatCurrency(income.basicSalary)}</span>
             </div>
             <div className="flex justify-between text-sm text-slate-600">
               <span>HRA Received</span>
               <span>{formatCurrency(income.hraReceived)}</span>
             </div>
          </div>
        </div>

        {/* Tax Liability */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
           <h4 className="text-slate-500 text-sm font-medium mb-4 uppercase tracking-wider">Projected Tax</h4>
           <div className="text-3xl font-bold text-slate-900 mb-2">
             {formatCurrency(Math.min(newRegime.totalTax, oldRegime.totalTax))}
           </div>
           <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
             <div 
               className="bg-emerald-500 h-full rounded-full" 
               style={{ width: `${Math.min(((newRegime.totalTax / income.grossSalary) * 100), 100)}%` }}
             ></div>
           </div>
           <p className="text-xs text-slate-500 text-right">
             Effective Rate: {Math.min(newRegime.effectiveRate, oldRegime.effectiveRate).toFixed(1)}%
           </p>
        </div>
      </div>

      {/* AI Advice Section */}
      {advice && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
               <BrainCircuit size={32} />
             </div>
             <div className="flex-1">
                <h3 className="text-xl font-bold text-emerald-900 mb-2">AI Tax Expert Analysis</h3>
                <p className="text-emerald-800 mb-6 leading-relaxed">{advice.summary}</p>
                
                {advice.suggestions.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {advice.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">{suggestion.category}</div>
                        <div className="font-medium text-slate-800 mb-2">{suggestion.action}</div>
                        <div className="text-sm text-slate-500">Potential Saving: <span className="font-semibold text-emerald-600">{formatCurrency(suggestion.estimatedSaving)}</span></div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Comparisons & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Regime Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Tax" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} barSize={60} />
              <Bar dataKey="Net Income" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Calculation Breakdown</h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
               <span className="text-slate-600 font-medium">Taxable Income (Old)</span>
               <span className="font-bold text-slate-900">{formatCurrency(oldRegime.taxableIncome)}</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
               <span className="text-slate-600 font-medium">Taxable Income (New)</span>
               <span className="font-bold text-slate-900">{formatCurrency(newRegime.taxableIncome)}</span>
             </div>

             <div className="pt-4 border-t border-slate-100">
               <h4 className="text-sm font-semibold text-slate-500 mb-3">Deductions Considered (Old Regime)</h4>
               <ul className="space-y-2 text-sm text-slate-600">
                 <li className="flex justify-between"><span>Standard Deduction</span><span>₹50,000</span></li>
                 <li className="flex justify-between"><span>80C Investments</span><span>{formatCurrency(Math.min(deductions.section80C, 150000))}</span></li>
                 <li className="flex justify-between"><span>80D Medical</span><span>{formatCurrency(deductions.section80D)}</span></li>
                 <li className="flex justify-between"><span>HRA Exemption</span><span>{formatCurrency(oldRegime.totalTax === 0 && oldRegime.taxableIncome === 0 ? 0 : calculateHRAExemption(income.basicSalary, income.hraReceived, income.rentPaid))} (approx)</span></li>
               </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const calculateHRAExemption = (basic: number, hra: number, rent: number) => {
    // Quick recalculation for display using utils logic
    if(rent === 0) return 0;
    return Math.max(0, Math.min(hra, basic * 0.5, rent - (basic * 0.1)));
}

export default Dashboard;
