# actual routes / API for pairing requests
from typing import Optional
from flask import Blueprint, request, send_from_directory, jsonify, g
from common.types.pairing_event import PairingEvent, PairingResult, PairedGroup
from common.types.user import User, UserProfile, UserPairingInformation
from datetime import datetime, timezone, timedelta
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import EventTable, EventRegistrationsTable
from db.models.user import UserTable
from db.models.organizations import OrganizationTable
from sqlalchemy import inspect, select
from api.dependencies import get_db_sessionmaker, get_llm
from common.logging import logger, session_id_var
from modules.pairing.orchestrator import PairingOrchestrator
from app_types.api.response.pairing_response import PairingResponse
from db.crud.registration_crud import get_all_registered_users_for_event
from common.types.event_enums import EventStatus, EventRole
from db.crud.pairing_crud import store_new_pairing, get_pairings_for_event
from db.crud.events_crud import get_event_by_id, check_if_sibling_role_considered
from common.error_response import generic_error_response
import uuid

# use blueprint to group routes
pairing_bp = Blueprint("pairing", __name__)

@pairing_bp.get("/")
def pair_students_baseline():

    # load in global dependencies
    db_session = get_db_sessionmaker()
    llm_client = get_llm()

    try:
        group_size = request.args.get("group_size", type=int)
        if not isinstance(group_size, int):
            return jsonify({"error": "Group size must be a valid integer"}), 400
    except:
        return jsonify({"error": "Group size must be a valid integer"}), 400
    
    try:
        event_id = request.args.get("event_id", default=2, type=int)
        if not isinstance(event_id, int):
            return jsonify({"error": "Event id must be a valid integer"}), 400
    except:
        return jsonify({"error": "Event id must be a valid integer"}), 400
    
    logger.info(f"Received pairing request for event {event_id} with group size {group_size}")

    # users should not be able to request groups of size < 2
    if group_size <= 1:
        logger.warning(
            f"Group size {group_size} is invalid, please revise to an integer greater than 1.")
        return jsonify({"error": "Group size must be an integer greater than 1."}), 400

    # TODO: depending on the group size, call the group pairing helper or the partner pairing helper
    # NOTE: currently no separate prompt for partner pairing; to be worked on.
    # Also should be handled inside the pairing orchestrator.
    try:
        students: list[UserPairingInformation] | None = get_all_registered_users_for_event(event_id=event_id)
        published_event: PublishedEvent | None = get_event_by_id(event_id=event_id)
    except Exception as e:
        logger.error(f"Error fetching registered users and event details: {e}")
        return jsonify(generic_error_response), 500

    logger.info(f"Found {len(students) if students else 0} registered users for event {event_id}, studnets: {students}")
    if not students:
        # return empty pairing response
        return jsonify({"event_id": event_id, "pairing_results": {}}), 200
    
    if not published_event:
        # return event not found error
        return jsonify({"error": "Event not found"}), 404

    # depending on if sibling role is considered or not, call different pairing helper
    try:
        # NOTE: the helper enforces bool return, default to False if db is corrupt
        is_sibling_role_considered = check_if_sibling_role_considered(event_id=event_id)
    except Exception as e:
        logger.error(f"Error checking if sibling role considered for event {event_id}: {e}")
        return jsonify(generic_error_response), 500

    # initialize orhcestrator and repo
    pairing_orchestrator = PairingOrchestrator(
        main_db_session=db_session, llm_client=llm_client)
    
    # helper creates pairing result, stores in db, and returns the result
    try:
        # if sibling role considered, call appropriate sibling role pairing helper
        if is_sibling_role_considered:
            pairing_result: PairingResult = pairing_orchestrator.pair_groups_with_sibling_roles(
                students=students,
                group_size=group_size,
                event_description=published_event.description,
                event_id=event_id
            )
        else:
            pairing_result: PairingResult = pairing_orchestrator.pair_students_in_groups(
                students=students,
                group_size=group_size,
                event_description=published_event.description,
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
    students.append(UserPairingInformation(id=1, name="John Doe", email="johndoe@me.com", role=EventRole.BIG_SIBLING,
                    profile_summary="I like software engineering, building web apps. I love Python."))
    students.append(UserPairingInformation(id=2, name="Jane Doe", email="janedoe@me.com",
                    role=EventRole.BIG_SIBLING, profile_summary="Jane Doe is an athelete in the Rugby team."))
    students.append(UserPairingInformation(id=3, name="Bob Smith", email="bobsmith@me.com", role=EventRole.LITTLE_SIBLING,
                    profile_summary="Bob likes to build machine learning models and apps."))
    students.append(UserPairingInformation(id=4, name="Alice Johnson", email="alicejohnson@me.com", role=EventRole.LITTLE_SIBLING,
                    profile_summary="Alice Johnson loves to film vlogs eating food in Manhattan Chinatown."))
    students.append(UserPairingInformation(id=5, name="Charlie Brown", email="charliebrown@me.com", role=EventRole.LITTLE_SIBLING,
                    profile_summary="Charlie Brown plays basketball everyday. He also loves soccer."))
    students.append(UserPairingInformation(id=6, name="Emily Davis", email="emilydavis@me.com", role=EventRole.BIG_SIBLING,
                    profile_summary="Emily Davis is a chef and loves to cook for her friends."))

    # initialize orhcestrator and repo
    pairing_orchestrator = PairingOrchestrator(
        main_db_session=db_session, llm_client=llm_client)
    pairing_result: PairingResult = pairing_orchestrator.pair_students_in_groups(
        students=students,
        group_size=group_size,
        event_description="This is a casual social event.", # generic sample description
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

    try:
        event_id = int(event_id)
    except (ValueError, TypeError):
        return jsonify({"error": "event_id must be an integer"}), 400

    try:
        client_error_msg, pairing_result = get_pairings_for_event(event_id)
        
        if client_error_msg:
            return jsonify(client_error_msg), 404

        if not pairing_result:
            return jsonify({"error": "No matches were found"}), 404

        response = PairingResponse(
            event_id=event_id,
            pairing_results=pairing_result
        )
        return jsonify(response.model_dump(mode="json")), 200

    except Exception as e:
        logger.error(f"Error getting matches of an event: {e}")
        return jsonify(generic_error_response), 500

@pairing_bp.get("/event/<int:event_id>/my-match")
def get_student_match(event_id: int):
    try:
        event_id = int(event_id)
    except (ValueError, TypeError):
        return jsonify({"error": "event_id must be an integer"}), 400

    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return jsonify({"error": "user_id must be an integer"}), 400

    try:
        db_session = get_db_sessionmaker()

        with db_session() as session:
            event = session.scalar(
                select(EventTable).where(EventTable.id == event_id))

            if not event:
                return jsonify({"error": "Event not found"}), 404

            if event.status != EventStatus.PAIRING_PUBLISHED:
                return jsonify({"error": "Matches for this event are not yet published"}), 400

            # Check valid registration
            registration = session.scalar(
                select(EventRegistrationsTable).where(
                    EventRegistrationsTable.event_id == event_id
                ).where(
                    EventRegistrationsTable.user_id == user_id
                )
            )

            if not registration:
                return jsonify({"error": "You are not registered for this event"}), 403

            if not registration.valid_registration:
                return jsonify({"error": "You do not have a valid registration for this event"}), 403

            # 4. Ensure matches exist
            if not event.matches or len(event.matches) == 0:
                return jsonify({"error": "No matches were found"}), 404

            student_group = None
            for group in event.matches:
                if user_id in group:
                    student_group = group
                    break

            if not student_group:
                return jsonify({"error": "You were not matched for this event"}), 404

            users = (session.query(UserTable, EventRegistrationsTable).join(EventRegistrationsTable, EventRegistrationsTable.user_id == UserTable.id)
                     .filter(
                EventRegistrationsTable.event_id == event_id,
                UserTable.id.in_(student_group)
            )
                .all()
            )

            group = []
            for user, registration in users:
                group.append(
                    User(
                        id=user.id,
                        name=f"{user.first_name} {user.last_name}",
                        email=user.email,
                        role=registration.role
                    )
                )

            paired_group = PairedGroup(students=group)
            response = PairingResponse(
                event_id=event_id,
                pairing_results=PairingResult(
                    groups=[paired_group],
                    llm_reasoning=event.llm_reasoning
                )
            )

            return jsonify(response.model_dump(mode="json")), 200

    except Exception as e:
        logger.error(
            f"Error retrieving student match for event {event_id}: {e}")
        return jsonify({"error": "Internal server error"}), 500
