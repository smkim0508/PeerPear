# main backend app
from __future__ import annotations

import os
from flask import Flask, jsonify
from flask_cors import CORS
from .db import main_db
from dotenv import load_dotenv

# routes
from .api.pairing.routes.pairing import pairing_bp
from .api.sorting.routes.sorting import sorting_bp

def create_app() -> Flask:
    """
    Main cofiguration and creation to return a Flask app.
    """
    # load env vars
    load_dotenv()
    app = Flask(__name__, static_folder=None)

    # TODO: add core configuration for env here
    app.config.update(
        API_KEY=os.getenv("", ""),
    )

    # db setup
    CORS(app)
    main_db.init_app(app)

    # use blueprints for routing apis
    app.register_blueprint(pairing_bp, url_prefix="/pairing")
    app.register_blueprint(sorting_bp, url_prefix="/sorting")

    # check health with simple json output
    @app.get("/health")
    def health():
        return {"ok": True}

    # handle common errors and return json responses
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify(error="bad_request", detail=str(e)), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify(error="not_found"), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify(error="server_error"), 500

    # use alembic for local db management, or use context

    return app