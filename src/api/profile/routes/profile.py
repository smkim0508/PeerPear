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

@user_profile_bp.get("/student-profile")
def get_profile():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    profile = get_user_profile(user_id)

    if not profile:
        return jsonify({"profile": {}}), 200

    return jsonify({"profile": profile}), 200

@user_profile_bp.post("/update-profile")
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