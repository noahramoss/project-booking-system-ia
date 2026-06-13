import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings
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
        # fastembed (ONNX): mismo modelo all-MiniLM pero sin PyTorch,
        # bajo consumo de RAM para encajar en el free tier de Render.
        _embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    
    def is_db_outdated():
        if not os.path.exists(DB_DIR):
            return True
        try:
            db_mtime = os.path.getmtime(DB_DIR)
            for root, _, files in os.walk(DOCS_DIR):
                for file in files:
                    if file.endswith(".md"):
                        if os.path.getmtime(os.path.join(root, file)) > db_mtime:
                            return True
            return False
        except:
            return True

    if not is_db_outdated():
        try:
            _vector_store = Chroma(persist_directory=DB_DIR, embedding_function=_embeddings)
            return _vector_store
        except Exception as e:
            print(f"Error cargando DB, reconstruyendo... {e}")
            pass
            
    # Inicializar si no existe o está desactualizado
    import shutil
    if os.path.exists(DB_DIR):
        shutil.rmtree(DB_DIR)
        
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

# Etiquetas legibles para citar la fuente (nombre de fichero -> título humano).
SOURCE_LABELS = {
    "cancellation_policy.md": "Política de Cancelaciones",
    "pet_policy.md": "Política de Mascotas",
    "checkin_checkout_rules.md": "Normas de Check-in / Check-out",
    "restaurant_info.md": "Información del Restaurante",
    "spa_gym_info.md": "Información de Spa y Gimnasio",
}


def consult_policies(query: str):
    store = get_vector_store()
    results = store.similarity_search(query, k=3)
    if not results:
        return "No se ha encontrado información en las políticas del hotel."

    # Devolvemos cada fragmento etiquetado con su fuente real, para que el
    # agente pueda citarla de forma fiable (no inventada).
    fragments = []
    for doc in results:
        filename = os.path.basename(doc.metadata.get("source", ""))
        label = SOURCE_LABELS.get(filename, filename or "Documento de políticas")
        fragments.append(f"[Fuente: {label}]\n{doc.page_content}")
    return "\n\n".join(fragments)
