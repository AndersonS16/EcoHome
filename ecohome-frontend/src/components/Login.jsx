import React, { useState } from 'react';
import API from '../api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('Carlos');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await API.post('/auth/login', { username, password });
      
      // Guardar sesión en LocalStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ username, id: data.id }));
      
      onLoginSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas o error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm border border-gray-200">
        <div className="text-center mb-6">
          <span className="text-4xl">🌱</span>
          <h2 className="text-2xl font-bold text-emerald-800 mt-2">EcoHome Login</h2>
          <p className="text-xs text-gray-500">Ingresa tus credenciales para acceder</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 text-xs rounded p-2.5 mb-4 text-center">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-700 mb-1">Usuario</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="w-full border border-gray-300 p-2.5 rounded text-sm focus:outline-none focus:border-emerald-600"
            required 
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full border border-gray-300 p-2.5 rounded text-sm focus:outline-none focus:border-emerald-600"
            required 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-sm transition shadow disabled:opacity-50"
        >
          {loading ? 'Autenticando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}