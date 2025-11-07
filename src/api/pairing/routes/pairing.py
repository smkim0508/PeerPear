# actual routes / API for pairing requests
from typing import Optional
from flask import Blueprint, request, send_from_directory, jsonify, g
from common.types.pairing import PairingEvent, PairingResult, PairedGroup
from common.types.user import User, UserProfile, UserProfileFull
from datetime import datetime, timezone, timedelta
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import Event
from db.models.organizations import Organization
from sqlalchemy import inspect
from api.dependencies import get_db_session, get_llm
from common.logging import logger
from modules.pairing.orchestrator import PairingOrchestrator
from app_types.api.response.pairing_response import PairingResponse

# use blueprint to group routes
pairing_bp = Blueprint("pairing", __name__)

@pairing_bp.get("/")
# NOTE: the params are set optional for now, just to test locally without FE connection / setting up Postman
def pair_students_baseline(group_size: Optional[int] = None, event_id: Optional[int] = None):

    # TODO: make this work with request.args, and also add db crud helper to query values given event id

    # load in global dependencies
    db_session = get_db_session()
    llm_client = get_llm()

    # NOTE: set as static values, should be passed in from front end
    group_size = 2
    event_id = 1

    # users should not be able to request groups of size < 2
    if group_size <= 1:
        logger.warning(f"Group size {group_size} is invalid, please revise to an integer greater than 1.")
        return jsonify({"error": "Group size must be an integer greater than 1."}), 400
    
    # TODO: depending on the group size, call the group pairing helper or the partner pairing helper

    # NOTE: for now, the event_id is not used. Ideally, we should query the student ids associated with our event id to run this process.
    # dummy values below, the **intention** is that LLM should correctly pair up: (John + Bob); (Jane + Charlie); (Alice + Emily
    students = []
    students.append(UserProfile(id=1, name="John Doe", profile_summary="I like software engineering, building web apps. I love Python."))
    students.append(UserProfile(id=2, name="Jane Doe", profile_summary="Jane Doe is an athelete in the Rugby team."))
    students.append(UserProfile(id=3, name="Bob Smith", profile_summary="Bob likes to build machine learning models and apps."))
    students.append(UserProfile(id=4, name="Alice Johnson", profile_summary="Alice Johnson loves to film vlogs eating food in Manhattan Chinatown."))
    students.append(UserProfile(id=5, name="Charlie Brown", profile_summary="Charlie Brown plays basketball everyday. He also loves soccer."))
    students.append(UserProfile(id=6, name="Emily Davis", profile_summary="Emily Davis is a chef and loves to cook for her friends."))

    # initialize orhcestrator and repo
    pairing_orchestrator = PairingOrchestrator(main_db_session=db_session, llm_client=llm_client)
    pairing_result: PairingResult = pairing_orchestrator.pair_students_in_groups(students=students, group_size=group_size)

    pairing_event_response = PairingResponse(
        event_id=event_id,
        pairing_results=pairing_result
    )

    return jsonify(pairing_event_response.model_dump()), 200