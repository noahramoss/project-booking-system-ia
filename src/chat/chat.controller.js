import AppError from "../utils/AppError.js";

export const handleChat = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return next(new AppError("El mensaje no puede estar vacío", 400));
    }

    const session = sessionId || req.user?.id || "anonymous_" + Math.random().toString(36).substring(7);
    const token = req.headers.authorization || "";
    
    // Conectar con el microservicio de Python (URL configurable para producción)
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const response = await fetch(`${aiServiceUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({
        message,
        session_id: session
      })
    });

    if (!response.ok) {
      throw new AppError("Error de comunicación con el servicio de Inteligencia Artificial", 502);
    }

    const data = await response.json();
    
    res.status(200).json({ reply: data.reply, sessionId: session });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

    const response = await fetch(
      `${aiServiceUrl}/history/${encodeURIComponent(sessionId)}`,
    );

    if (!response.ok) {
      return res.status(200).json({ history: [] });
    }

    const data = await response.json();
    res.status(200).json({ history: data.history || [] });
  } catch (error) {
    next(error);
  }
};
