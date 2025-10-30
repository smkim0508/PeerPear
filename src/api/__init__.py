# makes app visible to flask wsgi
from functools import wraps
from flask import request, jsonify
from pydantic import ValidationError

# helper wrapper to validate request body
def validate_model(model):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                data = request.get_json()
                validated = model(**data)
            except ValidationError as e:
                return jsonify(e.errors()), 400
            return fn(validated, *args, **kwargs)
        return wrapper
    return decorator