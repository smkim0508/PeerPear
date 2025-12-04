# helper to export LLM pairing result to .txt or .pdf file
from common.types.pairing_event import PairingResult, PairedGroup
from common.types.user import User
from common.types.event_enums import EventRole
from typing import Optional

# helper dict and function to map Enums to priority order in exported format
ROLE_PRIORITY = {
    EventRole.BIG_SIBLING: 0,
    EventRole.LITTLE_SIBLING: 1,
    None: 99 # users with no role get the lowest priority
}

def role_priority(role: Optional[EventRole]) -> int:
    return ROLE_PRIORITY.get(role, 99)

def format_pairing_export(pairing_result: PairingResult, event_title: str, organization_name: str, check_sibling_roles: bool = False) -> str:
    """
    helper to format pairing result for export.
    Returns a string, which can be handled as .txt or .pdf file content with Flask.
    """
    template = f"Pairing Result for {event_title} by {organization_name}:\n"

    for i, group in enumerate(pairing_result.groups):
        template += f"\nGroup {i + 1}:\n"

        # if we care about sibling roles for this event, sort the students by role
        # NOTE: bigs first, littles next, and any unassigned last (shouldn't happen, but to be safe)
        # Also, we sort by alphabetical order within each role
        if check_sibling_roles:
            sorted_students = sorted(group.students, key=lambda student: (role_priority(student.role), student.name))
            for student in sorted_students:
                template += f"  - ({student.role.value if student.role else 'Unassigned'}) {student.name}, {student.email}\n"
        else:
            for student in group.students:
                template += f"  - {student.name}, {student.email}\n"

    return template



