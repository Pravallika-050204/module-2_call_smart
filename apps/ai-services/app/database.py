import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Load DATABASE_URL from environment or fallback to the local postgresql configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:test@localhost:5432/revenue_intel")

def get_connection():
    """
    Establishes and returns a raw connection to the PostgreSQL database.
    """
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise e

def execute_query(query, params=None):
    """
    Helper to execute a query and return dictionary results for SELECT queries,
    or commit transaction modifications for insert/updates.
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if cur.description:
                return [dict(row) for row in cur.fetchall()]
            conn.commit()
            return None
    finally:
        conn.close()
