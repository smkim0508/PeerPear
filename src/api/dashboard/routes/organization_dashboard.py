# main landing page for organizations after logging in
from flask import Blueprint, request, jsonify, session, g, current_app
from app_types.api.response.event_browse_response import EventBrowseResponse
from db.crud.events_crud import get_organization_events, create_new_event
from common.logging import logger
from common.error_response import generic_error_response
from auth.routes.auth import require_auth
from db.models.orgadmin import OrgAdminTable
from api.dependencies import get_db_sessionmaker
from sqlalchemy import select
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from db.models.events import EventTable
from common.types.pairing_event import PairingEvent, PairingResult
from common.types.event_enums import EventStatus, EventRole
from db.supabase_client import upload_new_image, upload_event_image
from flask import Blueprint

# use blueprint to group routes
org_dashboard_bp = Blueprint("organization_dashboard", __name__)


student_bp = Blueprint("student_dashboard", __name__)


@org_dashboard_bp.get("/")
def foo():
    return "placeholder"


@org_dashboard_bp.get("/event-browse")
@require_auth
def browse_events():
    # Get organization_id from query parameter
    organization_id = request.args.get("organization_id")
    
    if organization_id is None:
        return jsonify({"error": "organization_id is required"}), 400

    # Get user_id from session
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401

    # Verify user has admin access to this specific organization
    db_session = get_db_sessionmaker()
    with db_session() as db_session_instance:
        org_admin = db_session_instance.scalar(
            select(OrgAdminTable).where(
                (OrgAdminTable.user_id == user_id) & 
                (OrgAdminTable.organization_id == organization_id)
            )
        )

        if org_admin is None:
            return jsonify({"error": "User is not admin for this organization"}), 403

    # use helper to retrieve all events for the organization
    try:
        published_events = get_organization_events(organization_id)
    except Exception as e:
        logger.error(f"Error retrieving events: {e}")
        return jsonify(generic_error_response), 500

    pairing_event_response = EventBrowseResponse(events=published_events)
    return jsonify(pairing_event_response.model_dump(mode="json")), 200

# NOTE: NOT DONE - should also use CRUD operations with DTO / ORM conversion

@org_dashboard_bp.patch("/event")
@require_auth
def update_event():
    event_id = request.args.get("event_id")

    if event_id is None:
        return jsonify({"error": "event_id is required"}), 400

    # Get user_id from session and look up organization
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401

    # Look up organization_id from orgadmins table
    db_session = get_db_sessionmaker()
    with db_session() as session_instance:
        org_admins = session_instance.scalars(
            select(OrgAdminTable).where(OrgAdminTable.user_id == user_id)
        ).all()

        if not org_admins:
            return jsonify({"error": "User is not an organization admin"}), 403

        organization_ids = [org_admin.organization_id for org_admin in org_admins]

        # Check if the event exists and belongs to the organization
        event = session_instance.scalar(
            select(EventTable).where(EventTable.id == event_id)
        )

        if event is None:
            return jsonify({"error": "Event not found"}), 404

        if event.organization_id not in organization_ids:
            return jsonify({"error": "Event does not belong to the organization"}), 404

        payload = request.get_json(silent=True) or {}
        allowed_fields = ["title", "description", "status", "end_date"]
        for key, value in payload.items():
            if key in allowed_fields and hasattr(event, key):
                setattr(event, key, value)

        session_instance.commit()
        session_instance.refresh(event)
        return jsonify({"message": "Event updated successfully"}), 200

@org_dashboard_bp.patch("/event/image")
@require_auth
def update_event_image():
    """
    Update or remove the event image.
    Expects event_id as query param and either:
    - image file in form-data (for upload)
    - {"remove_image": true} in JSON (for removal)
    """
    event_id = request.args.get("event_id")
    if event_id is None:
        return jsonify({"error": "event_id is required"}), 400

    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401

    db_session = get_db_sessionmaker()
    with db_session() as session_instance:
        # Get org admins
        org_admins = session_instance.scalars(
            select(OrgAdminTable).where(OrgAdminTable.user_id == user_id)
        ).all()
        if not org_admins:
            return jsonify({"error": "User is not an organization admin"}), 403
        organization_ids = [org_admin.organization_id for org_admin in org_admins]

        # Get event
        event = session_instance.scalar(
            select(EventTable).where(EventTable.id == event_id)
        )
        if event is None:
            return jsonify({"error": "Event not found"}), 404
        if event.organization_id not in organization_ids:
            return jsonify({"error": "Event does not belong to the organization"}), 403

        # Get JSON payload if any
        payload = request.get_json(silent=True) or {}

        # === REMOVE IMAGE ===
        if payload.get("remove_image"):
            event.image_url = None
            session_instance.commit()
            session_instance.refresh(event)
            return jsonify({"message": "Image removed successfully", "image_url": None}), 200

        # === UPLOAD IMAGE ===
        uploaded_file = request.files.get("image")
        if not uploaded_file:
            return jsonify({"error": "No image file provided"}), 400

        try:
            file_bytes = uploaded_file.read()
            content_type = uploaded_file.content_type
            filename = uploaded_file.filename

            image_url = upload_event_image(
                event_id=int(event_id),
                file_bytes=file_bytes,
                filename=filename,
                content_type=content_type,
                old_image_url=event.image_url
            )
            
            event.image_url = image_url
            session_instance.commit()
            session_instance.refresh(event)

            return jsonify({"message": "Image updated successfully", "image_url": image_url}), 200

        except Exception as e:
            logger.error(f"Error uploading image: {e}")
            return jsonify({"error": "Failed to upload image"}), 500


@student_bp.get("/events")
@require_auth
def student_events():
    """
    Get all events visible to students.
    Returns event info including image_url.
    """
    try:
        # `organization_id=None` means fetch all events
        events = get_organization_events(organization_id=None)
        pairing_event_response = EventBrowseResponse(events=events)
        return jsonify(pairing_event_response.model_dump(mode="json")), 200
    except Exception as e:
        logger.error(f"Error retrieving events for student: {e}")
        return jsonify(generic_error_response), 500

@org_dashboard_bp.post("/create-event")
@require_auth
def create_event():
    """
    Create a new event for an organization.
    Expects JSON payload with:
    - title
    - description
    - image_url (optional)
    - end_date
    - 

    The organization_id is determined from the authenticated user's session.

    defaults:
    - status = NOT_STARTED
    """

    data = request.form

    # Get user_i and organization_id from session and look up on db to verify access
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401

    # get organization_id from form data, validate that it's an int
    organization_id = data.get("organization_id", None)
    if organization_id is None:
        return jsonify({"error": "organization_id is required"}), 400

    try:
        organization_id = int(organization_id)
    except ValueError:
        return jsonify({"error": "organization_id must be an integer"}), 400

    # Look up orgadmins table to make sure user has access
    db_session = get_db_sessionmaker()
    with db_session() as db_session_instance:
        org_admin = db_session_instance.scalar(
            select(OrgAdminTable)
            .where(OrgAdminTable.user_id == user_id)
            .where(OrgAdminTable.organization_id == organization_id)
        )

        if org_admin is None:
            return jsonify({"error": "User is not an organization admin"}), 403

    title = data.get("title", "Untitled Program")
    description = data.get("description", "")
    check_sibling_roles = data.get("check_sibling_roles", False)

    uploaded_file = request.files.get("image")
    image_url = None

    # get default image from buckets
    media_url = current_app.config.get("MEDIA_URL", None)
    if media_url is None:
        default_image_url = f"{request.host_url}static/peerpear_logo.png"
    else:
        default_image_url = f"{media_url}/peerpear_logo.png"

    if uploaded_file:
        file_bytes = uploaded_file.read()
        content_type = uploaded_file.content_type
        filename = uploaded_file.filename

        image_url = upload_new_image(file_bytes, filename, content_type)
    else:
        image_url = default_image_url

    # NOTE: need to make sure FE integrates properly with the new payload, start_date is removed
    today = datetime.now(timezone.utc)
    today_date = today.date()
    end_date = data.get("end_date")

    # NOTE: try to parse the requested end date into standard datetime
    try:
        end_dt = datetime.fromisoformat(str(end_date))
    except Exception:
        return jsonify({"error": "Invalid date format"}), 400

    if end_dt.date() < today_date:
        return jsonify({"error": "End date cannot be in the past"}), 400

    new_event = PairingEvent(
        organization_id=organization_id,
        title=title,
        description=description,
        image_url=image_url,
        end_date=end_dt,
        check_sibling_roles=check_sibling_roles,
        status=EventStatus.NOT_STARTED
    )

    # create the new event in db
    try:
        updated_event = create_new_event(new_event)  # This already commits
        logger.info(f"Event created: {updated_event}")
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        return jsonify(generic_error_response), 500
    except Exception as e:
        logger.error(f"Unknown error: {e}")
        return jsonify(generic_error_response), 500

    return jsonify({"message": "Event created successfully", "event_id": updated_event.id}), 200
