import { useState, useRef, useEffect } from 'react';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import './ChatWidget.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hola, soy el Virtual Concierge del Grand Hotel. ¿En qué puedo ayudarte hoy?", sender: 'bot' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const messagesEndRef = useRef(null);
  
  // Usamos un sessionId estático por carga de página para mantener el hilo
  const [sessionId] = useState(() => "session_" + Math.random().toString(36).substring(7));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput("");
    setIsLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMsg, sessionId })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
      } else {
        setMessages(prev => [...prev, { text: "Lo siento, ha ocurrido un error de conexión.", sender: 'bot', isError: true }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { text: "Error de red al intentar contactar al Concierge.", sender: 'bot', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="chat-trigger glass" onClick={() => setIsOpen(true)}>
          💬 Concierge
        </button>
      )}

      {isOpen && (
        <div className="chat-window glass">
          <div className="chat-header">
            <h3>Virtual Concierge</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="chat-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.sender}`}>
                <div className="msg-bubble" style={msg.isError ? {backgroundColor: 'var(--error-color)', color: 'white'} : {}}>
                  {/* Para un MVP renderizamos texto crudo, para producción podríamos usar react-markdown */}
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>{line}<br/></span>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message bot">
                <div className="msg-bubble typing">Escribiendo...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-footer" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Pregunta sobre reservas, spa, mascotas..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="btn-primary" disabled={isLoading}>Enviar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
