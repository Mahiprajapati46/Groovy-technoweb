import os
import shutil
import nest_asyncio
import pandas as pd
import hashlib
nest_asyncio.apply()
from dotenv import load_dotenv

# Load env variables
load_dotenv()

from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
    Settings,
    PromptTemplate,
    Document
)
from llama_index.llms.groq import Groq
from llama_index.embeddings.gemini import GeminiEmbedding
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.chat_engine import CondensePlusContextChatEngine

# 1. Directories
DATA_DIR = "./data"
STORAGE_DIR = "./storage"
ALLOWED_EXTENSIONS = {".pdf", ".csv", ".xlsx", ".xls", ".doc", ".docx", ".txt", ".md", ".json", ".xml"}

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)

from llama_index.core.readers.base import BaseReader

class TabularDataReader(BaseReader):
    """
    Custom reader that converts rows of a CSV/Excel file into 
    semantic batches, including headers in each chunk for high quality retrieval.
    """
    def load_data(self, file_path, **kwargs):
        file_path = str(file_path)
        ext = os.path.splitext(file_path)[1].lower()
        try:
            if ext == '.csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
            
            columns_str = ", ".join(df.columns)
            docs = []
            batch_size = 10
            for i in range(0, len(df), batch_size):
                batch_df = df.iloc[i : i + batch_size]
                batch_lines = []
                batch_lines.append(f"Columns: {columns_str}")
                batch_lines.append("---")
                for idx, row in batch_df.iterrows():
                    row_items = [f"{col}: {val}" for col, val in row.items()]
                    row_str = f"Row {idx + 1}: " + ", ".join(row_items)
                    batch_lines.append(row_str)
                
                batch_text = "\n".join(batch_lines)
                doc = Document(text=batch_text)
                doc.metadata = {
                    "page_label": f"Rows {i+1}-{i+len(batch_df)}"
                }
                docs.append(doc)
            return docs
        except Exception as e:
            print(f"[RAG Agent] Error in TabularDataReader for {file_path}: {e}")
            return []

def get_custom_readers():
    reader = TabularDataReader()
    return {
        ".csv": reader,
        ".xlsx": reader,
        ".xls": reader,
    }

# 2. Configure LlamaIndex globally with Groq
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY is not set.")

Settings.llm = Groq(
    model="llama-3.1-8b-instant",
    api_key=groq_api_key,
    temperature=0.0
)

gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY is not set.")

Settings.embed_model = GeminiEmbedding(
    model_name="models/gemini-embedding-001",
    api_key=gemini_api_key
)
Settings.embed_batch_size = 10 
Settings.node_parser = SentenceSplitter(chunk_size=512, chunk_overlap=80)

# Global index holder
_index = None

# 3. Session Management
_sessions = {}

# 4. In-Memory Query Cache for Repeated Questions
_query_cache = {}

def get_session_data(session_id: str):
    """Retrieves or initializes session-specific data."""
    if session_id not in _sessions:
        print(f"[RAG Agent] Initializing new session: {session_id}")
        _sessions[session_id] = {
            "memory": ChatMemoryBuffer.from_defaults(token_limit=1500)
        }
    return _sessions[session_id]

def get_index():
    """Initializes or loads the VectorStoreIndex."""
    global _index
    if _index is not None:
        return _index
    
    print("[RAG Agent Debug] get_index called")
    
    # Verify index store file exists
    storage_file = os.path.join(STORAGE_DIR, "default__vector_store.json")
    print(f"[RAG Agent Debug] Storage dir: {STORAGE_DIR}, Exists: {os.path.exists(STORAGE_DIR)}, Storage file exists: {os.path.exists(storage_file)}")

    if os.path.exists(STORAGE_DIR) and os.path.exists(storage_file):
        print("[RAG Agent] Loading index from storage...")
        storage_context = StorageContext.from_defaults(persist_dir=STORAGE_DIR)
        _index = load_index_from_storage(storage_context)
    else:
        existing_files = [f for f in os.listdir(DATA_DIR) if os.path.splitext(f)[1].lower() in ALLOWED_EXTENSIONS] if os.path.exists(DATA_DIR) else []
        print(f"[RAG Agent Debug] Found {len(existing_files)} files in {DATA_DIR}: {existing_files}")
        
        if existing_files:
            print(f"[RAG Agent] Rebuilding index from {len(existing_files)} existing files...")
            _index = VectorStoreIndex([])
            _index.storage_context.persist(persist_dir=STORAGE_DIR)
            
            for file in existing_files:
                file_path = os.path.join(DATA_DIR, file)
                try:
                    reader = SimpleDirectoryReader(input_files=[file_path], file_extractor=get_custom_readers())
                    docs = reader.load_data()
                    for doc in docs:
                        doc.metadata["file_name"] = file
                        _index.insert(doc)
                    print(f"[RAG Agent] Successfully indexed: {file}")
                except Exception as e:
                    print(f"[RAG Agent] Error loading {file}: {e}")
            _index.storage_context.persist(persist_dir=STORAGE_DIR)
        else:
            print("[RAG Agent] No files found in DATA_DIR. Creating new empty index...")
            _index = VectorStoreIndex([])
            _index.storage_context.persist(persist_dir=STORAGE_DIR)
    return _index

def clear_caches():
    """Invalidates the query cache and resets the cached chat engines in active sessions."""
    global _query_cache
    print("[RAG Agent] Cleared in-memory query cache and cached chat engines.")
    _query_cache.clear()
    for session_id in _sessions:
        if "chat_engine" in _sessions[session_id]:
            del _sessions[session_id]["chat_engine"]

def calculate_sha256(file_path: str) -> str:
    """Calculates the SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception as e:
        print(f"[RAG Agent] Error calculating hash for {file_path}: {e}")
        return ""

def get_file_hash_map() -> dict:
    """
    Returns a dictionary mapping file_hash -> file_name for all indexed files.
    Also backfills file_hash in metadata for older indexed files if they exist on disk.
    """
    index = get_index()
    hash_map = {}
    docs_to_update = []
    
    if not index or not index.docstore.docs:
        return hash_map
        
    for doc_id, doc in index.docstore.docs.items():
        file_hash = doc.metadata.get("file_hash")
        file_name = doc.metadata.get("file_name")
        
        if not file_name:
            continue
            
        if not file_hash:
            # Backfill by calculating hash of physical file
            physical_path = os.path.join(DATA_DIR, file_name)
            if os.path.exists(physical_path):
                try:
                    file_hash = calculate_sha256(physical_path)
                    if file_hash:
                        doc.metadata["file_hash"] = file_hash
                        docs_to_update.append(doc)
                except Exception as e:
                    print(f"[RAG Agent] Error backfilling hash for {file_name}: {e}")
                    
        if file_hash:
            hash_map[file_hash] = file_name
            
    if docs_to_update:
        print(f"[RAG Agent] Backfilled file hashes for {len(docs_to_update)} doc nodes in storage.")
        index.storage_context.persist(persist_dir=STORAGE_DIR)
        
    return hash_map

def delete_index_nodes_only(filename: str):
    """
    Deletes index nodes and metadata associated with a file, without deleting the physical file.
    Does NOT call persist() directly so that it can be called safely in a batch operation.
    """
    index = get_index()
    clear_caches()
    ref_ids = set()
    for doc_id, doc in index.docstore.docs.items():
        if doc.metadata.get("file_name") == filename:
            parent_id = doc.ref_doc_id or doc.id_
            if parent_id:
                ref_ids.add(parent_id)
                
    for ref_id in ref_ids:
        # 1. Delete from vector store
        try:
            index._vector_store.delete(ref_id)
        except Exception as e:
            print(f"[RAG Agent] Vector store delete error for {ref_id}: {e}")
            
        # 2. Delete from index struct safely
        ref_doc_info = index.docstore.get_ref_doc_info(ref_id)
        if ref_doc_info is not None:
            for node_id in ref_doc_info.node_ids:
                if node_id in index._index_struct.nodes_dict:
                    try:
                        index._index_struct.delete(node_id)
                    except Exception as e:
                        print(f"[RAG Agent] Index struct delete error for node {node_id}: {e}")
                try:
                    index.docstore.delete_document(node_id, raise_error=False)
                except Exception as e:
                    pass
                    
        # 3. Delete ref doc from docstore
        try:
            index.docstore.delete_ref_doc(ref_id, raise_error=False)
        except Exception as e:
            pass
            
    # Save index struct
    try:
        index._storage_context.index_store.add_index_struct(index._index_struct)
    except Exception as e:
        pass

def add_documents_batch(file_paths: list[str]):
    """Ingests multiple documents in a single batch, persisting to storage only once."""
    index = get_index()
    clear_caches()
    
    for file_path in file_paths:
        filename = os.path.basename(file_path)
        
        # Safe Overwrite: Clean up any old index nodes for this filename before re-indexing
        delete_index_nodes_only(filename)
        
        print(f"[RAG Agent] Indexing file: {filename}")
        reader = SimpleDirectoryReader(input_files=[file_path], file_extractor=get_custom_readers())
        documents = reader.load_data()
        
        # Calculate content hash for duplicate detection
        file_hash = calculate_sha256(file_path)
        
        for doc in documents:
            doc.metadata["file_name"] = filename
            if file_hash:
                doc.metadata["file_hash"] = file_hash
            index.insert(doc)
            
    print(f"[RAG Agent] Persisting updated index for {len(file_paths)} files to disk...")
    index.storage_context.persist(persist_dir=STORAGE_DIR)

def add_document(file_path: str):
    """Ingests a single document (wrapper around batch ingestion)."""
    add_documents_batch([file_path])

def delete_document(filename: str):
    """Deletes a document from the index and removes its physical file from disk."""
    delete_index_nodes_only(filename)
    
    # Persist the changes
    index = get_index()
    index.storage_context.persist(persist_dir=STORAGE_DIR)
    
    # Delete physical file
    physical_path = os.path.join(DATA_DIR, filename)
    if os.path.exists(physical_path):
        os.remove(physical_path)

def get_uploaded_files():
    index = get_index()
    docs = index.docstore.docs
    file_map = {}
    for node_id, node in docs.items():
        filename = node.metadata.get("file_name")
        if filename:
            if filename not in file_map:
                file_map[filename] = set()
            page_label = node.metadata.get("page_label")
            if page_label:
                file_map[filename].add(page_label)
            else:
                file_map[filename].add("1")
                
    files_list = []
    for filename, pages in file_map.items():
        files_list.append({
            "name": filename,
            "pages": len(pages),
            "size": os.path.getsize(os.path.join(DATA_DIR, filename)) if os.path.exists(os.path.join(DATA_DIR, filename)) else 0
        })
    return files_list

def create_chat_engine(session_id: str):
    session_data = get_session_data(session_id)
    if "chat_engine" in session_data:
        return session_data["chat_engine"]

    index = get_index()
    if not index or not index.docstore.docs:
        return None
        
    system_prompt = (
        "You are an extremely strict Verbatim Information Extraction engine.\n"
        "Your ONLY goal is to extract facts STRICTLY from the provided Context. "
        "Under no circumstances should you ever use your own general training data or external facts.\n\n"
        "### ABSOLUTE RULES:\n"
        "1. STRICT CONTEXT-ONLY: You must answer the user's question using ONLY the provided Context Information. If the question cannot be answered using the provided context, you MUST answer exactly: \"I cannot find that information in the uploaded documents.\" and nothing else.\n"
        "2. NO EXTERNAL KNOWLEDGE: Do not talk about things not mentioned in the context (like Virat Kohli, Abraham Lincoln, or general web topics). If the user asks about them, you must say: \"I cannot find that information in the uploaded documents.\"\n"
        "3. NO CITATION ON FAILURE: If you cannot find the answer and are replying with the \"NOT FOUND\" message, do NOT output any citation or [Source: ...] line.\n"
        "4. SINGLE CITATION LINE AT THE END: If you found the answer, you must end your response with exactly one single citation line at the very end of the message (separated by a blank line). Do NOT place citation markers inline, inside list items, or after sentences. If the response uses information from multiple pages or files, combine them into one single line at the end separated by semicolons. Example: [Source: document.pdf, Page: 12; other.pdf, Page: 5].\n"
        "5. CONTEXT SWITCHING & PRONOUNS: Focus strictly on the retrieved context segments for the current turn. Use the conversation history only to resolve pronouns."
    )
    
    custom_condense_prompt = (
        "Given the following conversation between a user and an AI assistant and a follow up question from the user,\n"
        "rephrase the follow up question to be a standalone question.\n\n"
        "CRITICAL DIRECTIVES:\n"
        "1. Topic Switch: If the follow up question is about a completely different topic than the previous messages, "
        "do NOT include keywords or context constraints from the previous conversation. The standalone question should only "
        "capture the user's new question.\n"
        "2. Pronoun Resolution: Only use the chat history to resolve pronouns like 'it', 'he', 'they', 'this', or 'that' "
        "if the follow up question is a continuation of the same topic.\n\n"
        "Chat History:\n"
        "{chat_history}\n\n"
        "Follow Up Input: {question}\n"
        "Standalone question:"
    )

    custom_context_prompt = (
        "You are a strict verbatim information extraction system.\n"
        "Your ONLY source of truth is the Context Information provided below. "
        "Under no circumstances should you use external knowledge or internal facts.\n\n"
        "Context Information:\n"
        "---------------------\n"
        "{context_str}\n"
        "---------------------\n\n"
        "Instruction: Based ONLY on the context information above, answer the user's question. "
        "If the context does not contain the answer, reply exactly: \"I cannot find that information in the uploaded documents.\"\n"
    )

    custom_context_refine_prompt = (
        "You are a strict verbatim information extraction system.\n"
        "We have an opportunity to refine an existing answer with more Context Information.\n\n"
        "Additional Context Information:\n"
        "---------------------\n"
        "{context_msg}\n"
        "---------------------\n\n"
        "Existing Answer:\n"
        "{existing_answer}\n\n"
        "Instruction: Refine the existing answer using the additional context if it helps answer the question. "
        "If the additional context is not helpful, repeat the existing answer exactly as is and do not add any external knowledge.\n"
    )

    chat_engine = CondensePlusContextChatEngine.from_defaults(
        retriever=index.as_retriever(similarity_top_k=4),
        memory=session_data["memory"],
        system_prompt=system_prompt,
        condense_prompt=PromptTemplate(custom_condense_prompt),
        context_prompt=PromptTemplate(custom_context_prompt),
        context_refine_prompt=PromptTemplate(custom_context_refine_prompt),
        verbose=False
    )
    session_data["chat_engine"] = chat_engine
    return chat_engine

def estimate_tokens(query_str: str, source_nodes: list, chat_history: list, response_text: str) -> dict:
    """Calculates prompt and completion tokens using LlamaIndex's tokenizer."""
    try:
        tokenizer = Settings.tokenizer
        
        # 1. System Prompt Tokens (approximate static system prompt length of ~190 tokens)
        system_tokens = 190
        
        # 2. Query Tokens
        query_tokens = len(tokenizer(query_str))
        
        # 3. Context Tokens
        context_tokens = 0
        if source_nodes:
            for node in source_nodes:
                context_tokens += len(tokenizer(node.node.get_content()))
                
        # 4. Chat History Tokens
        history_tokens = 0
        if chat_history:
            for msg in chat_history:
                if hasattr(msg, "content") and msg.content:
                    history_tokens += len(tokenizer(msg.content))
                    
        # Calculate prompt and completion tokens
        prompt_tokens = system_tokens + query_tokens + context_tokens + history_tokens
        completion_tokens = len(tokenizer(response_text))
        
        return {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens
        }
    except Exception as e:
        print(f"[RAG Agent] Token estimation warning: {e}")
        # Return fallback counts if tokenizer fails
        fallback_prompt = (len(query_str) + (len(response_text) * 2)) // 4
        return {
            "prompt_tokens": fallback_prompt,
            "completion_tokens": len(response_text) // 4,
            "total_tokens": fallback_prompt + (len(response_text) // 4)
        }

async def query_agent_async(query_str: str, session_id: str = "default"):
    import asyncio
    import json
    
    # 1. Standardize query
    normalized_query = query_str.strip().lower()
    cache_key = (session_id, normalized_query)
    
    # 2. Check query cache
    if cache_key in _query_cache:
        cached_entry = _query_cache[cache_key]
        print(f"[RAG Agent Cache] Serving cached response for: '{query_str}'")
        for token in cached_entry["tokens"]:
            yield token
            # Yield with a very short sleep for a smooth typing animation
            await asyncio.sleep(0.002)
        yield cached_entry["citations"]
        return

    # If not cached, run actual pipeline
    chat_engine = create_chat_engine(session_id)
    if not chat_engine:
        yield "Please upload some files to start chatting!"
        return
        
    try:
        response = await chat_engine.astream_chat(query_str)
        print("\n[RAG Agent Debug] Query: " + query_str)
        print("[RAG Agent Debug] Retrieved Nodes:")
        if hasattr(response, 'source_nodes') and response.source_nodes:
            for node in response.source_nodes:
                filename = node.node.metadata.get("file_name", "N/A")
                page_label = node.node.metadata.get("page_label", "N/A")
                score = node.score if hasattr(node, 'score') else 'N/A'
                print(f"  - File: {filename}, Page: {page_label}, Score: {score}")
        else:
            print("  - No source nodes retrieved.")
            
        collected_tokens = []
        async for token in response.async_response_gen():
            collected_tokens.append(token)
            yield token
            
        # Compile response text for token estimation
        full_response_text = "".join(collected_tokens)
        
        # Calculate citations metadata
        sources = []
        source_nodes = response.source_nodes if hasattr(response, 'source_nodes') else []
        for source_node in source_nodes:
            metadata = source_node.node.metadata
            sources.append({
                "file_name": metadata.get("file_name"),
                "page": metadata.get("page_label"),
                "text": source_node.node.get_content()
            })
            
        # Get chat history for token estimation
        session_data = get_session_data(session_id)
        chat_history = session_data["memory"].get() if "memory" in session_data else []
        
        # Estimate tokens used
        token_usage = estimate_tokens(query_str, source_nodes, chat_history, full_response_text)
        
        # Yield citation payload along with token_usage
        citations_payload = {
            "citations": sources,
            "token_usage": token_usage
        }
        citations_str = "\n__CITATIONS_METADATA__:" + json.dumps(citations_payload)
        yield citations_str
        
        # Save to cache
        _query_cache[cache_key] = {
            "tokens": collected_tokens,
            "citations": citations_str
        }
        
    except Exception as e:
        print(f"[RAG Agent] Error: {str(e)}")
        yield f"An error occurred during query generation: {str(e)}"
