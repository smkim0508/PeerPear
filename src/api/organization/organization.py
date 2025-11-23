# routing to different organizations
from flask import Blueprint, request, jsonify, session, g
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
from common.types.organization import OrganizationProfile, OrgAdminResponse
from flask_jwt_extended import jwt_required, get_jwt_identity
from db.crud.organization_crud import get_user_organizations, verify_org_access

from db.crud.org_admin_crud import (
    get_request_table,
    create_org_admin_request,
    admin_requests_for_org,
    accept_request,
    reject_request
)


# use blueprint to group routes
organization_bp = Blueprint("organization", __name__)


@require_auth
@organization_bp.get("/myorganizations")
def get_all_admins_orgs():
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated or user_id not found in session"}), 401

    try:
        organizations = get_user_organizations(int(user_id))

    except Exception as e:
        logger.error(f"Error retrieving user's organizations: {e}")
        return jsonify(generic_error_response), 500

    org_response = OrgAdminResponse(organizations=organizations)
    return jsonify(org_response.model_dump(mode="json")), 200


@organization_bp.get("/validate-admin/<int:organization_id>")
def validate_org_admin(organization_id):
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated or user_id not found in session"}), 401

    try:
        result = verify_org_access(user_id, organization_id)
    except Exception as e:
        logger.error(
            f"Error verifying that this user can access this org: {e}")
        return jsonify(generic_error_response), 500

    if result.get("error"):
        return jsonify(result), result.get("status", 400)

    return jsonify(result), 200


@require_auth
@organization_bp.get("/available-organizations")
def available_organizations():
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated or user_id not found in session"}), 401
    
    try:
        orgs = get_request_table(int(user_id))
        orgs_data = [org.model_dump(mode="json") for org in orgs]
        return jsonify({"organizations": orgs_data}), 200

    except Exception as e:
        logger.error(f"Error fetching available orgs: {e}")
        return jsonify(generic_error_response), 500
