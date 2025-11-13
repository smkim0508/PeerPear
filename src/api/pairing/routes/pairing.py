# actual routes / API for pairing requests
from typing import Optional
from flask import Blueprint, request, send_from_directory, jsonify, g
from common.types.pairing_event import PairingEvent, PairingResult, PairedGroup
from common.types.user import User, UserProfile, UserProfileFull
from datetime import datetime, timezone, timedelta
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import EventTable, EventRegistrationsTable
from db.models.user import UserTable
from db.models.organizations import OrganizationTable
from sqlalchemy import inspect, select
from api.dependencies import get_db_sessionmaker, get_llm
from common.logging import logger
from modules.pairing.orchestrator import PairingOrchestrator
from app_types.api.response.pairing_response import PairingResponse
from db.crud.registration_crud import get_all_registered_users_for_event
from common.types.event_enums import EventStatus, EventRole
from db.crud.pairing_crud import store_new_pairing
from common.error_response import generic_error_response

# use blueprint to group routes
pairing_bp = Blueprint("pairing", __name__)

@pairing_bp.get("/")
def pair_students_baseline():

    # load in global dependencies
    db_session = get_db_sessionmaker()
    llm_client = get_llm()

    # NOTE: pass args through request, currently has defaults set
    group_size = request.args.get("group_size", default=2, type=int)
    event_id = request.args.get("event_id", default=2, type=int)

    # users should not be able to request groups of size < 2
    if group_size <= 1:
        logger.warning(
            f"Group size {group_size} is invalid, please revise to an integer greater than 1.")
        return jsonify({"error": "Group size must be an integer greater than 1."}), 400

    # TODO: depending on the group size, call the group pairing helper or the partner pairing helper
    try:
        students: list[UserProfile] | None = get_all_registered_users_for_event(event_id=event_id)
    except Exception as e:
        logger.error(f"Error getting registered users: {e}")
        return jsonify(generic_error_response), 500

    if not students:
        # return empty response
        return jsonify({"event_id": event_id, "pairing_results": {}}), 200

    # initialize orhcestrator and repo
    pairing_orchestrator = PairingOrchestrator(
        main_db_session=db_session, llm_client=llm_client)
    # helper creates pairing result, stores in db, and returns the result
    try:
        pairing_result: PairingResult = pairing_orchestrator.pair_students_in_groups(
            students=students,
            group_size=group_size,
            event_id=event_id
        )
    except Exception as e:
        logger.error(f"Error pairing students: {e}")
        return jsonify(generic_error_response), 500

    pairing_event_response = PairingResponse(
        event_id=event_id,
        pairing_results=pairing_result
    )

    return jsonify(pairing_event_response.model_dump(mode="json")), 200

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
        logger.warning(
            f"Group size {group_size} is invalid, please revise to an integer greater than 1.")
        return jsonify({"error": "Group size must be an integer greater than 1."}), 400

    # TODO: depending on the group size, call the group pairing helper or the partner pairing helper

    # dummy values below, the **intention** is that LLM should correctly pair up: (John + Bob); (Jane + Charlie); (Alice + Emily
    students = []
    students.append(UserProfile(id=1, name="John Doe", email="johndoe@me.com", role=EventRole.BIG_SIBLING,
                    profile_summary="I like software engineering, building web apps. I love Python."))
    students.append(UserProfile(id=2, name="Jane Doe", email="janedoe@me.com",
                    role=EventRole.BIG_SIBLING, profile_summary="Jane Doe is an athelete in the Rugby team."))
    students.append(UserProfile(id=3, name="Bob Smith", email="bobsmith@me.com", role=EventRole.LITTLE_SIBLING,
                    profile_summary="Bob likes to build machine learning models and apps."))
    students.append(UserProfile(id=4, name="Alice Johnson", email="alicejohnson@me.com", role=EventRole.LITTLE_SIBLING,
                    profile_summary="Alice Johnson loves to film vlogs eating food in Manhattan Chinatown."))
    students.append(UserProfile(id=5, name="Charlie Brown", email="charliebrown@me.com", role=EventRole.LITTLE_SIBLING,
                    profile_summary="Charlie Brown plays basketball everyday. He also loves soccer."))
    students.append(UserProfile(id=6, name="Emily Davis", email="emilydavis@me.com", role=EventRole.BIG_SIBLING,
                    profile_summary="Emily Davis is a chef and loves to cook for her friends."))

    # initialize orhcestrator and repo
    pairing_orchestrator = PairingOrchestrator(
        main_db_session=db_session, llm_client=llm_client)
    pairing_result: PairingResult = pairing_orchestrator.pair_students_in_groups(
        students=students,
        group_size=group_size,
        event_id=event_id
    )

    pairing_event_response = PairingResponse(
        event_id=event_id,
        pairing_results=pairing_result
    )

    return jsonify(pairing_event_response.model_dump(mode="json")), 200

# Lets an organization see the pairings for one of their events
@pairing_bp.get("/event/<int:event_id>")
def get_event_pairings(event_id):

    if not event_id:
        return jsonify({"error": "event_id and user_id are required"}), 400
    try:
        event_id = int(event_id)
    except (ValueError, TypeError):
        return jsonify({"error": "event_id must be an integer"}), 400

    try:
        db_session = get_db_sessionmaker()

        with db_session as session:
            event = session.scalar(
                select(EventTable).where(EventTable.id == event_id))

        if not event:
            return {"error": "Event not found", "status": 404}

        if not event.matches or len(event.matches) == 0:
            return jsonify({"error": "No matches were found"}), 404

        all_users = set()

        for group in event.matches:
            for userid in group:
                all_users.add(userid)

        users = (session.query(UserTable, EventRegistrationsTable).join(EventRegistrationsTable, EventRegistrationsTable.user_id == UserTable.id)
                 .filter(
            EventRegistrationsTable.event_id == event_id,
            UserTable.id.in_(all_users)
        )
            .all()
        )

        user_map = {user.id:
                    User(
                        id=user.id,
                        name=f"{user.first_name} {user.last_name}",
                        email=user.email,
                        role=registration.role
                    ) for user, registration in users}

        paired_groups: list[PairedGroup] = []

        for group in event.matches:
            group_users = [user_map[user_id]
                           for user_id in group if user_id in user_map]
            paired_groups.append(PairedGroup(students=group_users))

        response = PairingResponse(event_id=event_id, pairing_results=PairingResult(
            groups=paired_groups, llm_reasoning=None))
        
        return jsonify(response.model_dump(mode="json")), 200

    except Exception as e:
        logger.error(f"Error getting matches of an event: {e}")
        return jsonify({"error": "Internal server error"}), 500
