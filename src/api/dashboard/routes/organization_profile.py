# organization profile page
from flask import Blueprint, request, send_from_directory, jsonify, g
import os
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import EventTable
from db.crud.org_profile_crud import get_organization_profile, update_organization_profile
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from db.models.organizations import OrganizationTable
from common.types.db_status import DBStatus
from common.types.organization import OrganizationProfile
from common.logging import logger
from common.error_response import generic_error_response

# use blueprint to group routes
org_profile_bp = Blueprint("organization_profile", __name__)

@org_profile_bp.get("/profile/<int:organization_id>")
def get_organization(organization_id):
    if not organization_id:
        return jsonify({"error": "organization_id is required"}), 400

    profile: OrganizationProfile | None = get_organization_profile(organization_id)

    if not profile:
        return jsonify({"error": "organization not found"}), 404

    return jsonify({
        "id": profile.id,
        "organization_name": profile.org_name,
        "description": profile.description}), 200

@org_profile_bp.put("/profile/<int:organization_id>")
def update_organization(organization_id):

    org_profile_payload = request.get_json(silent=True)

    if not org_profile_payload:
        return jsonify({"error": "invalid form responses"}), 400
    
    org_id = organization_id or org_profile_payload.get("id")
    org_name = org_profile_payload.get("org_name")
    description = org_profile_payload.get("description")

    if not org_id:
        return jsonify({"error": "organization_id is required"}), 400

    # create DTO from payload
    org_profile = OrganizationProfile(
        id=org_id,
        org_name=org_name,
        description=description
    )

    logger.info(f"org profile data: {org_profile}")

    # NOTE: this returns a success/fail status, not the updated profile
    result = update_organization_profile(org_profile)

    if result == DBStatus.SUCCESS.value:
        return jsonify({"message": "Organization updated successfully"}), 200
    elif not result:
        return jsonify({"message": "Organization does not exist"}), 404
    else:
        # internal error otherwise
        logger.error(f"Unknown error: {result}")
        return jsonify(generic_error_response), 500
