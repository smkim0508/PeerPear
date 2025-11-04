# main orchestrator for the pairing logic/process
from typing import List
from common.types.pairing import PairingResult, PairedGroup
from modules.pairing.llm_output_types.pairing_outputs import PairingLLMOutput
from modules.pairing.pairing_repository import PairingRepository
from common.types.user import User
from modules.pairing.system_prompts.pairing_prompts import BaselinePairingPrompts
from modules.pairing.llm_output_types.pairing_outputs import PairingLLMOutput

# NOTE: below is just the baseline logic for the pairing process, using end-to-end LLM connection.
# Also, an orchestrator is technically not necessary at this stage, where we do not support continuous, stateful requests.
# A simple endpoint could suffice, but this structure is present for future scaling.
class PairingOrchestrator(PairingRepository):
    def pair_students(self, students: list[User]) -> PairingResult:
        # to map paired ids back to students later
        student_map = {student.id: student for student in students}

        # call LLM to get pairing result
        pairing_llm_output: PairingLLMOutput = self.llm_client.create_sync(
            response_model=PairingLLMOutput,
            system_prompt=BaselinePairingPrompts.base_group_pairing_system_prompt,
            user_prompt=BaselinePairingPrompts.get_base_group_pairing_user_prompt(),
        )

        return PairingResult(groups=[
            PairedGroup(
                students=[
                    student_map[student_id]
                    for student_id in pairing
                ]
            )
            for pairing in pairing_llm_output.groups
        ])

