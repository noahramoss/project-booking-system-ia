const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/booking-system-events";

export const sendN8nWebhook = async (event, payload) => {
  try {
    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    
    // Ejecución asíncrona ("fire and forget") para no bloquear el request del usuario
    fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(err => {
      console.error(`[N8N Webhook Error] Fallo al enviar evento ${event}:`, err.message);
    });
    
  } catch (error) {
    console.error(`[N8N Webhook Error] Excepción al preparar evento ${event}:`, error.message);
  }
};
