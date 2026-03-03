from supabase import create_client, Client
from .config import settings

# Supabase client (uses service role key for server-side operations)
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key or settings.supabase_key)


def get_db() -> Client:
    """Dependency to get Supabase client"""
    return supabase
