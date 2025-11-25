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
from common.types.organization import OrganizationProfile, OrgAdminResponse, AdminListResponse
from db.models.orgadmin_requests import OrgAdminRequestTable
from db.crud.organization_crud import get_user_organizations, verify_org_access
from db.crud.org_admin_crud import (
    get_request_table,
    create_org_admin_request,
    admin_requests_for_org,
    accept_request,
    reject_request,
    verify_org_owner_access,
    get_admins_for_org,
    promote_admin_to_owner,
    remove_admin_from_org,
    leave_organization
)

# use blueprint to group routes
organization_bp = Blueprint("organization", __name__)

@require_auth
@organization_bp.get("/myorganizations")
def get_all_admins_orgs():
    """Gets this users current organizations that they are admins for"""
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
    """Ensures that this user can view this organization"""
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
    """Gets the organizations that the user is able to request to join"""
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


@require_auth
@organization_bp.post("/admin-request")
def create_request():
    """Creates a request to join an organization"""
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated or user_id not found in session"}), 401

    data = request.get_json() or {}
    organization_id = data.get("organization_id")

    if not organization_id:
        return jsonify({"error": "organization_id is required"}), 400

    try:
        req, error = create_org_admin_request(
            int(user_id), int(organization_id))

        if error:
            return jsonify(error), 400

        else:
            return jsonify({
                "id": req.id,
                "user_id": req.user_id,
                "organization_id": req.organization_id
            }), 201
    except Exception as e:
        logger.error(f"Error creating org admin request: {e}")
        return jsonify(generic_error_response), 500


@require_auth
@organization_bp.get("/admin-requests/<int:organization_id>")
def get_admin_requests(organization_id):
    """Fetches all the requests to join a current organization"""
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        auth = verify_org_owner_access(int(user_id), organization_id)
        if auth.get("error"):
            return jsonify(auth), auth.get("status", 403)
        requests = admin_requests_for_org(organization_id)

        resp = [{
            "id": r.id,
            "user_id": r.user_id,
            "organization_id": r.organization_id
        } for r in requests]

        return jsonify({"requests": resp}), 200

    except Exception as e:
        logger.error(f"Error fetching org admin requests: {e}")
        return jsonify(generic_error_response), 500


@require_auth
@organization_bp.post("/admin-requests/approve")
def approve_request_route():
    """Approves a request to become an org admin"""
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json() or {}

    request_id = data.get("request_id")

    if not request_id:
        return jsonify({"error": "Request id is required"}), 400

    try:
        db = get_db_sessionmaker()
        with db() as session_instance:
            req = session_instance.get(OrgAdminRequestTable, request_id)
            if not req:
                return jsonify({"error": "Request not found"}), 404
            organization_id = req.organization_id
        auth = verify_org_owner_access(int(user_id), organization_id)
        if auth.get("error"):
            return jsonify(auth), auth.get("status", 403)

        result = accept_request(request_id)
        if "error" in result:
            status = result.get("status")
            return jsonify(result), (status or 400)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error accepting org admin requests: {e}")
        return jsonify(generic_error_response), 500


@require_auth
@organization_bp.post("/admin-requests/deny")
def deny_request_route():
    """Denies a request to be an orgadmin"""
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json() or {}

    request_id = data.get("request_id")

    if not request_id:
        return jsonify({"error": "Request id is required"}), 400

    try:
        db = get_db_sessionmaker()
        with db() as session_instance:
            req = session_instance.get(OrgAdminRequestTable, request_id)
            if not req:
                return jsonify({"error": "Request not found"}), 404
            organization_id = req.organization_id
        auth = verify_org_owner_access(int(user_id), organization_id)
        if auth.get("error"):
            return jsonify(auth), auth.get("status", 403)

        result = reject_request(request_id)
        if "error" in result:
            status = result.get("status")
            return jsonify(result), (status or 400)
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error denying org admin requests: {e}")
        return jsonify(generic_error_response), 500


@require_auth
@organization_bp.post("/admin-requests/bulk-create")
def create_requests_bulk():
    """Bulk creates request (multiselect to join orgadmin)"""
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json() or {}
    org_ids = data.get("organization_ids")

    if not org_ids or not isinstance(org_ids, list):
        return jsonify({"error": "organization_ids must be a non-empty list"}), 400

    created = []
    skipped = []

    try:
        for oid in org_ids:
            req, err = create_org_admin_request(int(user_id), int(oid))

            if err:
                skipped.append({
                    "organization_id": oid,
                    "reason": err.get("error")
                })
            else:
                created.append({
                    "organization_id": oid,
                    "request_id": req.id
                })

        return jsonify({
            "created": created,
            "skipped": skipped
        }), 200

    except Exception as e:
        logger.error(f"Error creating bulk admin requests: {e}")
        return jsonify(generic_error_response), 500


@require_auth
@organization_bp.get("/org-admins/<int:organization_id>")
def get_org_admins(organization_id):
    """Retrieves all the admins of an organization"""
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        auth = verify_org_owner_access(int(user_id), organization_id)
        if auth.get("error"):
            return jsonify(auth), auth.get("status", 403)

        admins = get_admins_for_org(organization_id)

        response = AdminListResponse(admins=admins)
        return jsonify(response.model_dump(mode="json")), 200

    except Exception as e:
        logger.error(f"Error retrieving org admins: {e}")
        return jsonify(generic_error_response), 500


@require_auth
@organization_bp.post("/org-admins/promote")
def promote_admin_route():
    """Promotes an admin to an owner"""
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json() or {}
    target_user_id = data.get("user_id")
    organization_id = data.get("organization_id")

    if not target_user_id or not organization_id:
        return jsonify({"error": "user_id and organization_id are required"}), 400

    try:

        auth = verify_org_owner_access(int(user_id), int(organization_id))
        if auth.get("error"):
            return jsonify(auth), auth.get("status", 403)

        result = promote_admin_to_owner(
            int(target_user_id), int(organization_id))

        if "error" in result:
            return jsonify({"error": result["error"]}), result.get("status", 400)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error promoting org admin: {e}")
        return jsonify(generic_error_response), 500


@require_auth
@organization_bp.post("/org-admins/remove")
def remove_admin_route():
    """Removes an admin from an organization"""
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json() or {}
    target_user_id = data.get("user_id")
    organization_id = data.get("organization_id")

    if not target_user_id or not organization_id:
        return jsonify({"error": "user_id and organization_id are required"}), 400

    try:

        auth = verify_org_owner_access(int(user_id), int(organization_id))
        if auth.get("error"):
            return jsonify(auth), auth.get("status", 403)

        result = remove_admin_from_org(
            int(target_user_id), int(organization_id))

        if "error" in result:
            return jsonify({"error": result["error"]}), result.get("status", 400)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error removing org admin: {e}")
        return jsonify(generic_error_response), 500


@require_auth
@organization_bp.post("/org-admins/leave")
def leave_org_route():
    user_id = session.get("user_id")
    if user_id is None:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json() or {}
    organization_id = data.get("organization_id")

    if not organization_id:
        return jsonify({"error": "organization_id is required"}), 400

    try:
        result = leave_organization(int(user_id), int(organization_id))

        if "error" in result:
            return jsonify({"error": result["error"]}), result.get("status", 400)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error leaving organization: {e}")
        return jsonify(generic_error_response), 500
