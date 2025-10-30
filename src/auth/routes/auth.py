import urllib.request
import urllib.parse
import re
import json
import flask

from wsgi import app

#-----------------------------------------------------------------------

_CAS_URL = "https://fed.princeton.edu/cas/"

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
def validate(ticket):
    val_url = (
        _CAS_URL
        + "validate"
        + "?service="
        + urllib.parse.quote(strip_ticket(flask.request.url))
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
def authenticate():

    # If the user_info is in the session, then the user was
    # authenticated previously.  So return the username.
    if "user_info" in flask.session:
        user_info = flask.session.get("user_info")
        return user_info["user"]

    # If the request does not contain a login ticket, then redirect
    # the browser to the login page to get one.
    ticket = flask.request.args.get("ticket")
    if ticket is None:
        login_url = (_CAS_URL + "login?service=" +
            urllib.parse.quote(flask.request.url))
        flask.abort(flask.redirect(login_url))

    # If the login ticket is invalid, then redirect the browser
    # to the login page to get a new one.
    user_info = validate(ticket)
    if user_info is None:
        login_url = (
            _CAS_URL
            + "login?service="
            + urllib.parse.quote(strip_ticket(flask.request.url))
        )
        flask.abort(flask.redirect(login_url))

    # The user is authenticated, so store the user_info in
    # the session and return the username.
    flask.session["user_info"] = user_info
    clean_url = strip_ticket(flask.request.url)
    flask.abort(flask.redirect(clean_url))

#-----------------------------------------------------------------------

def is_authenticated():

    return "user_info" in flask.session

#-----------------------------------------------------------------------

def get_user_info():

    return flask.session.get('user_info')

#-----------------------------------------------------------------------

def get_username():

    user_info = flask.session.get('user_info')
    if user_info is None:
        return None
    return user_info.get('user')

#-----------------------------------------------------------------------

@app.route("/logoutapp", methods=["GET"])
def logoutapp():
    flask.session.clear()
    return flask.redirect("/loggedout")

#-----------------------------------------------------------------------

@app.route("/logoutcas", methods=["GET"])
def logoutcas():
    logout_url = (
        _CAS_URL
        + "logout?service="
        + urllib.parse.quote(re.sub("logoutcas", "logoutapp",
            flask.request.url))
    )
    flask.abort(flask.redirect(logout_url))