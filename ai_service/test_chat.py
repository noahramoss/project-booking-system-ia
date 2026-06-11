import asyncio
from agent import get_agent_response

async def run():
    print("Enviando mensaje al agente...")
    try:
        reply = await get_agent_response("Hola, ¿qué política de cancelación tienen?", "test_session", "")
        print("Respuesta del agente:")
        print(reply)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
