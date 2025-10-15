import os
import queue
import psycopg2
import dotenv

#-----------------------------------------------------------------------

dotenv.load_dotenv()
_DATABASE_URL = os.environ['DATABASE_URL']

_connection_pool = queue.Queue()


def _get_connection():
    try:
        conn = _connection_pool.get(block = False)
    except queue.Empty:
        conn = psycopg2.connect(_DATABASE_URL)
    return conn

def _put_connection(conn):
    _connection_pool.put(conn)
    
def execute_query(query, params = None, fetchone = False, fetchall = False, commit = False):
    connection = _get_connection()
    try:
        with connection.cursor() as cursor:
            result = None
            cursor.execute(query,params)
            if fetchone:
                result = cursor.fetchone()
            elif fetchall:
                result = cursor.fetchall()
            if commit:
                connection.commit()

            return result
    finally:
        _put_connection(connection)
    
#-----------------------------------------------------------------------
    
    



