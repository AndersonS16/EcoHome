import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Header from './components/Header';
import Products from './components/Products';
import Chat from './components/Chat';
import API from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [statsCount, setStatsCount] = useState(0);

  // Obtener estadísticas del usuario
  const fetchStats = async () => {
    try {
      const { data } = await API.get('/users/stats');
      // Si la API retorna count, lo asignamos; de lo contrario mantenemos el valor actual
      if (data && typeof data.count === 'number') {
        setStatsCount(data.count);
      }
    } catch (err) {
      console.error('Error al cargar stats:', err);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      fetchStats();
    }
  }, []);

  const handleLoginSuccess = (data) => {
    setUser({ username: data.username, id: data.id });
    fetchStats();
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  // Función que incrementa el contador al crear un producto
  const handleProductCreated = () => {
    setStatsCount((prevCount) => prevCount + 1); // Incremento directo en pantalla
    fetchStats(); // Sincronización con el servidor
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} statsCount={statsCount} onLogout={handleLogout} />
      
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📦 Catálogo de Productos</h2>
          <Products onProductCreated={handleProductCreated} />
        </div>
        
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">💬 Chat Persistente</h2>
          <Chat />
        </div>
      </main>
    </div>
  );
}