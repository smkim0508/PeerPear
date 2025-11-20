# canonical DTO for an organization
from pydantic import BaseModel
from typing import Optional
from enum import Enum

class OrganizationProfile(BaseModel):
    """
    Canonical DTO for Organization Profile.
    """
    id: int
    org_name: str
    description: Optional[str] = None

class OrgAdminResponse(BaseModel):
    organizations: list[OrganizationProfile]
    