import os
import contextvars
from typing import TypedDict, Annotated, Sequence
import operator
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver

from tools import get_availability, get_my_bookings
from rag import consult_policies

token_context = contextvars.ContextVar('token_context', default=None)

# Historial conversacional por sesión, para exponerlo en GET /history/{session_id}.
_conversation_history = {}


def _record_history(session_id, user_message, assistant_reply):
    history = _conversation_history.setdefault(session_id, [])
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": assistant_reply})


def get_conversation_history(session_id):
    return _conversation_history.get(session_id, [])

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]

@tool
def check_availability_tool(city: str = None, check_in: str = None, check_out: str = None, capacity: int = None):
    """Útil para comprobar si hay hoteles disponibles en una ciudad o para unas fechas concretas. Devuelve los hoteles y su precio mínimo."""
    return get_availability(city, check_in, check_out, capacity)

@tool
def get_my_bookings_tool():
    """Útil para consultar el estado de las reservas del usuario autenticado actualmente. ¡No pide parámetros!"""
    token = token_context.get()
    return get_my_bookings(token)

@tool
def consult_policies_tool(query: str):
    """Útil para consultar las normas, políticas de mascotas, cancelaciones, spa, gimnasio o restaurantes del hotel. SIEMPRE usa esta herramienta si el usuario hace preguntas sobre normativas o información general."""
    return consult_policies(query)

def create_agent(model_name="llama-3.3-70b-versatile"):
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model=model_name,
        temperature=0.3
    )
    
    tools = [check_availability_tool, get_my_bookings_tool, consult_policies_tool]
    llm_with_tools = llm.bind_tools(tools)
    
    def call_model(state: AgentState):
        messages = state['messages']
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}
        
    def should_continue(state: AgentState):
        messages = state['messages']
        last_message = messages[-1]
        if not last_message.tool_calls:
            return "end"
        return "continue"
        
    tool_node = ToolNode(tools)
    
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", call_model)
    workflow.add_node("action", tool_node)
    
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges("agent", should_continue, {
        "continue": "action",
        "end": END
    })
    workflow.add_edge("action", "agent")
    
    return workflow.compile(checkpointer=MemorySaver())

# Modelos servidos por Groq (free tier, misma API key).
# Primario: gpt-oss-120b (alta calidad, cita fuentes y cierra el ciclo de tools).
# Fallback: qwen3-32b (cuota independiente; también maneja tools correctamente).
# Se evita llama-3.1-8b-instant porque no termina el ciclo de tools (bucle infinito).
PRIMARY_MODEL = "openai/gpt-oss-120b"
FALLBACK_MODEL = "qwen/qwen3-32b"

# Tope de pasos del grafo (agente<->tool). Evita cuelgues por bucles de tools:
# en vez de quedarse colgado, lanza GraphRecursionError y caemos al fallback.
RECURSION_LIMIT = 8

agent_primary = create_agent(PRIMARY_MODEL)
agent_fallback = create_agent(FALLBACK_MODEL)

def get_agent_response(message: str, session_id: str, token: str):
    token_context.set(token)
    
    system_prompt = """Eres el asistente virtual oficial de BookingSys, una plataforma integral de reservas hoteleras. Tu objetivo es ayudar a los clientes de forma amable, profesional y resolutiva.
REGLAS ESTRICTAS:
1. IDIOMA: Responde SIEMPRE en español, independientemente del idioma de la pregunta.
2. USO DE HERRAMIENTAS: DEBES utilizar las herramientas disponibles siempre que sea necesario. No asumas ni inventes información.
3. NORMAS Y POLÍTICAS: Si el usuario pregunta por mascotas, horarios, spa, gimnasio, restaurante o cancelaciones, USA 'consult_policies_tool'. No inventes políticas. La herramienta devuelve cada fragmento con su origen en formato '[Fuente: ...]'; CITA SIEMPRE esa fuente al final de tu respuesta (ej: "Fuente: Política de Mascotas").
4. DISPONIBILIDAD: Para saber qué hoteles hay o si hay habitaciones libres, usa 'check_availability_tool'. Si la herramienta devuelve resultados, descríbelos de forma atractiva usando emojis (ej: 🏨, ⭐️, 💶). Si la herramienta dice que no hay resultados, indícalo educadamente.
5. MIS RESERVAS: Si el usuario pregunta por "mis reservas", "mis viajes", "dónde voy a dormir", etc., usa 'get_my_bookings_tool'. Muestra siempre el estado (Confirmada, Pendiente, Cancelada), fechas, hotel y precio total.
6. RESPUESTAS CONCRETAS: Sé conciso pero informativo. Utiliza viñetas para listar información si es apropiado.
7. PRIVACIDAD: Estás operando en un entorno seguro. Puedes y debes mostrar los detalles de las reservas al usuario si las pide, usando la herramienta adecuada.
"""
    
    # Se intenta con el modelo principal; ante cualquier fallo (rate limit, bucle
    # de tools que agota la recursión, etc.) se pasa al fallback. Solo si ambos
    # fallan se devuelve un mensaje amable, nunca un 500.
    for agent_app, model_name in [(agent_primary, PRIMARY_MODEL), (agent_fallback, FALLBACK_MODEL)]:
        try:
            config = {
                "configurable": {"thread_id": f"{session_id}_{model_name}"},
                "recursion_limit": RECURSION_LIMIT,
            }

            state = agent_app.get_state(config)
            if not state.values.get("messages"):
                messages = [SystemMessage(content=system_prompt), HumanMessage(content=message)]
            else:
                messages = [HumanMessage(content=message)]

            result = agent_app.invoke({"messages": messages}, config)

            reply = result["messages"][-1].content
            # Una respuesta vacía es tan inútil como un error: probamos el fallback.
            if reply and reply.strip():
                _record_history(session_id, message, reply)
                return reply
            print(f"[AI] Respuesta vacía de {model_name}, intentando fallback...")
        except Exception as e:
            print(f"[AI] Error en {model_name} ({type(e).__name__}: {str(e)[:120]}), intentando fallback...")

    return "Lo siento, el servicio de IA está teniendo problemas en este momento. Por favor, inténtalo de nuevo en unos instantes."

