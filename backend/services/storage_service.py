from config import supabase

def upload_file_to_storage(bucket_name: str, file_path: str, file) -> str:
    """
    Upload a file to Supabase Storage and return its public URL.
    """
    file_content = file.read()
    content_type = file.content_type

    supabase.storage.from_(bucket_name).upload(
        file_path,
        file_content,
        {"content-type": content_type}
    )


    url = supabase.storage.from_(bucket_name).get_public_url(file_path)
    print(f"Uploaded to: {url}")
    return url
