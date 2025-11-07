from flask import Blueprint, request, send_from_directory, jsonify, g
import os
from api import validate_model
from db.models.events import Event
from db.models.response import Response
from db.models.question import Question
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from db.crud.questionnaire_crud import get_questions, get_user_answers

questionnaire_bp = Blueprint("questionnaire", __name__)


@questionnaire_bp.get("/<int:event_id>/<int:user_id>")
def get_questionnaire(event_id, user_id):
    if not event_id:
        return jsonify({"error": "event_id is required"}), 400
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
        
    result = get_questions(event_id)
    
    if len(result) == 0:
                return jsonify({"error": "there are no questions associated with this event"}), 404
            
    ids = []
    questions = []
    for q in result:
        ids.append(q.id)
        questions.append (
            {
              "id": q.id,
              "question": q.question,
              "options": q.options,
              "event_id": q.event_id
              
            }
        )
    
    answers = get_user_answers(ids,user_id)
    return jsonify({"questions":questions,"answers": answers }), 200
        

        
    
@questionnaire_bp.put("/submit")
def submit_questionnaire()