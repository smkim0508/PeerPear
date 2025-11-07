# routes for user profile edit and retrieval
from flask import Blueprint, request, send_from_directory, jsonify, g
import os
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import Event
from db.crud.profile_crud import update_user_profile, get_user_profile
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from db.models.organizations import Organization
from common.types.user import UserProfile

# use blueprint to group routes
user_profile_bp = Blueprint("user_profile", __name__)

@user_profile_bp.get("/update-profile")
def update_profile():

    profile_payload = request.get_json() # NOTE: retrieves the whole profile as json obj

    user_id = profile_payload.get("user_id")
    first_name = profile_payload.get("first_name")
    last_name = profile_payload.get("last_name")
    email = profile_payload.get("email")
    phone_number = profile_payload.get("phone_number")
    gender = profile_payload.get("gender")
    class_year = profile_payload.get("class_year")
    major = profile_payload.get("major")
    hobbies = profile_payload.get("hobbies")

    user_profile = UserProfile(
        id=user_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        gender=gender,
        class_year=class_year,
        major=major,
        hobbies=hobbies
    )

    # TODO: actually update the profile

    print(f"user id: {user_id}, first_name: {first_name}, last_name: {last_name}, email: {email}, phone_number: {phone_number}, gender: {gender}, class_year: {class_year}, major: {major}, hobbies: {hobbies}")

    # if any of the fields are none, do not touch it in db

    updated_profile = update_user_profile(user_profile=user_profile)

    return jsonify({"message": "Profile updated successfully"}), 200

# please look this over
@user_profile_bp.patch("/event")
def update_event():
    organization_id = request.args.get("organization_id")
    event_id = request.args.get("event_id")

    if organization_id is None or event_id is None:
        return jsonify({"error": "organization_id and event_id are required"}), 400

    # Check if the event exists and belongs to the organization
    event = g.db.query(Event).filter(Event.id == event_id).first()

    if event is None:
        return jsonify({"error": "Event not found"}), 404

    elif event.organization_id != organization_id:
        return jsonify({"error": "Event does not belong to the organization"}), 404

    # TODO: actually update the events
    return jsonify({"message": "Event updated successfully"}), 200


# NOTE: by convention, use "-" to split words in routes
@user_profile_bp.post("/create-event")
def create_event():
    """
    Create a new event for an organization.
    Expects JSON payload with:
    - organization_id
    - title
    - description
    - image_url (optional)
    - start_date
    - end_date
    """

    data = request.get_json(silent=True) or {}

    organization_id = data.get("organization_id")

    if not organization_id:
        return jsonify({"error": "organization_id is required"}), 400

    title = data.get("title", "Untitled Event")
    description = data.get("description", "")
    image_url = data.get(
        "image_url",
        f"{request.host_url}organization-dashboard/static/peerpear_logo.png",
    )

    today = datetime.now()
    today_date = today.date()
    matches = {}
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    try:
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
    except Exception:
        return jsonify({"error": "Invalid date format"}), 400

    if end_dt.date() < start_dt.date():
        return jsonify({"error": "End date must be after start date"}), 400

    if start_dt.date() < datetime.now().date():
        return jsonify({"error": "Start date cannot be in the past"}), 400

    active = start_dt.date() == today_date
    new_event = Event(
        organization_id=organization_id,
        title=title,
        description=description,

        # image_url=image_url,
        start_date=start_dt,
        end_date=end_dt,
        matches=matches,
        active=active,
    )
    try:
        g.db.add(new_event)
        g.db.commit()
    except SQLAlchemyError as e:
        g.db.rollback()
        print(str(e))
        return jsonify({"error": f"Database error"}), 500
    # NOTE: all routes should return some error/success message and HTTP status
    return jsonify({"message": "Event created successfully"}), 200
