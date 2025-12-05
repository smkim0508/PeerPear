# helper to export LLM pairing result to .txt or .pdf file
from common.types.pairing_event import PairingResult, PairedGroup
from common.types.user import User
from common.types.event_enums import EventRole
from typing import Optional
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted
from reportlab.lib.enums import TA_LEFT

# helper dict and function to map Enums to priority order in exported format
ROLE_PRIORITY = {
    EventRole.BIG_SIBLING: 0,
    EventRole.LITTLE_SIBLING: 1,
    None: 99 # users with no role get the lowest priority
}

def role_priority(role: Optional[EventRole]) -> int:
    return ROLE_PRIORITY.get(role, 99)

def format_pairings_for_export(pairing_result: PairingResult, event_title: str, organization_name: str, check_sibling_roles: bool = False) -> str:
    """
    helper to format pairing result for export.
    Returns a string, which can be handled as .txt or .pdf file content with Flask.
    If sibling roles are considered, we sort the students by role and alphabetical order within each role.
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

def generate_pairing_pdf(pairing_result: PairingResult, event_title: str, organization_name: str, check_sibling_roles: bool = False) -> bytes:
    """
    Generates a PDF file from pairing results and returns the PDF as bytes.
    """
    # Create a BytesIO buffer to hold the PDF
    buffer = BytesIO()

    # Create the PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )

    # Container for the 'Flowable' objects
    elements = []

    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=HexColor('#333333'),
        spaceAfter=12,
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=HexColor('#666666'),
        spaceAfter=20,
        alignment=TA_LEFT
    )

    group_header_style = ParagraphStyle(
        'GroupHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=HexColor('#000000'),
        spaceAfter=8,
        spaceBefore=12,
        alignment=TA_LEFT
    )

    member_style = ParagraphStyle(
        'Member',
        parent=styles['Normal'],
        fontSize=11,
        textColor=HexColor('#333333'),
        leftIndent=20,
        spaceAfter=4,
        alignment=TA_LEFT
    )

    # Add title
    title = Paragraph(f"Pairing Results for {event_title}", title_style)
    elements.append(title)

    # Add organization name
    subtitle = Paragraph(f"Organized by: {organization_name}", subtitle_style)
    elements.append(subtitle)

    elements.append(Spacer(1, 0.2*inch))

    # Add each group
    for i, group in enumerate(pairing_result.groups):
        # Group header
        group_header = Paragraph(f"Group {i + 1}", group_header_style)
        elements.append(group_header)

        # Sort students if sibling roles are considered
        if check_sibling_roles:
            sorted_students = sorted(
                group.students,
                key=lambda student: (role_priority(student.role), student.name)
            )
            for student in sorted_students:
                role_text = f"({student.role.value if student.role else 'Unassigned'}) "
                member_text = f"{role_text}{student.name} - {student.email}"
                member_para = Paragraph(member_text, member_style)
                elements.append(member_para)
        else:
            for student in group.students:
                member_text = f"{student.name} - {student.email}"
                member_para = Paragraph(member_text, member_style)
                elements.append(member_para)

        # Add spacing between groups
        elements.append(Spacer(1, 0.15*inch))

    # Build PDF
    doc.build(elements)

    # Get the PDF bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
