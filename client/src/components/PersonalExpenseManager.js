import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Wallet, Landmark, PlusCircle, MinusCircle, History, TrendingDown, Calendar } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

function PersonalExpenseManager() {
  const [stats, setStats] = useState({ cashBalance: 0, digitalBalance: 0, categoryBreakdown: {} });
  const [transactions, setTransactions] = useState([]);
  
  // Forms state
  const [type, setType] = useState('expense');
  const [accountType, setAccountType] = useState('digital');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchPersonalData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const config = { headers: { 'x-auth-token': token } };

      const [statsRes, transRes] = await Promise.all([
        axios.get('http://localhost:5000/api/personal/stats', config),
        axios.get('http://localhost:5000/api/personal', config)
      ]);

      setStats(statsRes.data);
      setTransactions(transRes.data);
    } catch (err) {
      console.error("Error fetching personal data", err);
    }
  }, []);

  useEffect(() => {
    fetchPersonalData();
  }, [fetchPersonalData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/personal/add', {
        type,
        accountType,
        amount: parseFloat(amount),
        category: type === 'expense' ? category : 'Funds Added',
        description,
        date: transactionDate
      }, { headers: { 'x-auth-token': token } });

      setAmount('');
      setDescription('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      fetchPersonalData();
    } catch (err) {
      alert("Error adding transaction");
    }
  };

  const chartData = Object.entries(stats.categoryBreakdown).map(([name, value]) => ({ name, value }));

  // DAILY SPENDING LOGIC
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const currentYear = new Date().getFullYear();
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const daysInSelectedMonth = getDaysInMonth(selectedMonth, currentYear);
  
  const dailyData = Array.from({ length: daysInSelectedMonth }, (_, i) => ({
    day: i + 1,
    amount: 0
  }));

  transactions.forEach(t => {
    if (t.type === 'expense') {
      const date = new Date(t.date);
      if (date.getFullYear() === currentYear && date.getMonth() === selectedMonth) {
        // -1 because array is 0-indexed while day is 1-indexed
        dailyData[date.getDate() - 1].amount += t.amount;
      }
    }
  });

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const displayedTransactions = filterDate 
    ? transactions.filter(t => {
        const d = new Date(t.date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayNum = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dayNum}` === filterDate;
      })
    : transactions;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Personal Wallet</h1>
        <p className="text-slate-500">Track your independent digital and cash balances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl text-white shadow-lg flex items-center justify-between">
          <div>
            <p className="text-blue-100 font-medium mb-1">Digital Balance</p>
            <h2 className="text-4xl font-bold">₹{stats.digitalBalance.toFixed(2)}</h2>
          </div>
          <Landmark size={48} className="opacity-20" />
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl text-white shadow-lg flex items-center justify-between">
          <div>
            <p className="text-emerald-100 font-medium mb-1">Cash Balance</p>
            <h2 className="text-4xl font-bold">₹{stats.cashBalance.toFixed(2)}</h2>
          </div>
          <Wallet size={48} className="opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD TRANSACTION FORM */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm self-start">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PlusCircle size={20} className="text-blue-600"/> Add Transaction
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button type="button" onClick={() => setType('expense')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}>Expense</button>
              <button type="button" onClick={() => setType('income')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Add Funds</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account</label>
                <select value={accountType} onChange={e => setAccountType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="digital">Digital (Bank)</option>
                  <option value="cash">Cash (Wallet)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>

            {type === 'expense' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Health">Health</option>
                  <option value="General">General</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder={type === 'income' ? 'e.g. ATM Withdrawal' : 'e.g. Morning Coffee'} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" required />
            </div>

            <button type="submit" className={`w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all ${type === 'expense' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              Record {type === 'expense' ? 'Expense' : 'Income'}
            </button>
          </form>
        </div>

        {/* ANALYSIS CHART */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 w-full flex items-center gap-2">
            <TrendingDown size={20} className="text-rose-500"/> Spending Analysis
          </h3>
          {chartData.length === 0 ? (
            <div className="text-slate-400 text-sm py-20">No expenses recorded yet.</div>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* FEED */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-h-[500px] overflow-y-auto custom-scrollbar flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History size={20} className="text-slate-500"/> Activity
            </h3>
            <input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="text-xs px-2 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-4">
            {displayedTransactions.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">
                {filterDate ? "No activity on this date." : "No personal transactions."}
              </p>
            ) : (
              displayedTransactions.map(t => (
                <div key={t._id} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      {t.type === 'income' ? <PlusCircle size={16}/> : <MinusCircle size={16}/>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.description}</p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
                        {t.accountType} • {t.type === 'expense' ? t.category : 'Income'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                    </p>
                    <button onClick={async () => {
                       if(window.confirm('Delete record?')) {
                          await axios.delete(`http://localhost:5000/api/personal/${t._id}`, { headers: { 'x-auth-token': localStorage.getItem('token') }});
                          fetchPersonalData();
                       }
                    }} className="text-xs text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* DAILY SPENDING CHART */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-500"/> Daily Spending Analysis
          </h3>
          <select 
            value={selectedMonth} 
            onChange={e => { setSelectedMonth(Number(e.target.value)); setSelectedDay(null); }} 
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `₹${val}`} />
              <Tooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`₹${value.toFixed(2)}`, 'Spent']} labelFormatter={(label) => `${MONTHS[selectedMonth]} ${label}, ${currentYear}`} />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} onClick={(data) => { if (data && data.day) setSelectedDay(data.day) }} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CLICKED DATE DETAILS */}
        {selectedDay && (
          <div className="mt-6 border-t border-slate-100 pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-slate-800">
                Transactions on {MONTHS[selectedMonth]} {selectedDay}, {currentYear}
              </h4>
              <button onClick={() => setSelectedDay(null)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded">Hide Details</button>
            </div>
            
            <div className="space-y-2">
              {(() => {
                const dayTransactions = transactions
                  .filter(t => t.type === 'expense')
                  .filter(t => {
                    const d = new Date(t.date);
                    return d.getFullYear() === currentYear && d.getMonth() === selectedMonth && d.getDate() === selectedDay;
                  });

                if (dayTransactions.length === 0) {
                  return <p className="text-xs text-slate-400">No transactions found for this particular date.</p>;
                }

                return dayTransactions.map(t => (
                  <div key={t._id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg text-sm">
                     <div>
                       <p className="font-medium text-slate-900">{t.description}</p>
                       <p className="text-xs text-slate-500">{t.category}</p>
                     </div>
                     <p className="font-bold text-slate-700">₹{t.amount.toFixed(2)}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}

export default PersonalExpenseManager;
