import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function Chat() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Conectar WebSocket pasando el JWT
    const newSocket = io('https://ecohome-u5bx.onrender.com', {
      auth: { token }
    });

    // 1. Cargar historial de 10 mensajes
    newSocket.on('messages', (history) => {
      setMessages(history);
      scrollToBottom();
    });

    // 2. Escuchar broadcasts
    newSocket.on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    
    socket.emit('new-message', { text });
    setText('');
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 flex flex-col h-[450px]">
      <div className="bg-emerald-800 text-white p-3.5 rounded-t-xl font-bold text-sm flex items-center justify-between">
        <span>💬 Chat en Tiempo Real</span>
        <span className="text-[10px] bg-emerald-600 px-2 py-0.5 rounded-full">Socket.IO</span>
      </div>
      
      {/* Contenedor de Mensajes */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-xs text-center mt-4">Sin mensajes en el historial.</p>
        ) : (
          messages.map((m, idx) => (
            <div key={m.id || idx} className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-emerald-800">{m.username || 'Anónimo'}</span>
                {m.created_at && (
                  <span className="text-[10px] text-gray-400">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="text-gray-700">{m.text}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensaje */}
      <form onSubmit={sendMessage} className="p-2.5 border-t border-gray-200 flex gap-2 bg-white rounded-b-xl">
        <input 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Escribe un mensaje..." 
          className="flex-1 border border-gray-300 text-xs p-2.5 rounded-lg focus:outline-none focus:border-emerald-600" 
        />
        <button 
          type="submit" 
          className="bg-emerald-600 text-white text-xs px-4 rounded-lg font-bold hover:bg-emerald-700 transition"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}