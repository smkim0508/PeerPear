# actual routes / API for pairing requests
from flask import Blueprint, request

# use blueprint to group routes
pairing_bp = Blueprint("pairing", __name__)

# TODO: build the actual APIS
@pairing_bp.get("/")
def foo() -> str:
    return "something"