# main landing page for organizations after logging in
from flask import Blueprint, request, send_from_directory
import os

# use blueprint to group routes
org_landing_bp = Blueprint("org_landing", __name__)

# TODO: change this to be the actual landing page
@org_landing_bp.get("/")
def foo():
    return "something"