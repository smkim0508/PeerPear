# main backend app
from __future__ import annotations

import os
from flask import Flask, g, jsonify
from flask_cors import CORS
from db.models.base.main_db import create_engine_and_sessionmaker
from dotenv import load_dotenv

from common.logging import logger

# routes
from api.pairing.routes.pairing import pairing_bp
from api.sorting.routes.sorting import sorting_bp

def create_app() -> Flask:
    """
    Main cofiguration and creation to return a Flask app.
    """

    # load env vars
    load_dotenv()
    app = Flask(__name__)
    CORS(app)

    # TODO: add core configuration for env here
    app.config.update(
        DATABASE_URL=os.getenv("DATABASE_URL", None),
    )
    
    if app.config["DATABASE_URL"] is not None:
        logger.info(f"DATABASE IS NOT SET")
        raise

    # Async SQLAlchemy setup during app start up
    # NOTE: type errors suppressed due to new flask version
    @app.before_serving # type: ignore[attr-defined]
    async def _startup():
        engine, SessionLocal = create_engine_and_sessionmaker(db_url=app.config["DATABASE_URL"])
        app.extensions["db"] = {"engine": engine, "SessionLocal": SessionLocal}

    #  dispose engine in app shutdown
    @app.after_serving # type: ignore[attr-defined]
    async def _shutdown():
        engine = app.extensions["db"]["engine"]
        await engine.dispose()

    # open a single AsyncSession with each request
    @app.before_request
    async def _open_session():
        SessionLocal = app.extensions["db"]["SessionLocal"]
        g.db = await SessionLocal().__aenter__()

    # close AsyncSession after each response
    @app.after_request
    async def _commit_close(response):
        # best-effort commit on 2xx/3xx; rollback otherwise
        try:
            if 200 <= response.status_code < 400:
                await g.db.commit()
            else:
                await g.db.rollback()
        finally:
            await g.db.__aexit__(None, None, None)
        return response

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

    return app