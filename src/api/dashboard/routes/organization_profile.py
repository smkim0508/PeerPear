# organization profile page
from flask import Blueprint, request, send_from_directory, jsonify, session
from db.crud.org_profile_crud import get_organization_profile, update_organization_profile
from common.types.db_status import DBStatus
from common.types.organization import OrganizationProfile
from common.logging import logger
from common.error_response import generic_error_response
from auth.routes.auth import require_auth
from db.models.orgadmin import OrgAdminTable
from api.dependencies import get_db_sessionmaker
from sqlalchemy import select

# use blueprint to group routes
org_profile_bp = Blueprint("organization_profile", __name__)


@org_profile_bp.get("/profile")
@require_auth
def get_organization():
    # Get user_id from session and look up organization
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401

    # Look up organization_id from orgadmins table
    db_session = get_db_sessionmaker()
    with db_session() as db_session_instance:
        org_admin = db_session_instance.scalar(
            select(OrgAdminTable).where(OrgAdminTable.user_id == user_id)
        )

        if org_admin is None:
            return jsonify({"error": "User is not an organization admin"}), 403

        organization_id = org_admin.organization_id

    profile: OrganizationProfile | None = get_organization_profile(
        organization_id)

    if not profile:
        return jsonify({"error": "organization not found"}), 404

    return jsonify({
        "id": profile.id,
        "organization_name": profile.org_name,
        "description": profile.description}), 200


@org_profile_bp.put("/profile")
@require_auth
def update_organization():
    # Get user_id from session and look up organization
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"error": "User not authenticated"}), 401

    # Look up organization_id from orgadmins table
    db_session = get_db_sessionmaker()
    with db_session() as db_session_instance:
        org_admin = db_session_instance.scalar(
            select(OrgAdminTable).where(OrgAdminTable.user_id == user_id)
        )

        if org_admin is None:
            return jsonify({"error": "User is not an organization admin"}), 403

        organization_id = org_admin.organization_id

    org_profile_payload = request.get_json(silent=True)

    if not org_profile_payload:
        return jsonify({"error": "invalid form responses"}), 400

    org_name = org_profile_payload.get("org_name")
    description = org_profile_payload.get("description")

    # create DTO from payload
    org_profile = OrganizationProfile(
        id=organization_id,
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
