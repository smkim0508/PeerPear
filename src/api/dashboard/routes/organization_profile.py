# organization profile page
from flask import Blueprint, request, send_from_directory, jsonify, g
import os
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import Event
from db.crud.org_profile_crud import get_organization_profile, update_organization_profile
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from db.models.organizations import Organization
from common.types.db_status import DBStatus

# use blueprint to group routes
org_profile_bp = Blueprint("organization_profile", __name__)


@org_profile_bp.get("/profile/<int:organization_id>")
def get_organization(organization_id):
    if not organization_id:
        return jsonify({"error": "organization_id is required"}), 400

    profile = get_organization_profile(organization_id)

    if not profile:
        return jsonify({"error": "organization not found"}), 404

    return jsonify({
        "id": profile.id,
        "organization_name": profile.org_name,
        "description": profile.description}), 200


@org_profile_bp.put("/profile/<int:organization_id>")
def update_organization(organization_id):
    data = request.get_json(silent=True) or {}
    data["organization_id"] = organization_id  

    result = update_organization_profile(data)

    if result == DBStatus.SUCCESS.value:
        return jsonify({"message": "Organization updated successfully"}), 200
    elif not result:
        return jsonify({"message": "Organization does not exist"}), 404
    else:
        print(result) # error otherwise
        return jsonify({"message": "Database error"}), 500
