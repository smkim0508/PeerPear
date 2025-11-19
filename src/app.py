# main backend app
from __future__ import annotations

from urllib.parse import urlsplit
import os
from flask import Flask, g, jsonify, send_from_directory, current_app, request, redirect
from flask_cors import CORS
from db.models.base.main_db import create_engine_and_sessionmaker
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.llm_service.llm_clients.google_genai_client import AsyncGenAITypedClient

from common.logging import logger

# routes
from api.pairing.routes.pairing import pairing_bp
from api.sorting.routes.sorting import sorting_bp
from api.dashboard.routes.organization_dashboard import org_dashboard_bp
from api.dashboard.routes.my_events_dashboard import my_events_bp
from api.dashboard.routes.student_dashboard import student_dashboard_bp
from api.dashboard.routes.organization_dashboard import org_dashboard_bp
from api.dashboard.routes.organization_profile import org_profile_bp
from api.dashboard.routes.questionnaire import questionnaire_bp
from api.dashboard.routes.event_registration import event_registration_bp
from api.events.routes.events import events_bp
from api.events.routes.event_status import event_status_bp
from api.dashboard.routes.question_management import question_management_bp


from api.profile.routes.profile import user_profile_bp

from auth.routes.auth import auth_bp


def create_app() -> Flask:
    """
    Main cofiguration and creation to return a Flask app.
    """

    # load env vars
    load_dotenv()
    app = Flask(__name__)

    # Configure CORS to allow requests from Next.js frontend
    CORS(
        app,
        origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://peerpear.vercel.app", "http://peerpear.vercel.app"],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    )

    # Configure session for CAS authentication
    # TODO: this needs changing
    app.secret_key = os.getenv(
        "SECRET_KEY", "blah-blah-change-for-prod-cos333")
    app.config['SESSION_TYPE'] = 'filesystem'
    # Set to True in production with HTTPS
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = None

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
    engine, SessionLocal = create_engine_and_sessionmaker(
        db_url=app.config["MAIN_DB_URL"])
    app.extensions["db"] = {"engine": engine, "SessionLocal": SessionLocal}

    # store llm client in app.extensions to link them with flask instance
    llm_client = AsyncGenAITypedClient(api_key=app.config["GOOGLE_API_KEY"])
    app.extensions["llm_client"] = llm_client

    # TODO: need to dispose of all app lifetime dependencies

    # open a single session with each request
    @app.before_request
    def _open_session():
        print(f"request url: {request.url_root}")
        # NOTE; first check if request is using HTTPS, otherwise redirect to HTTPS
        is_running_locally = "//localhost:" in request.url_root or "//127.0.0.1:" in request.url_root
        is_using_https = request.is_secure
        if (not is_running_locally) and (not is_using_https):
            url = request.url.replace("http://", "https://", 1)
            print(f'redirecting to {url}')
            return redirect(url, code=301)

        # print(f"hello")

        # once verified, open session for db and llm client
        SessionLocal = current_app.extensions["db"]["SessionLocal"]
        g.db = SessionLocal
        g.llm_client = current_app.extensions["llm_client"]

    # close session after each response
    @app.after_request
    def _close_session(response):
        # close db connection safely, rollback occurs inside independent commit flows
        # NOTE: db conns are handled on request level
        return response

    # authentication routes
    app.register_blueprint(auth_bp, url_prefix="/auth")

    # use blueprints for routing apis
    app.register_blueprint(pairing_bp, url_prefix="/pairing")
    app.register_blueprint(sorting_bp, url_prefix="/sorting")
    app.register_blueprint(student_dashboard_bp,
                           url_prefix="/student_dashboard")
    app.register_blueprint(my_events_bp, url_prefix="/my_events_dashboard")
    app.register_blueprint(
        org_dashboard_bp, url_prefix="/organization_dashboard")
    app.register_blueprint(org_profile_bp, url_prefix="/organization_profile")
    app.register_blueprint(questionnaire_bp, url_prefix="/questionnaire")
    app.register_blueprint(user_profile_bp, url_prefix="/user-profile")
    app.register_blueprint(question_management_bp,
                           url_prefix="/question_management")
    app.register_blueprint(event_registration_bp,
                           url_prefix="/event_registration")
    app.register_blueprint(events_bp, url_prefix="/events")
    app.register_blueprint(event_status_bp, url_prefix="/event_status")

    # check health for app dependencies and liveness

    @app.get("/health")
    def health():
        """
        NOTE: This endpoint mostly checks db connection, and that LLM API Key is present.
        LLM connection is not checked here due to rate limit quotas.
        To verify LLM connection, please use the test_llm script under tests/
        """
        db_status = False
        try:
            # just check if connection is possible
            with g.db() as session:
                session.execute(text("SELECT 1"))
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
