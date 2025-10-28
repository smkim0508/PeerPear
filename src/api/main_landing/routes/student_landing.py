# main landing page for students after logging in
from flask import Blueprint, request, send_from_directory
import os

# use blueprint to group routes
student_landing_bp = Blueprint("student_landing", __name__)

# TODO: change this to be the actual landing page
@student_landing_bp.get("/")
def foo():
    return "something"