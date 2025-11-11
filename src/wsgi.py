# main WSGI entrypoint
import os
import sys
from app import create_app

# NOTE: for Heroku deployment, adds current directory '/src' to system path
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

app = create_app()

# for local executions, with poetry
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)