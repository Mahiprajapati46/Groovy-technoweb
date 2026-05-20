import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import rag_agent

app = FastAPI(title="Multiple PDF Q&A Agent API")

# Configure CORS so our React frontend can connect securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema for Chat
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".xlsx", ".xls", ".doc", ".docx", ".txt", ".md", ".json", ".xml"}

@app.post("/api/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    """
    Accepts multiple files, saves them to the ./data folder,
    and calls the RAG agent to incrementally index them.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    uploaded_files = []

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            continue

        file_path = os.path.join(rag_agent.DATA_DIR, file.filename)

        # Save file to disk
        try:
            with open(file_path, "wb") as buffer:
                buffer.write(await file.read())

            # Incrementally add to LlamaIndex vector store
            rag_agent.add_document(file_path)
            uploaded_files.append(file.filename)
        except Exception as e:
            # If ingestion fails, delete the file and raise exception
            if os.path.exists(file_path):
                os.remove(file_path)
            print(f"[API] Error uploading {file.filename}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to process {file.filename}: {str(e)}")

    return {"message": f"Successfully uploaded and indexed {len(uploaded_files)} file(s).", "files": uploaded_files}


@app.get("/api/files")
def list_files():
    """
    Returns a list of all currently indexed PDFs with page counts.
    """
    try:
        files = rag_agent.get_uploaded_files()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch files: {str(e)}")

@app.delete("/api/files/{filename}")
def delete_file(filename: str):
    """
    Deletes a specific PDF and removes all of its nodes from the vector index.
    """
    try:
        rag_agent.delete_document(filename)
        return {"message": f"Successfully deleted {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete {filename}: {str(e)}")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Queries LlamaIndex and streams tokens and citations in real time.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    async def event_generator():
        import asyncio
        import json
        # Stream asynchronously from our LlamaIndex agent with session support
        async for token in rag_agent.query_agent_async(request.message, request.session_id):
            if token.startswith("\n__CITATIONS_METADATA__:"):
                metadata_str = token.replace("\n__CITATIONS_METADATA__:", "")
                try:
                    sources = json.loads(metadata_str)
                    yield f"data: {json.dumps({'citations': sources})}\n\n"
                except Exception as e:
                    print(f"[API] Citations parse error: {e}")
                    yield f"data: {json.dumps({'citations': []})}\n\n"
            else:
                yield f"data: {json.dumps({'token': token})}\n\n"
            # Yield control to the event loop to flush bytes to the socket instantly
            await asyncio.sleep(0.01)
            
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
