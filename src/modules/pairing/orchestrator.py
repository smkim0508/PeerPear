# main orchestrator for the pairing logic/process
from typing import List
from common.types.pairing_event import PairingResult, PairedGroup
from modules.pairing.llm_output_types.pairing_outputs import PairingLLMOutput
from modules.pairing.pairing_repository import PairingRepository
from common.types.user import User, UserProfile, UserPairingInformation
from modules.pairing.system_prompts.pairing_prompts import BaselinePairingPrompts, QuestionniarePairingPrompts, CustomPairingPrompts
from modules.pairing.system_prompts.summary_prompts import ResponseSummaryPrompts
from modules.pairing.llm_output_types.pairing_outputs import PairingLLMOutput
from modules.pairing.llm_output_types.summary_outputs import ResponseSummaryLLMOutput
from common.logging import logger
from db.crud.pairing_crud import store_new_pairing
from common.types.questionnaire import Answer, Question, QuestionAnswerPair
from app_types.api.response.event_browse_response import PublishedEvent
from typing import Optional

# NOTE: below is just the baseline logic for the pairing process, using end-to-end LLM connection.
# Also, an orchestrator is technically not necessary at this stage, where we do not support continuous, stateful requests.
# A simple endpoint could suffice, but this structure is present for future scaling.
class PairingOrchestrator(PairingRepository):
    def pair_students_in_groups(
        self,
        students: list[UserPairingInformation],
        event_description: str,
        group_size: int,
        event_id: int
    ) -> PairingResult:
        """
        Main process for pairing students into groups.
        """
        # to map paired ids back to students later
        # NOTE: the output map is a lightweight User model excluding the profile summary.
        student_map = {student.id: User(id=student.id, name=student.name, email=student.email, role=student.role) for student in students}

        # NOTE: this guardrail is also handled in API.
        if group_size <= 1:
            logger.warning(f"Group size {group_size} is invalid, please revise to an integer greater than 1.")
            return PairingResult(groups=[])
        
        # TODO: make the prompt take in event descrption
        # then, make a new endpoint for pairing with questionnaire responses
        # NOTE: for now, we can make questionnaire responses as the default, unless questionnaire doesn't exist then we do baseline pairing

        # call LLM to get pairing result
        pairing_llm_output: PairingLLMOutput = self.llm_client.create_sync(
            response_model=PairingLLMOutput,
            system_prompt=QuestionniarePairingPrompts.questionniare_group_pairing_system_prompt,
            user_prompt=QuestionniarePairingPrompts.get_questionnaire_group_pairing_user_prompt(
                group_size=group_size,
                students=students,
                event_description=event_description
            ),
        )

        logger.info(f"Pairing results: {pairing_llm_output.groups}, reasoning: {pairing_llm_output.reasoning}")

        pairing_result= PairingResult(
            groups=[
                PairedGroup(
                    students=[
                        student_map[student_id]
                        for student_id in group
                    ]
                )
                for group in pairing_llm_output.groups
            ],
            llm_reasoning=pairing_llm_output.reasoning
        )

        # put the newly created pairing in DB for future retrieval
        store_new_pairing(pairing_result, event_id)
        
        return pairing_result
    
    def summarize_questionnaire_response(self, response: list[Answer], questions: list[Question]) -> str:
        """
        Whenever a user submits a questionnaire response or updates it, we use LLM to parse the response into a lightweight, semantically-rich summary.
        This helper returns a summary of the response.
        """

        # parse answer and map to question
        questions_map = {question.id: question for question in questions}
        question_answer_pairs = [
            QuestionAnswerPair(
                question=questions_map[answer.question_id].question,
                answer=answer.answer
            )
            for answer in response
        ]

        logger.info(f"Question-Answer Pairs: {question_answer_pairs}")

        # call llm client to summarize responses
        response_summary: ResponseSummaryLLMOutput = self.llm_client.create_sync(
            response_model=ResponseSummaryLLMOutput,
            system_prompt=ResponseSummaryPrompts.response_summary_system_prompt,
            user_prompt=ResponseSummaryPrompts.get_response_summary_user_prompt(question_answer_pairs=question_answer_pairs)
        )

        logger.info(f"Response summary: {response_summary.llm_summary}, reasoning: {response_summary.reasoning}")

        return response_summary.llm_summary



