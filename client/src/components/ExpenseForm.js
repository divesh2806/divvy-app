import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, CheckSquare, Square } from 'lucide-react';
import { AuthContext } from '../context/TempAuth';

function ExpenseForm({ onAdd, selectedGroup, selectedFriend }) {
  const { user } = useContext(AuthContext); 
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState('');
  const [splitAmong, setSplitAmong] = useState([]);

  // 1. DETERMINE PARTICIPANTS SAFELY
  let participants = [];
  let isGroup = false;

  if (selectedGroup && selectedGroup.members) {
    participants = selectedGroup.members;
    isGroup = true;
  } else if (selectedFriend && user) {
    // 1-on-1: Create a mini "group" of just you and your friend
    participants = [
      { _id: user.id || user._id, name: user.name || "Me" },
      { _id: selectedFriend._id, name: selectedFriend.name }
    ];
  }

  // 2. AUTO-SELECT EVERYONE WHEN SWITCHING TABS
  useEffect(() => {
    if (participants.length > 0) {
      setPayer(participants[0].name);
      setSplitAmong(participants.map(m => m.name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, selectedFriend]); 

  const toggleMember = (name) => {
    if (splitAmong.includes(name)) {
      setSplitAmong(splitAmong.filter(m => m !== name));
    } else {
      setSplitAmong([...splitAmong, name]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (splitAmong.length === 0) {
      alert("Please select at least one person to split with!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/expenses/add', {
        description,
        amount: parseFloat(amount),
        payer, 
        splitAmong, 
        groupId: isGroup ? selectedGroup._id : null,
        friendId: !isGroup ? selectedFriend._id : null
      }, { headers: { 'x-auth-token': token } });

      setDescription('');
      setAmount('');
      onAdd(); 
    } catch (err) {
      alert(err.response?.data?.msg || "Error adding expense");
    }
  };

  if (participants.length === 0) return null;

  return (
    <div className="p-6 bg-white">
      <h2 className="text-sm font-semibold text-slate-800 mb-5 flex items-center gap-2">
        <Plus size={16} className="text-blue-600"/> Add an Expense
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* DESCRIPTION INPUT */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
          <input 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
            placeholder="e.g. Dinner at Luigi's"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        
        {/* AMOUNT INPUT */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 font-medium text-sm">₹</span>
            <input 
              type="number"
              step="0.01"
              min="0"
              className="w-full pl-8 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        {/* PAYER SELECTION */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Paid By</label>
          <select 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white cursor-pointer transition-all"
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
          >
            {participants.map(p => (
              <option key={p._id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* SPLIT AMONG SELECTION */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Split Among</label>
          <div className="grid grid-cols-2 gap-2">
            {participants.map(p => (
              <div 
                key={p._id}
                onClick={() => toggleMember(p.name)}
                className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors border ${
                  splitAmong.includes(p.name) 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                {splitAmong.includes(p.name) ? 
                  <CheckSquare size={16} className="text-blue-600 flex-shrink-0" /> : 
                  <Square size={16} className="text-slate-300 flex-shrink-0" />
                }
                <span className={`text-sm font-medium truncate ${splitAmong.includes(p.name) ? 'text-blue-900' : 'text-slate-600'}`}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button 
          type="submit"
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 active:scale-95 transition-all mt-6 text-sm flex justify-center items-center gap-2"
        >
          Add to {isGroup ? 'Group' : 'Friend'}
        </button>
      </form>
    </div>
  );
}

export default ExpenseForm;