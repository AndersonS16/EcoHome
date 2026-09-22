import React, { useState, useEffect } from 'react';

const API_URL = 'https://ecohome-u5bx.onrender.com';
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJBcnR1cm8ifQ.signature";

export default function App() {
  const [products, setProducts] = useState([]);
  const [userDisplayName, setUserDisplayName] = useState("Arturo (6)");
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const fetchDashboardData = async () => {
    try {
      const resProd = await fetch(`${API_URL}/products`);
      const resStats = await fetch(`${API_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });

      if (resProd.ok && resStats.ok) {
        const dataProd = await resProd.json();
        const dataStats = await resStats.json();
        setProducts(dataProd);
        setUserDisplayName(dataStats.display_name || `${dataStats.username} (${dataStats.total_products})`);
      }
    } catch (err) {
      console.error("Error cargando dashboard:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!name || !price) return;

    await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ name, price: parseFloat(price) })
    });

    setName('');
    setPrice('');
    fetchDashboardData();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2 style={{ color: '#2e7d32' }}>EcoHomeStore - Panel Web React</h2>
        <div style={{ background: '#2e7d32', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
          {userDisplayName}
        </div>
      </header>

      <div style={{ margin: '20px 0' }}>
        <h3>Agregar Nuevo Producto</h3>
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '8px', width: '250px' }} />
          <input placeholder="Precio" type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={{ padding: '8px', width: '120px' }} />
          <button type="submit" style={{ padding: '8px 16px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Crear Producto
          </button>
        </form>
      </div>

      <h3>Catálogo de Productos</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {products.map((p) => (
          <li key={p.id} style={{ padding: '12px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{p.name}</strong>
              <div style={{ fontSize: '13px', color: '#666' }}>Creador: {p.creator_username || 'Arturo'}</div>
            </div>
            <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>${p.price}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}