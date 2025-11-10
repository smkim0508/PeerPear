# actual routes / API for pairing requests
from typing import Optional
from flask import Blueprint, request, send_from_directory, jsonify, g
from common.types.pairing_event import PairingEvent, PairingResult, PairedGroup
from common.types.user import User, UserProfile, UserProfileFull
from datetime import datetime, timezone, timedelta
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import EventTable
from db.models.organizations import OrganizationTable
from sqlalchemy import inspect
from api.dependencies import get_db_sessionmaker, get_llm
from common.logging import logger
from modules.pairing.orchestrator import PairingOrchestrator
from app_types.api.response.pairing_response import PairingResponse
from db.crud.registration_crud import get_all_registered_users_for_event

# use blueprint to group routes
pairing_bp = Blueprint("pairing", __name__)

@pairing_bp.get("/")
def pair_students_baseline():

    # load in global dependencies
    db_session = get_db_sessionmaker()
    llm_client = get_llm()
    
    # pass args through request
    group_size = request.args.get("group_size", default=2, type=int)
    event_id = request.args.get("event_id", default=1, type=int)

    # users should not be able to request groups of size < 2
    if group_size <= 1:
        logger.warning(f"Group size {group_size} is invalid, please revise to an integer greater than 1.")
        return jsonify({"error": "Group size must be an integer greater than 1."}), 400
    
    # TODO: depending on the group size, call the group pairing helper or the partner pairing helper

    students: list[UserProfile] | None = get_all_registered_users_for_event(event_id=event_id)

    if not students:
        return jsonify({"event_id": event_id, "pairing_results": {}}), 200 # return empty response

    # initialize orhcestrator and repo
    pairing_orchestrator = PairingOrchestrator(main_db_session=db_session, llm_client=llm_client)
    pairing_result: PairingResult = pairing_orchestrator.pair_students_in_groups(students=students, group_size=group_size)

    pairing_event_response = PairingResponse(
        event_id=event_id,
        pairing_results=pairing_result
    )

    return jsonify(pairing_event_response.model_dump()), 200

# NOTE: temporary testing endpoint to see LLM functionality with small pairing.
@pairing_bp.get("/test")
def pair_students_test():

    # load in global dependencies
    db_session = get_db_sessionmaker()
    llm_client = get_llm()

    group_size = 2
    event_id = 1

    # users should not be able to request groups of size < 2
    if group_size <= 1:
        logger.warning(f"Group size {group_size} is invalid, please revise to an integer greater than 1.")
        return jsonify({"error": "Group size must be an integer greater than 1."}), 400
    
    # TODO: depending on the group size, call the group pairing helper or the partner pairing helper

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
