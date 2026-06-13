import os
from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from agent import get_agent_response, get_conversation_history

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="Booking System AI Concierge")

class ChatRequest(BaseModel):
    message: str
    session_id: str

@app.post("/chat")
def chat_endpoint(req: ChatRequest, authorization: Optional[str] = Header(None)):
    try:
        response = get_agent_response(
            message=req.message,
            session_id=req.session_id,
            token=authorization
        )
        return {"reply": response}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history/{session_id}")
def history_endpoint(session_id: str):
    return {"history": get_conversation_history(session_id)}
