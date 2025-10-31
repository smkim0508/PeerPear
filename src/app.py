# main backend app
from __future__ import annotations

from urllib.parse import urlsplit
import os
from flask import Flask, g, jsonify, send_from_directory, current_app
from flask_cors import CORS
from db.models.base.main_db import create_engine_and_sessionmaker
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from common.logging import logger

# routes
from api.main_landing.routes.login import login_bp
from api.pairing.routes.pairing import pairing_bp
from api.sorting.routes.sorting import sorting_bp
from api.dashboard.routes.organization_dashboard import org_dashboard_bp
from api.dashboard.routes.student_dashboard import student_dashboard_bp

def create_app() -> Flask:
    """
    Main cofiguration and creation to return a Flask app.
    """

    # load env vars
    load_dotenv()
    app = Flask(__name__)
    CORS(app)

    # sets up core services/db/clients during app start up
    # TODO: add core configuration for env here

    MAIN_DB_USER = os.getenv("MAIN_DB_USER")
    MAIN_DB_PASSWORD = os.getenv("MAIN_DB_PASSWORD")
    MAIN_DB_HOST = os.getenv("MAIN_DB_HOST")
    MAIN_DB_PORT = os.getenv("MAIN_DB_PORT")
    MAIN_DB_NAME = os.getenv("MAIN_DB_NAME")

    # (postgresql+asyncpg...) in the future for truly async application
    # MAIN_DB_URL = f"postgresql+psycopg2://{MAIN_DB_USER}:{MAIN_DB_PASSWORD}@{MAIN_DB_HOST}:{MAIN_DB_PORT}/{MAIN_DB_NAME}"
    MAIN_DB_URL = f"postgresql+psycopg2://{MAIN_DB_USER}:{MAIN_DB_PASSWORD}@{MAIN_DB_HOST}:{MAIN_DB_PORT}/{MAIN_DB_NAME}?sslmode=require"
    
    app.config.update(
        # MAIN_DB_URL=os.getenv("MAIN_DB_URL", None),
        MAIN_DB_URL=MAIN_DB_URL,
        GOOGLE_API_KEY=os.getenv("GOOGLE_API_KEY", None),
    )
    
    if app.config["MAIN_DB_URL"] is None:
        logger.info(f"DATABASE IS NOT SET")
        raise

    if app.config["GOOGLE_API_KEY"] is None:
        logger.info(f"GOOGLE API IS NOT SET")
        raise
        
    # store the dependencies in app.extensions to link them with flask instance
    engine, SessionLocal = create_engine_and_sessionmaker(db_url=app.config["MAIN_DB_URL"])
    app.extensions["db"] = {"engine": engine, "SessionLocal": SessionLocal}

    # TODO: need to dispose of all app lifetime dependencies 

    # open a single session with each request
    @app.before_request
    def _open_session():
        SessionLocal = current_app.extensions["db"]["SessionLocal"]
        g.db = SessionLocal()
        
    # close session after each response
    @app.after_request
    def _commit_close(response):
        # best-effort commit on 2xx/3xx; rollback otherwise
        try:
            if 200 <= response.status_code < 400:
                g.db.commit()
            else:
                g.db.rollback()
        finally:
            g.db.close()
        return response

    # main landing page for login
    app.register_blueprint(login_bp, url_prefix="/")

    # use blueprints for routing apis
    app.register_blueprint(pairing_bp, url_prefix="/pairing")
    app.register_blueprint(sorting_bp, url_prefix="/sorting")
    app.register_blueprint(student_dashboard_bp, url_prefix="/student-dashboard")
    
    # check health for app dependencies and liveness
    @app.get("/health")
    def health():
        db_status = False
        try:
            # g.db is an AsyncSession you opened in before_request
            g.db.execute(text("SELECT 1"))
            ok = True
            db_status = True
        except Exception as e:
            logger.exception("Health check DB failed: %s", e)

        google_key_status = app.config.get("GOOGLE_API_KEY") is not None

        ok = db_status and google_key_status

        return {
            "ok": ok,
            "db": db_status,
            "google_api_key": google_key_status
        }, (200 if ok else 503)

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