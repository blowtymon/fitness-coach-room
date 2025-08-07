from config import supabase

def get_user_id_from_token(token: str):
    """
    Extract the user ID from the Supabase session token.
    """
    res = supabase.auth.get_user(token)
    return res.user.id if res.user else None
