# helper to export LLM pairing result to .txt or .pdf file
from common.types.pairing_event import PairingResult, PairedGroup
from common.types.user import User

def format_pairing_export(pairing_result: PairingResult, event_title: str, organization_name: str) -> str:
    """
    helper to format pairing result for export.
    Returns a string, which can be handled as .txt or .pdf file content with Flask.
    """
    template = f"""
    Pairing Result for {event_title} by {organization_name}:\n\n
    """

    for i, group in enumerate(pairing_result.groups):
        template += f"Group {i + 1}:"
        for student in group.students:
            template += f"""
            - {student.name} ({student.email})
            """

    return template



