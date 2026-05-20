import os
import hashlib
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

@app.on_event("startup")
async def startup_event():
    print("[API Startup] Pre-loading LlamaIndex vector store index...")
    try:
        rag_agent.get_index()
        print("[API Startup] LlamaIndex vector store index loaded successfully into RAM.")
    except Exception as e:
        print(f"[API Startup] Warning during index pre-loading: {e}")

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
    Accepts multiple files, validates that they do not contain duplicate content 
    already present under another filename, saves them to the ./data folder, 
    and calls the RAG agent to incrementally index them.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    uploaded_files = []
    file_paths = []
    duplicate_errors = []

    # Get the current mapping of file_hash -> file_name from indexed documents
    hash_map = rag_agent.get_file_hash_map()

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            continue

        try:
            content = await file.read()
            # Compute content hash in memory
            file_hash = hashlib.sha256(content).hexdigest()

            # Prevent duplicate content uploaded under a different filename
            if file_hash in hash_map:
                existing_filename = hash_map[file_hash]
                if existing_filename != file.filename:
                    duplicate_errors.append(
                        f"File '{file.filename}' has the exact same content as already indexed file '{existing_filename}'."
                    )
                    continue

            file_path = os.path.join(rag_agent.DATA_DIR, file.filename)

            # Save file to disk
            with open(file_path, "wb") as buffer:
                buffer.write(content)

            file_paths.append(file_path)
            uploaded_files.append(file.filename)
        except Exception as e:
            # Cleanup any files saved during this request
            for path in file_paths:
                if os.path.exists(path):
                    os.remove(path)
            print(f"[API] Error saving {file.filename}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save {file.filename}: {str(e)}")

    # If any files are duplicates, clean up saved files from this request and return 400 Bad Request
    if duplicate_errors:
        for path in file_paths:
            if os.path.exists(path):
                os.remove(path)
        raise HTTPException(status_code=400, detail=" | ".join(duplicate_errors))

    if file_paths:
        try:
            # Ingest and embed all documents, then write to storage once
            rag_agent.add_documents_batch(file_paths)
        except Exception as e:
            for path in file_paths:
                if os.path.exists(path):
                    os.remove(path)
            print(f"[API] Error indexing batch: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to index files: {str(e)}")

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
                    payload = json.loads(metadata_str)
                    yield f"data: {json.dumps({'citations': payload.get('citations', []), 'token_usage': payload.get('token_usage')})}\n\n"
                except Exception as e:
                    print(f"[API] Citations parse error: {e}")
                    yield f"data: {json.dumps({'citations': [], 'token_usage': None})}\n\n"
            else:
                yield f"data: {json.dumps({'token': token})}\n\n"
            
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
