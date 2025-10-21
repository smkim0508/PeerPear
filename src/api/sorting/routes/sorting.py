# actual routes / API for sorting requests
from flask import Blueprint, request

# use blueprint to group routes
sorting_bp = Blueprint("sorting", __name__)

# TODO: build the actual APIS
@sorting_bp.get("/")
def foo() -> str:
    return "something"