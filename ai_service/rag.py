import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "docs")

_embeddings = None
_vector_store = None

def get_vector_store():
    global _embeddings, _vector_store
    
    if _vector_store is not None:
        return _vector_store
        
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    if os.path.exists(DB_DIR) and len(os.listdir(DB_DIR)) > 0:
        _vector_store = Chroma(persist_directory=DB_DIR, embedding_function=_embeddings)
        return _vector_store
        
    # Inicializar si no existe
    loader = DirectoryLoader(DOCS_DIR, glob="**/*.md", loader_cls=TextLoader)
    documents = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.split_documents(documents)
    
    _vector_store = Chroma.from_documents(
        documents=docs, 
        embedding=_embeddings, 
        persist_directory=DB_DIR
    )
    return _vector_store

def consult_policies(query: str):
    store = get_vector_store()
    results = store.similarity_search(query, k=3)
    if not results:
        return "No se ha encontrado información en las políticas del hotel."
    return "\n\n".join([doc.page_content for doc in results])
