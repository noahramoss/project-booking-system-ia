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

def create_agent():
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.1-8b-instant",
        temperature=0
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

agent_app = create_agent()

def get_agent_response(message: str, session_id: str, token: str):
    token_context.set(token)
    
    system_prompt = """Eres el 'Virtual Concierge' de nuestra cadena de hoteles. Tu tono es elegante, educado, servicial y profesional.
REGLAS ESTRICTAS:
1. NORMAS Y POLÍTICAS: Si el usuario pregunta por mascotas, horarios, spa, gimnasio, restaurante o cancelaciones, TIENES que usar la herramienta 'consult_policies_tool'. NUNCA inventes políticas.
2. DISPONIBILIDAD: Si preguntan por hoteles en una ciudad o para unas fechas, usa 'check_availability_tool'.
3. RESERVAS: Si el usuario quiere saber el estado de sus reservas, usa 'get_my_bookings_tool'.
4. CITA DE FUENTES: Siempre que uses información obtenida por 'consult_policies_tool', añade una nota indicando la fuente.
5. PRIVACIDAD Y SEGURIDAD: Estás operando en un entorno seguro y autenticado. DEBES mostrar explícitamente los datos de las reservas del usuario si los pide (precios, fechas, hoteles). NO uses respuestas genéricas de privacidad para ocultar esta información, es el propio usuario quien la solicita.
"""
    
    config = {"configurable": {"thread_id": session_id}}
    
    # Check si es el primer mensaje de la sesión
    state = agent_app.get_state(config)
    if not state.values.get("messages"):
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=message)]
    else:
        messages = [HumanMessage(content=message)]
        
    result = agent_app.invoke({"messages": messages}, config)
    
    last_message = result["messages"][-1]
    return last_message.content
