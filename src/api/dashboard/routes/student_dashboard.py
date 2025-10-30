# main landing page for students after logging in
from flask import Blueprint, request, send_from_directory
from common.types.events import PairingEvent, PairingResult
from datetime import datetime, timezone, timedelta
from api import validate_model

# use blueprint to group routes
student_dashboard_bp = Blueprint("student_dashboard", __name__)

# TODO: change this to be the actual landing page
@student_dashboard_bp.get("/")
def foo():
    return "something"

@student_dashboard_bp.get("/event-browse")
def browse_events():
    # TODO: connect w/ db to return real events

    pairing_event: PairingEvent = PairingEvent(
        id=1,
        organization_id=1,
        title="PeerPear Big-Sib Little-Sib",
        description="The annual mentorship program for PeerPear!",
        image_url="../../assets/images/peerpear_logo.png", # static right now
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=1), # set to tomorrow
        is_active=True,
        participants=[1, 2, 3, 4], 
        matches=PairingResult(groups=[[1,2], [3,4]]),
    )
    
    return pairing_event.model_dump_json()