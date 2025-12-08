# main orchestrator for the pairing logic/process
from typing import List
from common.types.pairing_event import PairingResult, PairedGroup
from modules.pairing.llm_output_types.pairing_outputs import PairingLLMOutput
from modules.pairing.pairing_repository import PairingRepository
from common.types.user import User, UserProfile, UserPairingInformation
from modules.pairing.system_prompts.baseline_pairing_prompts import BaselinePairingPrompts
from modules.pairing.system_prompts.questionnaire_pairing_prompts import QuestionniarePairingPrompts
from modules.pairing.system_prompts.custom_pairing_prompts import CustomRequestPairingPrompts
from modules.pairing.system_prompts.big_little_pairing_prompts import BigLittlePairingPrompts
from modules.pairing.system_prompts.summary_prompts import ResponseSummaryPrompts
from modules.pairing.llm_output_types.pairing_outputs import PairingLLMOutput
from modules.pairing.llm_output_types.summary_outputs import ResponseSummaryLLMOutput
from common.logging import logger
from db.crud.pairing_crud import store_new_pairing
from db.crud.events_crud import check_if_sibling_role_considered
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
        
        # call LLM to get pairing result
        pairing_llm_output: PairingLLMOutput

        # look at the user information; if everyone is missing questionnaire response, then use baseline pairing; otherwise use questionnaire
        if all(student.questionniare_response_summary is None for student in students):
            pairing_llm_output = self.llm_client.create_sync(
                response_model=PairingLLMOutput,
                system_prompt=BaselinePairingPrompts.base_group_pairing_system_prompt,
                user_prompt=BaselinePairingPrompts.get_base_group_pairing_user_prompt(
                    group_size=group_size,
                    students=students,
                    event_description=event_description
                ),
            )
        else:
            pairing_llm_output = self.llm_client.create_sync(
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
    
    def pair_groups_with_sibling_roles(
        self,
        students: list[UserPairingInformation],
        event_description: str,
        group_size: int,
        event_id: int
    ) -> PairingResult:
        """
        Pairs students into groups.
        ** Accounts for sibling roles, using a custom prompt.
        NOTE: ensures no group is solely comprised of the same sibling role.
        """
        # to map paired ids back to students later
        # NOTE: the output map is a lightweight User model excluding the profile summary.
        student_map = {student.id: User(id=student.id, name=student.name, email=student.email, role=student.role) for student in students}

        # NOTE: this guardrail is also handled in API.
        if group_size <= 1:
            logger.warning(f"Group size {group_size} is invalid, please revise to an integer greater than 1.")
            return PairingResult(groups=[])
        
        # call LLM to get pairing result
        pairing_llm_output: PairingLLMOutput

        # NOTE: sole change from main process is in the pairing prompts called below
        # look at the user information; if everyone is missing questionnaire response, then use baseline pairing; otherwise use questionnaire
        if all(student.questionniare_response_summary is None for student in students):
            pairing_llm_output = self.llm_client.create_sync(
                response_model=PairingLLMOutput,
                system_prompt=BigLittlePairingPrompts.big_little_base_group_pairing_system_prompt,
                user_prompt=BigLittlePairingPrompts.get_big_little_base_group_pairing_user_prompt(
                    group_size=group_size,
                    students=students,
                    event_description=event_description
                ),
            )
        else:
            pairing_llm_output = self.llm_client.create_sync(
                response_model=PairingLLMOutput,
                system_prompt=BigLittlePairingPrompts.big_little_questionnaire_group_pairing_system_prompt,
                user_prompt=BigLittlePairingPrompts.get_big_little_questionnaire_group_pairing_user_prompt(
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
    
    
    def pair_groups_with_custom_request(
        self,
        students: list[UserPairingInformation],
        event_description: str,
        custom_request: str,
        group_size: int,
        event_id: int
    ) -> PairingResult:
        """
        Pairs students into groups.
        ** Accounts for any custom requests from user.
        """
        # to map paired ids back to students later
        # NOTE: the output map is a lightweight User model excluding the profile summary.
        student_map = {student.id: User(id=student.id, name=student.name, email=student.email, role=student.role) for student in students}

        # NOTE: this guardrail is also handled in API.
        if group_size <= 1:
            logger.warning(f"Group size {group_size} is invalid, please revise to an integer greater than 1.")
            return PairingResult(groups=[])
        
        # call LLM to get pairing result
        pairing_llm_output: PairingLLMOutput

        # NOTE: sole change from main process is in the pairing prompts called below
        # look at the user information; if everyone is missing questionnaire response, then use baseline pairing; otherwise use questionnaire
        if all(student.questionniare_response_summary is None for student in students):
            pairing_llm_output = self.llm_client.create_sync(
                response_model=PairingLLMOutput,
                system_prompt=CustomRequestPairingPrompts.custom_base_group_pairing_system_prompt,
                user_prompt=CustomRequestPairingPrompts.get_custom_base_group_pairing_user_prompt(
                    group_size=group_size,
                    students=students,
                    event_description=event_description,
                    custom_request=custom_request
                ),
            )
        else:
            pairing_llm_output = self.llm_client.create_sync(
                response_model=PairingLLMOutput,
                system_prompt=CustomRequestPairingPrompts.custom_questionniare_group_pairing_system_prompt,
                user_prompt=CustomRequestPairingPrompts.get_custom_questionnaire_group_pairing_user_prompt(
                    group_size=group_size,
                    students=students,
                    event_description=event_description,
                    custom_request=custom_request
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
        # parse answer and map to question
        questions_map = {question.id: question for question in questions}
        question_answer_pairs = []
        for answer in response:
            if answer.question_id in questions_map:
                question_answer_pairs.append(
                    QuestionAnswerPair(
                        question=questions_map[answer.question_id].question,
                        answer=answer.answer
                    )
                )
            else:
                logger.warning(f"Question ID {answer.question_id} not found in event questions.")

        logger.info(f"Question-Answer Pairs: {question_answer_pairs}")

        # call llm client to summarize responses
        response_summary: ResponseSummaryLLMOutput = self.llm_client.create_sync(
            response_model=ResponseSummaryLLMOutput,
            system_prompt=ResponseSummaryPrompts.response_summary_system_prompt,
            user_prompt=ResponseSummaryPrompts.get_response_summary_user_prompt(question_answer_pairs=question_answer_pairs)
        )

        logger.info(f"Response summary: {response_summary.llm_summary}, reasoning: {response_summary.reasoning}")

        return response_summary.llm_summary



