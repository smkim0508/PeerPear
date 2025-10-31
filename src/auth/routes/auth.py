import urllib.request
import urllib.parse
import re
import json
import os
from functools import wraps
from flask import Blueprint, request, session, redirect, url_for, jsonify, current_app, abort

#-----------------------------------------------------------------------

_CAS_URL = "https://fed.princeton.edu/cas/"

# Create auth blueprint
auth_bp = Blueprint("auth", __name__)

#-----------------------------------------------------------------------

# Return url after stripping out the "ticket" parameter that was
# added by the CAS server.
def strip_ticket(url):
    if url is None:
        return "something is badly wrong"
    url = re.sub(r"ticket=[^&]*&?", "", url)
    url = re.sub(r"\?&?$|&$", "", url)
    return url

#-----------------------------------------------------------------------

# Validate a login ticket by contacting the CAS server. If
# valid, return the user's user_info; otherwise, return None.
def validate(ticket, service_url=None):
    if service_url is None:
        service_url = strip_ticket(request.url)
    
    val_url = (
        _CAS_URL
        + "validate"
        + "?service="
        + urllib.parse.quote(service_url)
        + "&ticket="
        + urllib.parse.quote(ticket)
        + "&format=json"
    )
    with urllib.request.urlopen(val_url) as flo:
        result = json.loads(flo.read().decode("utf-8"))

    if (not result) or ("serviceResponse" not in result):
        return None

    service_response = result["serviceResponse"]

    if "authenticationSuccess" in service_response:
        user_info = service_response["authenticationSuccess"]
        return user_info

    if "authenticationFailure" in service_response:
        print("CAS authentication failure:", service_response)
        return None

    print("Unexpected CAS response:", service_response)
    return None

#-----------------------------------------------------------------------

# Authenticate the user, and return the user's info.
# Do not return unless the user is successfully authenticated.
def authenticate(redirect_url=None):

    # If the user_info is in the session, then the user was
    # authenticated previously.  So return the username.
    if "user_info" in session:
        user_info = session.get("user_info")
        return user_info["user"]

    # If the request does not contain a login ticket, then redirect
    # the browser to the login page to get one.
    ticket = request.args.get("ticket")
    if ticket is None:
        # Use the provided redirect_url or fall back to the current request URL
        service_url = redirect_url or request.url
        login_url = (_CAS_URL + "login?service=" +
            urllib.parse.quote(service_url))
        abort(redirect(login_url))

    # If the login ticket is invalid, then redirect the browser
    # to the login page to get a new one.
    user_info = validate(ticket)
    if user_info is None:
        service_url = redirect_url or strip_ticket(request.url)
        login_url = (
            _CAS_URL
            + "login?service="
            + urllib.parse.quote(service_url)
        )
        abort(redirect(login_url))

    # The user is authenticated, so store the user_info in
    # the session and return the username.
    session["user_info"] = user_info
    
    # Redirect to the specified URL or clean the current URL
    if redirect_url:
        abort(redirect(redirect_url))
    else:
        clean_url = strip_ticket(request.url)
        abort(redirect(clean_url))

#-----------------------------------------------------------------------

def is_authenticated():
    return "user_info" in session

#-----------------------------------------------------------------------

def get_user_info():
    return session.get('user_info')

#-----------------------------------------------------------------------

def get_username():
    user_info = session.get('user_info')
    if user_info is None:
        return None
    return user_info.get('user')

#-----------------------------------------------------------------------

def require_auth(f):
    """Decorator to require authentication for a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            # Force authentication
            authenticate()
        return f(*args, **kwargs)
    return decorated_function

#-----------------------------------------------------------------------

# Auth routes

@auth_bp.route("/login")
def login():
    """Force CAS authentication with optional redirect"""
    # Get redirect URL from query parameter, default to frontend root
    redirect_url = request.args.get("redirect_url", "http://localhost:3000/")
    
    # If user is already authenticated, redirect immediately
    if is_authenticated():
        return redirect(redirect_url)
    
    # Check if we have a ticket (coming back from CAS)
    ticket = request.args.get("ticket")
    if ticket:
        # Validate the ticket with the correct service URL
        service_url = request.url_root + "auth/login?redirect_url=" + urllib.parse.quote(redirect_url)
        user_info = validate(ticket, strip_ticket(service_url))
        if user_info:
            # Store user info in session
            session["user_info"] = user_info
            # Redirect to the target URL
            return redirect(redirect_url)
        else:
            # Invalid ticket, redirect to CAS login again
            login_url = (_CAS_URL + "login?service=" +
                urllib.parse.quote(service_url))
            return redirect(login_url)
    else:
        # No ticket, initiate CAS login
        service_url = request.url_root + "auth/login?redirect_url=" + urllib.parse.quote(redirect_url)
        login_url = (_CAS_URL + "login?service=" + urllib.parse.quote(service_url))
        return redirect(login_url)

@auth_bp.route("/logout")
def logout():
    """Clear session and redirect to logged out page"""
    print(f"Before logout - session contents: {dict(session)}")
    session.clear()
    print(f"After logout - session contents: {dict(session)}")
    return jsonify({"message": "Logged out successfully"})

@auth_bp.route("/logout-cas")
def logout_cas():
    """Logout from CAS and redirect to app logout"""
    logout_url = (
        _CAS_URL
        + "logout?service="
        + urllib.parse.quote(request.url_root + "auth/logout")
    )
    abort(redirect(logout_url))

@auth_bp.route("/user")
def get_current_user():
    """Get current authenticated user info"""
    if not is_authenticated():
        return jsonify({"error": "Not authenticated"}), 401
    
    user_info = get_user_info()
    return jsonify({
        "authenticated": True,
        "username": get_username(),
        "user_info": user_info
    })

@auth_bp.route("/status")
def auth_status():
    """Check authentication status"""
    return jsonify({
        "authenticated": is_authenticated(),
        "username": get_username() if is_authenticated() else None
    })