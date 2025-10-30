# main landing page for log-in
from flask import Blueprint, request, send_from_directory
import os
from api import validate_model

# use blueprint to group routes
login_bp = Blueprint("login", __name__)

# TODO: change this to be the actual landing page
@login_bp.get("/")
def foo():
    static_dir = os.path.join(os.getcwd(), "public", "test")
    print(f"static_dir: {static_dir}")
    return send_from_directory(static_dir, "test_login.html")