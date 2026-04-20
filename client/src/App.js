import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// We use TempAuth because of the file renaming earlier
import { AuthProvider } from './context/TempAuth'; 
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard'; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* If user goes to /login, show Login page */}
          <Route path="/login" element={<Login />} />
          
          {/* If user goes to /register, show Register page */}
          <Route path="/register" element={<Register />} />
          
          {/* If user goes to /dashboard, show the Dashboard component you just saved */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* If user goes to root (localhost:3000), redirect to Login */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;