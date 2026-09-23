import React from 'react';

export default function Header({ user, statsCount, onLogout }) {
  return (
    <header className="bg-emerald-700 text-white p-4 shadow-md flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌱</span>
        <h1 className="text-xl font-bold tracking-wide">EcoHomeStore</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Muestra NombreUsuario (N) */}
        <span className="bg-emerald-800 px-3 py-1.5 rounded-full text-sm font-semibold border border-emerald-500 shadow-inner">
          👤 {user?.username || 'Usuario'} ({statsCount})
        </span>
        
        <button 
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded font-bold transition shadow"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}