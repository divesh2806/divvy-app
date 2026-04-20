import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/TempAuth';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(name, email, password);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-200">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-green-600">DIVVY</h2>
        <h3 className="text-xl font-semibold mb-4 text-center text-gray-600">Create Account</h3>
        
        <input className="w-full mb-4 p-3 border rounded-lg" type="text" placeholder="Full Name" required 
            value={name} onChange={e => setName(e.target.value)} />
        
        <input className="w-full mb-4 p-3 border rounded-lg" type="email" placeholder="Email Address" required 
            value={email} onChange={e => setEmail(e.target.value)} />
            
        <input className="w-full mb-6 p-3 border rounded-lg" type="password" placeholder="Password (6+ chars)" required 
            value={password} onChange={e => setPassword(e.target.value)} />
            
        <button className="w-full bg-green-600 text-white font-bold p-3 rounded-lg hover:bg-green-700 transition duration-200">
            Sign Up
        </button>
        
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;