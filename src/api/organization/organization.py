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
from db.models.orgadmin_requests import OrgAdminRequestTable
from db.crud.organization_crud import get_user_organizations, verify_org_access

from db.crud.org_admin_crud import (
    get_request_table,
    create_org_admin_request,
    admin_requests_for_org,
    accept_request,
    reject_request,
    verify_org_owner_access
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


@require_auth
@organization_bp.post("/admin-request")
def create_request():
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
