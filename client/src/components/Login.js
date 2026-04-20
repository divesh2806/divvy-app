import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/TempAuth';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-200">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-indigo-700">DIVVY</h2>
        <h3 className="text-xl font-semibold mb-4 text-center text-gray-600">Welcome Back</h3>
        
        <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                type="email" required 
                value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        
        <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                type="password" required 
                value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        
        <button className="w-full bg-indigo-600 text-white font-bold p-3 rounded-lg hover:bg-indigo-700 transition duration-200">
            Login
        </button>
        
        <p className="mt-4 text-center text-sm text-gray-500">
          New to Divvy? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Create Account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;