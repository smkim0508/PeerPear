# event data for an organziation
from flask import Blueprint, request, send_from_directory, jsonify, g
from datetime import datetime, timezone, timedelta
from api import validate_model
from app_types.api.response.event_browse_response import EventBrowseResponse, PublishedEvent
from db.models.events import Event
from sqlalchemy import inspect
from api.dependencies import get_db_session
from db.crud.events_crud import get_event_by_id
from db.crud.questionnaire_crud import get_questions


# use blueprint to group routes
event_data_bp = Blueprint("event_data", __name__)

@event_data_bp.get("/<int:event_id>/questions")
def get_event_questions(event_id):
    """Fetch event info and all questions associated with it."""
    try:
    
        event = get_event_by_id(event_id)
        if not event:
            return jsonify({"error": "Event not found"}), 404

     
        questions = get_questions(event_id)

    
        question_list = [
            {
                "id": q.id,
                "question": q.question,
                "options": q.options or [],
                "event_id": q.event_id,
            }
            for q in questions
        ]


        return jsonify({
            "event": {
                "id": event.id,
                "title": getattr(event, "title", "Untitled Event"),
                "description": getattr(event, "description", ""),
                "organization_name": getattr(event, "organization_name", "Unknown Organization"),
                "image_url": getattr(event, "image_url", None),
                "start_date": getattr(event, "start_date", None),
                "end_date": getattr(event, "end_date", None),
            },
            "questions": question_list
        }), 200

    except Exception as e:
        print(f"Error fetching event and questions: {e}")
        return jsonify({"error": "Internal server error"}), 500
