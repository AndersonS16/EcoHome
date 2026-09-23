import React, { useState, useEffect } from 'react';
import API from '../api';

export default function Products({ onProductCreated }) {
    const [products, setProducts] = useState([]);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchProducts = async () => {
        try {
            const { data } = await API.get('/products');
            setProducts(data);
        } catch (err) {
            console.error('Error al obtener productos:', err);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!name || !price) return;

        setLoading(true);
        try {
            await API.post('/products', { name, price: parseFloat(price) });
            setName('');
            setPrice('');
            await fetchProducts();
            if (onProductCreated) onProductCreated(); // Refresca el contador del Header
        } catch (err) {
            alert(err.response?.data?.message || 'Error al crear el producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Formulario de Creación */}
            <form onSubmit={handleCreateProduct} className="bg-white p-4 rounded-xl shadow border border-gray-200 flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nombre del Producto</label>
                    <input
                        type="text"
                        placeholder="Ej. Panel Solar 100W"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-emerald-600"
                        required
                    />
                </div>

                <div className="w-full md:w-36">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Precio ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="49.99"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-emerald-600"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition shadow disabled:opacity-50 whitespace-nowrap"
                >
                    {loading ? 'Guardando...' : '+ Crear Producto'}
                </button>
            </form>

            {/* Lista / Catálogo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.length === 0 ? (
                    <p className="text-gray-500 text-sm italic col-span-2 text-center py-6">No hay productos disponibles.</p>
                ) : (
                    products.map((prod) => (
                        <div key={prod.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition">
                            <div>
                                <h3 className="font-bold text-gray-800 text-base">{prod.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Creador: <span className="font-semibold text-emerald-700">{prod.creator_username || 'Anónimo'}</span>
                                </p>
                            </div>
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1.5 rounded-lg text-sm border border-emerald-200">
                                ${parseFloat(prod.price).toFixed(2)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}