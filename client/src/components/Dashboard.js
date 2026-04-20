import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/TempAuth'; 
import { useNavigate } from 'react-router-dom';
import ExpenseForm from './ExpenseForm';
import { 
  IndianRupee, Users, Trash2, Plus, 
  LogOut, ArrowLeft, LayoutDashboard, UserPlus, CheckCircle2,
  Wallet, Receipt, ArrowRightLeft
} from 'lucide-react';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // 1. STATE MANAGEMENT (Unchanged)
  const [activeTab, setActiveTab] = useState('groups'); 
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]); 
  const [globalStats, setGlobalStats] = useState({ netBalance: 0, totalLent: 0, totalOwed: 0 });
  const [selectedGroup, setSelectedGroup] = useState(null); 
  const [selectedFriend, setSelectedFriend] = useState(null); 
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false); 
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [settledItems, setSettledItems] = useState([]); 
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState('');
  const [memberEmailToAdd, setMemberEmailToAdd] = useState('');
  const [friendEmailToAdd, setFriendEmailToAdd] = useState(''); 

  // 2. DATA FETCHING (Unchanged)
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const config = { headers: { 'x-auth-token': token } };

      const [groupRes, friendRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/groups', config),
        axios.get('http://localhost:5000/api/friends', config),
        axios.get('http://localhost:5000/api/expenses/global-stats', config).catch(() => ({ data: { netBalance: 0, totalLent: 0, totalOwed: 0 } }))
      ]);

      setGroups(groupRes.data || []);
      setFriends(friendRes.data || []);
      setGlobalStats(statsRes.data || { netBalance: 0, totalLent: 0, totalOwed: 0 });

      let queryParam = '';
      if (selectedGroup) queryParam = `?group=${selectedGroup._id}`;
      else if (selectedFriend) queryParam = `?friend=${selectedFriend._id}`;

      if (queryParam) {
        const [expRes, balRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/expenses${queryParam}`, config),
          axios.get(`http://localhost:5000/api/expenses/balances${queryParam}`, config)
        ]);
        setExpenses(expRes.data || []);
        setBalances(balRes.data || {});
      } else {
        setExpenses([]);
        setBalances({});
      }
    } catch (err) {
      if (err.response?.status === 401) { logout(); navigate('/login'); }
    }
  }, [selectedGroup, selectedFriend, logout, navigate]); 

  useEffect(() => { fetchData(); }, [fetchData]);

  // 3. SETTLEMENT LOGIC (Unchanged)
  useEffect(() => {
    if (!balances || Object.keys(balances).length === 0) { setTransactions([]); return; }
    const people = Object.entries(balances).filter(([name]) => name && name !== "null");
    const creditors = people.filter(([_, amt]) => amt > 0).map(([name, amt]) => ({ name, amt }));
    const debtors = people.filter(([_, amt]) => amt < 0).map(([name, amt]) => ({ name, amt: Math.abs(amt) }));
    const newTransactions = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amt, creditors[j].amt);
      if (amount > 0.01) newTransactions.push({ from: debtors[i].name, to: creditors[j].name, amount: amount.toFixed(2) });
      debtors[i].amt -= amount; creditors[j].amt -= amount;
      if (debtors[i].amt < 0.01) i++;
      if (creditors[j].amt < 0.01) j++;
    }
    setTransactions(newTransactions);
  }, [balances]);

  // 4. HANDLERS (Unchanged)
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/groups/add', { name: newGroupName, members: newGroupMembers }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
      setShowGroupModal(false); setNewGroupName(''); setNewGroupMembers(''); fetchData(); 
    } catch (err) { alert("Error creating group"); }
  };
  const handleAddFriend = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/friends/add', { email: friendEmailToAdd }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
      setShowFriendModal(false); setFriendEmailToAdd(''); fetchData(); 
    } catch (err) { alert("Error adding friend"); }
  };
  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`http://localhost:5000/api/groups/${selectedGroup._id}/add-member`, { email: memberEmailToAdd }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
      setSelectedGroup(res.data); setShowAddMemberModal(false); setMemberEmailToAdd(''); fetchData();
    } catch (err) { alert("User not found"); }
  };
  const handleDeleteGroup = async (e, groupId) => {
    e.stopPropagation(); 
    if (window.confirm("Delete this group? All records will be lost.")) {
      try {
        await axios.delete(`http://localhost:5000/api/groups/${groupId}`, { headers: { 'x-auth-token': localStorage.getItem('token') } });
        if (selectedGroup?._id === groupId) setSelectedGroup(null); fetchData();
      } catch (err) { alert("Error deleting"); }
    }
  };
  const handleSettleUp = async (t, index) => {
    try {
      await axios.post('http://localhost:5000/api/expenses/settle-up', {
        from: t.from, to: t.to, amount: t.amount, groupId: selectedGroup ? selectedGroup._id : null
      }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
      setSettledItems([...settledItems, index]);
      setTimeout(() => { fetchData(); setSettledItems(prev => prev.filter(item => item !== index)); }, 1500);
    } catch (err) { alert("Error during settlement"); }
  };

  // 5. REFINED UI
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR - Clean Dark Mode */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8 cursor-pointer text-white" onClick={() => { setSelectedGroup(null); setSelectedFriend(null); }}>
            <Wallet className="text-blue-500" size={28} />
            <h1 className="text-xl font-bold tracking-tight">Divvy</h1>
          </div>
          
          <div className="flex bg-slate-800/50 p-1 rounded-lg mb-6 border border-slate-700/50">
            <button 
              onClick={() => { setActiveTab('groups'); setSelectedGroup(null); setSelectedFriend(null); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'groups' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            > Groups </button>
            <button 
              onClick={() => { setActiveTab('friends'); setSelectedGroup(null); setSelectedFriend(null); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'friends' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            > Friends </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar">
          {activeTab === 'groups' ? (
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Groups</span>
                <button onClick={() => setShowGroupModal(true)} className="text-slate-400 hover:text-white transition-colors"><Plus size={16}/></button>
              </div>
              <div className="space-y-1">
                {groups.map(group => (
                  <div key={group._id} onClick={() => { setSelectedGroup(group); setSelectedFriend(null); }} className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${selectedGroup?._id === group._id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
                    <span className="text-sm font-medium truncate">{group.name}</span>
                    <button onClick={(e) => handleDeleteGroup(e, group._id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Friends</span>
                <button onClick={() => setShowFriendModal(true)} className="text-slate-400 hover:text-white transition-colors"><UserPlus size={16}/></button>
              </div>
              <div className="space-y-1">
                {friends.map(friend => (
                  <div key={friend._id} onClick={() => { setSelectedFriend(friend); setSelectedGroup(null); }} className={`px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${selectedFriend?._id === friend._id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
                    <span className="text-sm font-medium truncate">{friend.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
              <button onClick={() => { logout(); navigate('/login'); }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Sign out</button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        {!selectedGroup && !selectedFriend ? (
          <div className="max-w-4xl mx-auto mt-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-500 mb-8">Welcome back, {user?.name}. Here's where you stand.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-slate-500"><ArrowRightLeft size={18} /><span className="text-sm font-medium">Total Lent</span></div>
                <span className="text-3xl font-semibold text-emerald-600">₹{globalStats.totalLent?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-slate-500"><Receipt size={18} /><span className="text-sm font-medium">Total Owed</span></div>
                <span className="text-3xl font-semibold text-rose-600">₹{globalStats.totalOwed?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col text-white">
                <div className="flex items-center gap-2 mb-4 text-slate-400"><Wallet size={18} /><span className="text-sm font-medium">Net Balance</span></div>
                <span className="text-3xl font-semibold">₹{globalStats.netBalance?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <header className="mb-8 flex justify-between items-end border-b border-slate-200 pb-6">
              <div>
                <button onClick={() => { setSelectedGroup(null); setSelectedFriend(null); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-2">
                  <ArrowLeft size={16}/> Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-slate-900">{selectedGroup ? selectedGroup.name : selectedFriend.name}</h1>
              </div>
              {selectedGroup && (
                <button onClick={() => setShowAddMemberModal(true)} className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors border border-blue-200">
                  <UserPlus size={16}/> Add Member
                </button>
              )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT COL: Action Form & Balances */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Wrap ExpenseForm in a cleaner container */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <ExpenseForm onAdd={fetchData} selectedGroup={selectedGroup} selectedFriend={selectedFriend} />
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><IndianRupee size={16} className="text-slate-400"/> Balances</h2>
                  <div className="space-y-0 divide-y divide-slate-100">
                    {Object.entries(balances).length === 0 ? <p className="text-slate-500 text-sm py-2">Settled up!</p> : 
                      Object.entries(balances).map(([name, amount]) => (
                        <div key={name} className="flex justify-between items-center py-3">
                          <span className="text-sm text-slate-700 font-medium">{name}</span>
                          <span className={`text-sm font-semibold ${amount > 0 ? 'text-emerald-600' : amount < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {amount > 0 ? '+' : ''}₹{amount === 0 ? '0.00' : amount.toFixed(2)}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><Users size={16} className="text-slate-400"/> How to settle</h2>
                  <div className="space-y-3">
                    {transactions.length === 0 ? (
                      <p className="text-slate-500 text-sm py-2">No debts to settle.</p>
                    ) : (
                      transactions.map((t, index) => (
                        <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                          {settledItems.includes(index) ? (
                            <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium animate-pulse">
                              <CheckCircle2 size={16} /> Settled
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-slate-500 mb-1"><span className="font-semibold text-slate-800">{t.from}</span> pays <span className="font-semibold text-slate-800">{t.to}</span></p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-lg font-semibold text-slate-900">₹{t.amount}</span>
                                <button onClick={() => handleSettleUp(t, index)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                                  Record Payment
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COL: Feed */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
                  <h2 className="text-lg font-semibold text-slate-800 mb-6">Activity</h2>
                  <div className="space-y-0 divide-y divide-slate-100">
                    {expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                          <Receipt size={48} className="mb-4 opacity-20" />
                          <p className="text-sm">No expenses recorded yet.</p>
                        </div>
                    ) :
                      expenses.map((exp) => (
                        <div key={exp._id} className="py-4 flex justify-between items-center group">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                              <Receipt size={18} className="text-slate-500" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900">{exp.description}</h3>
                              <p className="text-xs text-slate-500 mt-0.5"><span className="font-medium text-slate-700">{exp.payer}</span> paid ₹{exp.amount}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {exp.splitAmong?.map((name, i) => (
                                    <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{name}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <span className="text-lg font-semibold text-slate-900">₹{exp.amount}</span>
                              <button onClick={async () => { if(window.confirm("Delete this expense?")) { await axios.delete(`http://localhost:5000/api/expenses/${exp._id}`, { headers: { 'x-auth-token': localStorage.getItem('token') } }); fetchData(); } }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 hover:bg-rose-50 rounded-lg">
                                <Trash2 size={16}/>
                              </button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODALS ================= */}
      {/* (Modals restyled with subtle borders, normal font weights, and standard padding) */}
      
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Create a Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Group Name</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" placeholder="e.g. Weekend Trip" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Members (Emails)</label>
                <input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" placeholder="jane@example.com, john@example.com" value={newGroupMembers} onChange={e => setNewGroupMembers(e.target.value)} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGroupModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFriendModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Add a Friend</h2>
            <p className="text-sm text-slate-500 mb-4">Add a user by their registered email.</p>
            <form onSubmit={handleAddFriend} className="space-y-4">
              <input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="friend@example.com" value={friendEmailToAdd} onChange={e => setFriendEmailToAdd(e.target.value)} required />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFriendModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">Add Friend</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMemberModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Invite Member</h2>
            <p className="text-sm text-slate-500 mb-4">Add to {selectedGroup?.name}</p>
            <form onSubmit={handleAddMember} className="space-y-4">
              <input className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="user@example.com" value={memberEmailToAdd} onChange={e => setMemberEmailToAdd(e.target.value)} required />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;