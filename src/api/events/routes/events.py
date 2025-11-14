from flask import Blueprint, request, jsonify
from sqlalchemy import select
from db.models.events import EventTable, EventRegistrationsTable
from db.models.organizations import OrganizationTable
from db.models.question import QuestionTable
from db.models.response import ResponseTable
from db.models.user import UserTable
from common.types.event_enums import EventStatus, EventRole
from api.dependencies import get_db_sessionmaker
from common.logging import logger
from common.error_response import generic_error_response

events_bp = Blueprint("events", __name__)

@events_bp.get("/<int:event_id>")
def get_event_details(event_id: int):
    """
    Get event details including organization and questions
    NOTE: Replaces fetchEventById from frontend
    """
    try:
        db_session = get_db_sessionmaker()
        
        with db_session() as session:
            # Get event with organization
            event_query = (
                select(EventTable, OrganizationTable)
                .join(OrganizationTable, EventTable.organization_id == OrganizationTable.id)
                .where(EventTable.id == event_id)
            )
            
            event_result = session.execute(event_query).one_or_none()
            if not event_result:
                return jsonify({"error": "Event not found"}), 404
            
            event, organization = event_result
            
            # Get questions for the event
            questions_query = select(QuestionTable).where(QuestionTable.event_id == event_id)
            questions_result = session.execute(questions_query).all()
            questions = [q[0] for q in questions_result]
            
            # Format response
            event_data = {
                "id": event.id,
                "organization_id": event.organization_id,
                "created_at": event.end_date.isoformat() if event.end_date else None,  # Map to frontend expected field
                "ends_at": event.end_date.isoformat() if event.end_date else None,
                "active": event.status.value == "STARTED" if hasattr(event.status, 'value') else str(event.status) == "STARTED",
                "status": event.status.value if hasattr(event.status, 'value') else str(event.status),
                "title": event.title,
                "description": event.description,
                "matches": event.matches,
                "organizations": {
                    "id": organization.id,
                    "org_name": organization.org_name,
                    "description": organization.description
                },
                "questions": [
                    {
                        "id": q.id,
                        "question": q.question,
                        "options": q.options,
                        "event_id": q.event_id
                    } for q in questions
                ]
            }
            
            return jsonify(event_data), 200
            
    except Exception as e:
        logger.error(f"Error getting event details: {e}")
        return jsonify(generic_error_response), 500


@events_bp.get("/active")
def get_active_events():
    """
    Get all active events with organization details
    NOTE: Replaces fetchActiveEvents from frontend
    """
    try:
        db_session = get_db_sessionmaker()
        
        with db_session() as session:
            # Get active events with organizations
            query = (
                select(EventTable, OrganizationTable)
                .join(OrganizationTable, EventTable.organization_id == OrganizationTable.id)
                .where(EventTable.status == EventStatus.STARTED)
                .order_by(EventTable.end_date.desc())
            )
            
            results = session.execute(query).all()
            
            events = []
            for event, organization in results:
                # Get questions for each event
                questions_query = select(QuestionTable).where(QuestionTable.event_id == event.id)
                questions_result = session.execute(questions_query).all()
                questions = [q[0] for q in questions_result]
                
                event_data = {
                    "id": event.id,
                    "organization_id": event.organization_id,
                    "created_at": event.end_date.isoformat() if event.end_date else None,
                    "ends_at": event.end_date.isoformat() if event.end_date else None,
                    "active": event.status.value == "STARTED" if hasattr(event.status, 'value') else str(event.status) == "STARTED",
                    "status": event.status.value if hasattr(event.status, 'value') else str(event.status),
                    "title": event.title,
                    "description": event.description,
                    "matches": event.matches,
                    "organizations": {
                        "id": organization.id,
                        "org_name": organization.org_name,
                        "description": organization.description
                    },
                    "questions": [
                        {
                            "id": q.id,
                            "question": q.question,
                            "options": q.options,
                            "event_id": q.event_id
                        } for q in questions
                    ]
                }
                events.append(event_data)
            
            return jsonify(events), 200
            
    except Exception as e:
        logger.error(f"Error getting active events: {e}")
        return jsonify(generic_error_response), 500


@events_bp.get("/<int:event_id>/registration/<username>")
def check_user_registration(event_id: int, username: str):
    """
    Check if a user is registered for an event
    NOTE: Replaces checkUserRegistration from frontend
    """
    try:
        db_session = get_db_sessionmaker()
        
        with db_session() as session:
            # Get user by username
            user_query = select(UserTable).where(UserTable.username == username)
            user_result = session.execute(user_query).one_or_none()
            
            if not user_result:
                return jsonify({"registered": False}), 200
            
            user = user_result[0]
            
            # Check registration
            registration_query = (
                select(EventRegistrationsTable)
                .where(EventRegistrationsTable.event_id == event_id)
                .where(EventRegistrationsTable.user_id == user.id)
            )
            
            registration_result = session.execute(registration_query).one_or_none()
            is_registered = registration_result is not None
            
            return jsonify({"registered": is_registered}), 200
            
    except Exception as e:
        logger.error(f"Error checking user registration: {e}")
        return jsonify(generic_error_response), 500


@events_bp.post("/<int:event_id>/register")
def register_user_for_event(event_id: int):
    """
    Register a user for an event
    NOTE: Replaces registerUserForEvent from frontend
    """
    try:
        payload = request.get_json(silent=True) or {}
        username = payload.get("username")
        
        if not username:
            return jsonify({"error": "username is required"}), 400
        
        db_session = get_db_sessionmaker()
        
        with db_session() as session:
            # Get user by username
            user_query = select(UserTable).where(UserTable.username == username)
            user_result = session.execute(user_query).one_or_none()
            
            if not user_result:
                return jsonify({"error": "User not found"}), 404
            
            user = user_result[0]
            
            # Check if already registered
            existing_registration = (
                select(EventRegistrationsTable)
                .where(EventRegistrationsTable.event_id == event_id)
                .where(EventRegistrationsTable.user_id == user.id)
            )
            
            if session.execute(existing_registration).one_or_none():
                return jsonify({"error": "User already registered for this event"}), 400
            
            # Create registration
            registration = EventRegistrationsTable(
                event_id=event_id,
                user_id=user.id,
                valid_registration=False
            )
            
            session.add(registration)
            session.commit()
            
            return jsonify({"message": "Registration successful"}), 201
            
    except Exception as e:
        logger.error(f"Error registering user for event: {e}")
        return jsonify(generic_error_response), 500


@events_bp.delete("/<int:event_id>/register")
def unregister_user_from_event(event_id: int):
    """
    Unregister a user from an event
    NOTE: Replaces unregisterUserFromEvent from frontend
    """
    try:
        payload = request.get_json(silent=True) or {}
        username = payload.get("username")
        
        if not username:
            return jsonify({"error": "username is required"}), 400
        
        db_session = get_db_sessionmaker()
        
        with db_session() as session:
            # Get user by username
            user_query = select(UserTable).where(UserTable.username == username)
            user_result = session.execute(user_query).one_or_none()
            
            if not user_result:
                return jsonify({"error": "User not found"}), 404
            
            user = user_result[0]
            
            # Remove registration
            registration_query = (
                select(EventRegistrationsTable)
                .where(EventRegistrationsTable.event_id == event_id)
                .where(EventRegistrationsTable.user_id == user.id)
            )
            
            registration_result = session.execute(registration_query).one_or_none()
            if not registration_result:
                return jsonify({"error": "User not registered for this event"}), 400
            
            registration = registration_result[0]
            session.delete(registration)
            
            # Also remove any responses the user made for this event
            questions_query = select(QuestionTable.id).where(QuestionTable.event_id == event_id)
            question_ids = [q[0] for q in session.execute(questions_query).all()]
            
            if question_ids:
                responses_query = (
                    select(ResponseTable)
                    .where(ResponseTable.user_id == user.id)
                    .where(ResponseTable.question_id.in_(question_ids))
                )
                
                for response_row in session.execute(responses_query).all():
                    session.delete(response_row[0])
            
            session.commit()
            
            return jsonify({"message": "Unregistration successful"}), 200
            
    except Exception as e:
        logger.error(f"Error unregistering user from event: {e}")
        return jsonify(generic_error_response), 500


@events_bp.get("/<int:event_id>/responses/<username>")
def get_user_event_responses(event_id: int, username: str):
    """
    Get user's responses for an event
    NOTE: Replaces getUserEventResponses from frontend
    """
    try:
        db_session = get_db_sessionmaker()
        
        with db_session() as session:
            # Get user by username
            user_query = select(UserTable).where(UserTable.username == username)
            user_result = session.execute(user_query).one_or_none()
            
            if not user_result:
                return jsonify([]), 200
            
            user = user_result[0]
            
            # Get questions for this event
            questions_query = select(QuestionTable.id).where(QuestionTable.event_id == event_id)
            question_ids = [q[0] for q in session.execute(questions_query).all()]
            
            if not question_ids:
                return jsonify([]), 200
            
            # Get user's responses
            responses_query = (
                select(ResponseTable)
                .where(ResponseTable.user_id == user.id)
                .where(ResponseTable.question_id.in_(question_ids))
            )
            
            responses = []
            for response_row in session.execute(responses_query).all():
                response = response_row[0]
                responses.append({
                    "id": response.id,
                    "question_id": response.question_id,
                    "answer": response.answer,
                    "user_id": response.user_id
                })
            
            return jsonify(responses), 200
            
    except Exception as e:
        logger.error(f"Error getting user event responses: {e}")
        return jsonify(generic_error_response), 500


@events_bp.post("/<int:event_id>/responses")
def submit_event_responses(event_id: int):
    """
    Submit user responses for event questions
    NOTE: Replaces submitEventResponses from frontend
    """
    try:
        payload = request.get_json(silent=True) or {}
        username = payload.get("username")
        responses_data = payload.get("responses", [])
        
        if not username:
            return jsonify({"error": "username is required"}), 400
        
        if not responses_data:
            return jsonify({"error": "responses are required"}), 400
        
        db_session = get_db_sessionmaker()
        
        with db_session() as session:
            # Get user by username
            user_query = select(UserTable).where(UserTable.username == username)
            user_result = session.execute(user_query).one_or_none()
            
            if not user_result:
                return jsonify({"error": "User not found"}), 404
            
            user = user_result[0]
            
            # Insert responses
            for response_data in responses_data:
                response = ResponseTable(
                    question_id=response_data["questionId"],
                    user_id=user.id,
                    answer=response_data["answer"]
                )
                session.add(response)
            
            session.commit()
            
            return jsonify({"message": "Responses submitted successfully"}), 201
            
    except Exception as e:
        logger.error(f"Error submitting event responses: {e}")
        return jsonify(generic_error_response), 500


@events_bp.get("/<int:event_id>/participants")
def get_event_participants(event_id: int):
    """
    Get participants for an event (for organization users)
    NOTE: Replaces the participants fetching logic from frontend
    """
    try:
        db_session = get_db_sessionmaker()
        
        with db_session() as session:
            # Get participants with user details
            query = (
                select(EventRegistrationsTable, UserTable)
                .join(UserTable, EventRegistrationsTable.user_id == UserTable.id)
                .where(EventRegistrationsTable.event_id == event_id)
            )
            
            results = session.execute(query).all()
            
            participants = []
            for registration, user in results:
                participant = {
                    "id": registration.id,
                    "user_id": user.id,
                    "role": registration.role.value if registration.role and hasattr(registration.role, 'value') else str(registration.role) if registration.role else None,
                    "avatar_url": None,  # Add if you have avatar data
                    "username": user.username,
                    "full_name": f"{user.first_name} {user.last_name}"
                }
                participants.append(participant)
            
            return jsonify(participants), 200
            
    except Exception as e:
        logger.error(f"Error getting event participants: {e}")
        return jsonify(generic_error_response), 500