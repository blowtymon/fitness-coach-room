# from config import PINECONE_INDEX
import openai
import supabase
from settings import get_user_settings
from pinecone import Pinecone


def embed_text(text: str) -> list[float]:
    """
    Generate an OpenAI embedding for the given text.
    """
    response = openai.embeddings.create(
        input=[text],
        model="text-embedding-3-large"
    )
    return response.data[0].embedding

def upsert_vector(vector_id: str, vector: list[float], metadata: dict):
    """
    Save a vector to Pinecone with the given metadata.
    """
    settings = get_user_settings()
    pinecone_api_key = settings["pinecone_key"]
    pinecone_index_name = settings["pinecone_index"]

    pc = Pinecone(api_key=pinecone_api_key)

    PINECONE_INDEX = pc.Index(pinecone_index_name)

    PINECONE_INDEX.upsert([
        {
            "id": vector_id,
            "values": vector,
            "metadata": metadata
        }
    ])

def search_similar_vectors(user_id: str, query: str, top_k: int = 5):
    """
    Search Pinecone for top_k vectors related to the query.
    """
    query_vector = embed_text(query)

    settings = get_user_settings()
    pinecone_api_key = settings["pinecone_key"]
    pinecone_index_name = settings["pinecone_index"]
    pc = Pinecone(api_key=pinecone_api_key)
    PINECONE_INDEX = pc.Index(pinecone_index_name)

    return PINECONE_INDEX.query(
        vector=query_vector,
        top_k=top_k,
        include_metadata=True,
        filter={"user_id": {"$eq": user_id}}
    )

def retrieve_all_logs_from_pinecone(user_id: str) -> list[dict]:
    result = supabase.table("logs").select("id").eq("user_id", user_id).execute()
    log_ids = [row["id"] for row in result.data]

    if not log_ids:
        return []

    settings = get_user_settings()
    pinecone_api_key = settings["pinecone_key"]
    pinecone_index_name = settings["pinecone_index"]
    pc = Pinecone(api_key=pinecone_api_key)
    PINECONE_INDEX = pc.Index(pinecone_index_name)
    response = PINECONE_INDEX.fetch(ids=log_ids, namespace=user_id)

    return list(response.get("vectors", {}).values())

