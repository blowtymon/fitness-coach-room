# services/storage_service.py
from typing import Optional
from config import supabase

def upload_file_to_storage(bucket_name: str, path: str, file_obj, content_type: Optional[str] = None) -> str:
    """
    Uploads a file using the service-role client (bypasses RLS).
    Returns a public URL to the uploaded object.
    """
    data = file_obj.read()
    file_obj.seek(0)

    options = {
        "content-type": content_type or getattr(file_obj, "mimetype", None) or "application/octet-stream",
        "upsert": False,
    }

    res = supabase.storage.from_(bucket_name).upload(path, data, options)
    if isinstance(res, dict) and res.get("error"):
        raise RuntimeError(f"Storage upload error: {res['error']}")

    public_url = supabase.storage.from_(bucket_name).get_public_url(path)
    if not public_url:
        raise RuntimeError("Could not obtain public URL for uploaded file.")

    return public_url
