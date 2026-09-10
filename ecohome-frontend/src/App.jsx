import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // 1. Manejo del Login vía HTTP POST
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('jwt_token', data.token);
        setToken(data.token);
      } else {
        setLoginError(data.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setLoginError('Error al conectar con el servidor de autenticación');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    if (socket) socket.disconnect();
    setToken('');
    setMessages([]);
  };

  // 2. Conexión WebSocket y Listeners cuando existe un Token
  useEffect(() => {
    if (!token) return;

    const newSocket = io(API_URL, {
      auth: { token },
    });

    // Carga de historial inicial (Últimos 10 mensajes)
    newSocket.on('load-history', (historyMessages) => {
      setMessages(historyMessages);
    });

    // Escuchar mensajes transmitidos en tiempo real
    newSocket.on('receive-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Error de Socket.IO:', err.message);
      if (err.message.includes('Autenticación fallida')) {
        handleLogout();
      }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [token]);

  // 3. Envío de mensaje en vivo
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('new-message', newMessage);
      setNewMessage('');
    }
  };

  // VISTA 1: FORMULARIO DE LOGIN
  if (!token) {
    return (
      <div style={styles.container}>
        <h2>EcoHomeStore - Acceso Interno</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          {loginError && <p style={styles.error}>{loginError}</p>}
          <div style={styles.inputGroup}>
            <label>Correo Electrónico:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.button}>Ingresar</button>
        </form>
      </div>
    );
  }

  // VISTA 2: PANTALLA DE CHAT EN TIEMPO REAL
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Chat de Soporte EcoHomeStore</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
      </div>

      <div style={styles.chatBox}>
        {messages.map((msg) => (
          <div key={msg.id || Math.random()} style={styles.messageItem}>
            <strong>{msg.username}: </strong>
            <span>{msg.text}</span>
            <small style={styles.time}>
              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ''}
            </small>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} style={styles.sendForm}>
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={styles.chatInput}
        />
        <button type="submit" style={styles.button}>Enviar</button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px', margin: '30px auto', fontFamily: 'Arial, sans-serif', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  input: { padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' },
  button: { padding: '10px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  logoutBtn: { padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { color: 'red', fontSize: '14px' },
  chatBox: { height: '350px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px', marginBottom: '15px', backgroundColor: '#f9f9f9' },
  messageItem: { marginBottom: '10px', padding: '6px 10px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
  time: { display: 'block', fontSize: '10px', color: '#888', marginTop: '3px' },
  sendForm: { display: 'flex', gap: '10px' },
  chatInput: { flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' },
};

export default App;