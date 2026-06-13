import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import "./ChatWidget.css";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "👋 ¡Hola! Soy el asistente virtual de BookingSys.\n\nPuedo ayudarte con:\n🏨 Buscar hoteles disponibles\n📋 Consultar tus reservas\nℹ️ Políticas de hotel (mascotas, cancelaciones...)\n\n¿En qué puedo ayudarte hoy?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const messagesEndRef = useRef(null);

  // sessionId persistente (localStorage) para mantener el hilo entre recargas.
  const [sessionId] = useState(() => {
    let id = localStorage.getItem("chat_session_id");
    if (!id) {
      id = "session_" + Math.random().toString(36).substring(7);
      localStorage.setItem("chat_session_id", id);
    }
    return id;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Al montar, recuperamos el historial de la sesión (si existe en el servidor).
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/chat/history/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.history && data.history.length > 0) {
          setMessages(
            data.history.map((m) => ({
              text: m.content,
              sender: m.role === "user" ? "user" : "bot",
            })),
          );
        }
      } catch {
        // Silencioso: si falla, se mantiene el mensaje de bienvenida.
      }
    };
    loadHistory();
  }, [sessionId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { text: userMsg, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userMsg, sessionId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { text: data.reply, sender: "bot" }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            text: "Lo siento, ha ocurrido un error de conexión.",
            sender: "bot",
            isError: true,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Error de red al intentar contactar al Chatbot.",
          sender: "bot",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-widget ${isOpen ? "open" : ""}`}>
      {!isOpen && (
        <button className="chat-trigger glass" onClick={() => setIsOpen(true)}>
          💬 Chatbot
        </button>
      )}

      {isOpen && (
        <div className="chat-window glass">
          <div className="chat-header">
            <h3>Chatbot</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div className="chat-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.sender}`}>
                <div
                  className="msg-bubble"
                  style={
                    msg.isError
                      ? {
                          backgroundColor: "#ef4444",
                          color: "white",
                        }
                      : {}
                  }
                >
                  {/* El bot responde en markdown (negritas, viñetas); el mensaje
                      del usuario se muestra como texto plano respetando saltos. */}
                  {msg.sender === "bot" ? (
                    <div className="msg-markdown">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))
                  )}
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
            <button type="submit" className="btn-primary" disabled={isLoading}>
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
