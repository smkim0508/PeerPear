import urllib.request
import urllib.parse
import re
import json
from functools import wraps
from flask import Blueprint, request, session, redirect, jsonify, abort
from db.crud.user_crud import get_or_create_user

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

def ensure_user_in_database(user_info):
    """
    Ensure that the authenticated user exists in the database.
    Creates a new user record if one doesn't exist.
    """
    if not user_info or "user" not in user_info:
        return None
    
    username = user_info["user"]
    
    # Extract additional information from CAS response if available
    # Princeton CAS may provide additional attributes
    first_name = user_info.get("attributes").get("givenname", [None])[0]
    last_name = user_info.get("attributes").get("pudisplayname", [None])[0].split(",")[0]  # sn = surname in LDAP
    email = user_info.get("attributes").get("mail", [f"{username}@princeton.edu"])[0]

    # If names are not provided in CAS response, use defaults
    if not first_name and not last_name:
        # Split username if it contains common patterns
        if "." in username:
            parts = username.split(".")
            first_name = parts[0].capitalize()
            last_name = parts[-1].capitalize() if len(parts) > 1 else ""
        else:
            first_name = username.capitalize()
            last_name = ""
    
    try:
        user = get_or_create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email
        )
        return user
    except Exception as e:
        print(f"Error creating/updating user in database: {e}")
        return None

#-----------------------------------------------------------------------

# Authenticate the user, and return the user's info.
# Do not return unless the user is successfully authenticated.
def authenticate(redirect_url=None):

    # If the user_info is in the session, then the user was
    # authenticated previously.  So return the username.
    if "user_info" in session:
        user_info = session.get("user_info")
        
        # Ensure user_id is in session (for backwards compatibility with existing sessions)
        if "user_id" not in session:
            db_user = ensure_user_in_database(user_info)
            if db_user:
                session["user_id"] = db_user.id
        
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
    # the session and ensure they exist in the database
    session["user_info"] = user_info
    
    # Ensure user exists in database
    db_user = ensure_user_in_database(user_info)
    if db_user:
        # Store the database user ID in session for easy access
        session["user_id"] = db_user.id
    
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

def get_user_id():
    """Get the current user's database ID from session"""
    return session.get('user_id')

#-----------------------------------------------------------------------

def get_current_user_record():
    """Get the current user's database record"""
    from db.crud.user_crud import get_user_by_id
    user_id = get_user_id()
    if user_id is None:
        return None
    return get_user_by_id(user_id)

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
            
            # Ensure user exists in database
            db_user = ensure_user_in_database(user_info)
            if db_user:
                # Store the database user ID in session for easy access
                session["user_id"] = db_user.id
            
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
    session.clear()
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
    db_user = get_current_user_record()
    
    response_data = {
        "authenticated": True,
        "username": get_username(),
        "user_info": user_info
    }
    
    # Add database user information if available
    if db_user:
        response_data["user_id"] = db_user.id
        response_data["first_name"] = db_user.first_name
        response_data["last_name"] = db_user.last_name
        response_data["email"] = db_user.email
        response_data["phone_number"] = db_user.phone_number
    
    return jsonify(response_data)

@auth_bp.route("/status")
def auth_status():
    """Check authentication status"""
    return jsonify({
        "authenticated": is_authenticated(),
        "username": get_username() if is_authenticated() else None
    })