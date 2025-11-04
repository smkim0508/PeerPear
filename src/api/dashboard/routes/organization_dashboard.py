# main landing page for organizations after logging in
from flask import Blueprint, request, send_from_directory
import os
from api import validate_model

# use blueprint to group routes
org_dashboard_bp = Blueprint("org_dashboard", __name__)

# TODO: change this to be the actual landing page
@org_dashboard_bp.get("/")
def foo():
    return "something"