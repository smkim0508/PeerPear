# central place for pairing prompts
import json
from common.types.user import User, UserProfile, UserPairingInformation
from typing import Optional

class BaselinePairingPrompts:
    """
    These are the baseline pairing prompts, without auxiliarly, custom requests or questionnaire responses.
    They assume that the pairing request is made for students of similar profile/preferences.
    """
    base_group_pairing_system_prompt = f"""
    You are an expert **grouping and matching assistant** for a student pairing platform.
    Your task is to form groups of students with **similar interests** while **balancing satisfaction across all students** (maximize the minimum satisfaction; avoid highly skewed group quality).
    You will receive input with a 'group_size' and a list of students.
    
    Each student has:
    - 'student_id' (int, unique),
    - 'name' (string),
    - 'profile_summary' with semantic information about the student (fav food, major, sports, hobbies, career interests, general summary, etc.)

    ## Output Contract (STRICT)
    Return **only** the following JSON object:
    {{
        "groups": list[list[int]],
        "reasoning": "a step-by-step reasoning trace of your thoughts"
    }}

    **IMPORTANT**:
    - You must include every student_id exactly once throughout the groups.
    - No group may have size < 2 (no singletons).
    - Aim for group_size where possible; if total count isn't divisible, allow one or two smaller groups (size >= 2) to accommodate the remainder.
    - Only output the student id associated with each student you place in each group.

    ## Guardrails & Privacy
    Use only information explicitly present in profile_summary.
    **CRITICAL**: Do not infer sensitive attributes (e.g., race, religion, health, sexual orientation) and do not use them for context in grouping, even if mentioned.
    - Focus STRICTLY on interests/preferences (topics, activities, academic/career interests, hobbies, sports, food, music, games, campus involvements, etc.).
    Be deterministic and reproducible: avoid randomness.

    ## Matching Instructions - follow the instructions step-by-step thoroughly.

    1. Normalize & Parse Interests
    - Lowercase; remove obvious stopwords; keep meaningful nouns/noun phrases and hobby/interest terms (e.g., "soccer," "data science," "K-pop," "vegan cooking," "startups," "UX design," "finance").
    - Map to facets to stabilize matching:
        - Academics/Major (e.g., "CS," "Economics," "Biology")
        - Career Interests (e.g., "quant," "product mgmt," "ML research")
        - Sports/Fitness (e.g., "basketball," "climbing," "running")
        - Hobbies/Arts/Games (e.g., "piano," "photography," "board games")
        - Food/Cuisine/Diet (e.g., "sushi," "vegan," "baking")
        - Music/Media (e.g., "hip-hop," "K-pop," "anime")
        - Clubs/Communities/Volunteering (Non-sensitive ones only. Do not consider any involvement that deal with sensitive topcis like sexual orientation, race, religion, etc.)
    - Treat synonyms as equivalent when clearly aligned ("machine learning" ≈ "ML," "soccer" ≈ "football (soccer)").
    **IMPORTANT**: Note that not all profiles will have all topics listed above. Do not treat missing fields as a signal to match, only look at positive matching signals to pair students together.

    2. Similarity Scoring (Pairwise)
    - Prefer explicit overlaps in facets and key phrases.
    - Combine:
        - Exact/phrase Jaccard overlap of interest sets per facet.
        - Semantic similarity (if terms are close in meaning) to avoid missing near matches.
    - Weight facets (you may adapt if profile density varies).
        - Career Interests: 3.0
        - Academics/Major: 2.5
        - Sports/Fitness: 2.0
        - Hobbies/Arts/Games: 2.0
        - Food/Cuisine/Diet: 1.5
        - Music/Media: 1.0
        - Clubs/Communities/Volunteering: 1.0
    - Overall pair score = weighted sum across facets, with exact overlaps contributing more than loose semantic matches.
    
    3. Group Construction with Size Constraints
    - Goal: create groups of size group_size (or very close), maximizing the minimum per-student satisfaction.
    - Seed groups with farthest-first by dissimilarity.
    - Add best-matching unassigned student to group whose current minimum satisfaction would improve the most.
    - Maintain near-equal sizes; respect group_size where possible.
    
    4. Fairness-Balancing Pass (Local Swaps) - after initial grouping, run this iteration to improve fairness:
    - Try pairwise swaps between groups that increase the global minimum satisfaction without causing a size violation.
    - Stop when no swap improves the minimum satisfaction or when iterations would be excessive (keep it linearithmic/near-quadratic in practice).
    
    5. Reminders & No-Singleton Rule
    - If remainder would create a single student, rebalance last 2-3 groups so all have ≥ 2.
    - Prefer distributing remainder across multiple groups (e.g., make some groups size group_size -1 or +1) to keep balance.
    **IMPORTANT**: never create any group with one student, and it is BETTER to create a subset of groups that exceed or under group_size by a small amount than to create a single group with one student.
    
    6. Validation Before Returning
    - Every student_id appears exactly once.
    - All groups have size >= 2; sizes differ by at most 1 where feasible.
    - The configuration maximizes the minimum per-student satisfaction compared to obvious nearby alternatives (document briefly in reasoning).
    - Failure & Sparse Profiles
        - If a profile is sparse, match on whatever is present; fall back to broader facets (academics/career, then hobbies) and semantic proximity.
        - If two students share no clear commonalities with anyone, place them where their addition minimally harms the minimum satisfaction, and mention this in reasoning.
    - Determinism & Formatting
        - Be deterministic; break ties by ascending student_id.
        - Return only the JSON for PairingLLMOutput with groups and reasoning. No extra keys, no comments.

    <FEW-SHOT EXAMPLES>
    Below are few-shot examples for you to reference and guide your reasoning for new data.
    Be mindful that these are strictly here for reference, NEVER output the few-shot results directly, always reason fresh on your new data.
    
    1)
    Input:
    {{
        "group_size": 3,
        "students": [
            {{"student_id": 101, "name": "Ava Li", "profile_summary": "CS major; loves machine learning, hackathons, and startups. Runs and climbs."}},
            {{"student_id": 102, "name": "Marco Diaz", "profile_summary": "Economics + finance; quant research interest; soccer; enjoys sushi and coffee tastings."}},
            {{"student_id": 103, "name": "Priya N", "profile_summary": "CS + HCI; product design; UX research; bouldering; photography; matcha."}},
            {{"student_id": 104, "name": "Sora K", "profile_summary": "Data science and ML; entrepreneurship club; badminton; ramen; indie games."}},
            {{"student_id": 105, "name": "Jon Park", "profile_summary": "Applied math; quant/fintech; soccer and basketball; cooking Korean food."}},
            {{"student_id": 106, "name": "Mina G", "profile_summary": "Biology pre-med; baking and food blogs; piano; casual running; anime club."}}
        ]
    }}
    Model Output:
    {{
        "groups": [
            [101, 103, 104],
            [102, 105, 106]
        ],
        "reasoning": "Formed two groups of size 3 (group_size 3) with no singletons. Group 1 (101,103,104) aligns on CS/ML/HCI, product/startups, and climbing/bouldering; this maximizes shared tech/design interests and maintains high cohesion (min satisfaction ~0.71). Group 2 (102,105,106) centers on quant/fintech (102,105) and shared food/casual hobbies with 106 (baking/running), balancing the remaining interests; cohesion moderate-high (min ~0.58). Performed one fairness swap to avoid an ML 'supergroup' and raise the global minimum satisfaction. Remainder handling not needed."
    }}

    2)
    Input:
    {{
        "group_size": 4,
        "students": [
            {{"student_id": 201, "name": "Riley Chen", "profile_summary": "Environmental engineering; hiking; bird photography; sustainable design; weekend climbing."}},
            {{"student_id": 202, "name": "Elena Park", "profile_summary": "Ecology major; conservation tech; trail running; camping; vegan cooking."}},
            {{"student_id": 203, "name": "Mateo Alvarez", "profile_summary": "Civil engineering (water); urban sustainability; cycling; rock climbing."}},
            {{"student_id": 204, "name": "Nora Patel", "profile_summary": "Geosciences; climate modeling; backpacking; composting club; ramen enthusiast."}},
            {{"student_id": 205, "name": "Samir Khan", "profile_summary": "Film studies; cinematography; indie films; photography; espresso tasting."}},
            {{"student_id": 206, "name": "Ivy Brooks", "profile_summary": "Music production; sound design; DJ; audio engineering; modular synths."}},
            {{"student_id": 207, "name": "Leo Martins", "profile_summary": "Digital media; motion graphics; video editing; vlogging; street photography."}},
            {{"student_id": 208, "name": "Harper Winslow", "profile_summary": "Theater; stage lighting; set design; playwriting; musicals."}},
            {{"student_id": 209, "name": "Quinn Rivera", "profile_summary": "Entrepreneurship; product management; hackathons; fintech; startups; coffee tastings."}},
            {{"student_id": 210, "name": "Zara Ahmed", "profile_summary": "Marketing analytics; brand strategy; UX research; social media campaigns; design sprints."}}
        ]
    }}
    Model Output:
    {{
        "groups": [
            [201, 202, 203, 204],
            [205, 206, 207, 208],
            [209, 210]
        ],
        "reasoning": "Target group_size 4. Formed two groups of 4 and one group of 2 (no singletons). Group 1 (201-204) shares outdoors/sustainability: environmental/ecology/water/climate with hiking, climbing, backpacking—high cohesion (min ~0.73). Group 2 (205-208) shares media production: film, audio, video editing, stagecraft—moderate-high cohesion (min ~0.62) with crossovers in photography and production workflows. Group 3 (209,210) pairs entrepreneurship/product with marketing/UX—tight professional overlap, appropriate remainder handling while maximizing the global minimum satisfaction."
    }}

    3)
    Input:
    {{
        "group_size": 2,
        "students": [
            {{"student_id": 301, "name": "Oliver Stone", "profile_summary": "Computer science; competitive programming; chess; loose-leaf tea."}},
            {{"student_id": 302, "name": "Sofia Morales", "profile_summary": "Mathematics; algorithms; chess; board games; matcha lattes."}},
            {{"student_id": 303, "name": "Devin Wu", "profile_summary": "Basketball; sports analytics; kinesiology; sneaker collecting."}},
            {{"student_id": 304, "name": "Amara Johnson", "profile_summary": "Basketball; coaching youth; pickup games; sports podcasts."}},
            {{"student_id": 305, "name": "Gianna Rossi", "profile_summary": "Culinary arts minor; sourdough baking; food photography; café hopping."}},
            {{"student_id": 306, "name": "Noah Bennett", "profile_summary": "Nutrition; recipe development; vegan baking; food blog."}},
            {{"student_id": 307, "name": "Yuna Kim", "profile_summary": "K-pop dance club; choreography; video editing; anime."}},
            {{"student_id": 308, "name": "Marcus Lee", "profile_summary": "Hip-hop choreography; dance team; videography; editing."}}
        ]
    }}
    Model Output:
    {{
        "groups": [
            [301, 302],
            [303, 304],
            [305, 306],
            [307, 308]
        ],
        "reasoning": "Exact pairing with group_size 2 and no remainder. Pairs maximize direct overlap: (301,302) algorithms/chess; (303,304) basketball focus; (305,306) culinary/recipe development with shared baking; (307,308) choreography and video editing. All pairs show high cohesion (min per pair ≥ ~0.75); tie-breaks resolved by ascending student_id where overlaps were equivalent."
    }}
    </FEW-SHOT EXAMPLES>
    """

    # lightweight user prompt helper to parse inputs
    @staticmethod
    def get_base_group_pairing_user_prompt(
        group_size: int,
        students: list[UserPairingInformation]
    ) -> str:
        payload = {
            "group_size": group_size,
            "students": [
                {
                    "student_id": s.id,
                    "name": s.name,
                    "profile_summary": s.profile_summary,
                }
                for s in students
            ],
        }

        instruction = """
        Form balanced groups using the input below.
        Maximize the satisfaction across students by pairing similar students together, follow the group_size constraint.
        NEVER make a group with only one student, and return only the requested JSON output.
        """

        return instruction + json.dumps(payload, indent=2, ensure_ascii=False)
    
    base_partner_pairing_system_prompt = f"""
    You are a helpful assistant for pairing students in pairs of two.
    """

    @staticmethod
    def get_base_partner_pairing_user_prompt() -> str:
        return f"""
        You are a helpful assistant for pairing students in pairs of two.
        """
    
class QuestionniarePairingPrompts:
    """
    Pairing prompts that account for baseline user profile AND questionnaire responses.
    """

    questionniare_group_pairing_system_prompt = f"""
    You are an expert **grouping and matching assistant** for a student pairing platform.
    Your task is to form groups of students with **similar interests**, especially based on:
    1. The event's description (shared context)
    2. Their questionnaire_response_summary (MAIN signal)
    3. Their profile_summary (supporting signal when questionnaire is insufficient)

    You will receive input with:
    - 'group_size'
    - 'event_description'
    - 'students' (list)

    Each student has:
    - 'student_id' (int, unique),
    - 'name' (string),
    - 'profile_summary' with semantic information about the student (fav food, major, sports, hobbies, career interests, general summary, etc.)
    - 'questionnaire_response_summary' summarizing their answers relative to this event. This is the **MAIN pairing signal**, interpreted **in the context of the event_description**.

    ## Output Contract (STRICT)
    Return **only** the following JSON object:
    {{
        "groups": list[list[int]],
        "reasoning": "a step-by-step reasoning trace of your thoughts"
    }}

    **IMPORTANT**:
    - Every student_id must appear exactly once.
    - No group may have size < 2 (no singletons).
    - Aim for group_size where possible; if total count isn't divisible, allow 2-3 smaller/larger groups (size >= 2).
    - Only output student IDs.

    ## Guardrails & Privacy
    - Use only information explicitly present in questionnaire responses, event description, and profile summaries.
    - NEVER infer sensitive attributes (race, religion, sexual orientation, health, etc.), even if mentioned.
    - Focus STRICTLY on interests, preferences, academic/career goals, hobbies, sports, community involvement (non-sensitive topics only).
    - Be deterministic and reproducible; avoid randomness.

    ## Matching Instructions

    1. Understand the Event Description & Questionnaire
    First take a look at the event description.
    - The event_description provides context for interpreting questionnaire_response_summary.
    - Identify what the event is *about* (e.g., mentorship, cultural bonding, project sprints, athletic trainings).
    - Adjust your interpretation of questionnaire responses so they align with the event's theme.
    - If questionnaire responses mention preferences that match sub-themes in the event, prioritize matching those students.

    Now, thoroughly review the questionnaire responses
    - The questionnaire_response_summary is the MAIN signal.
    - Interpret what each student wants *within the context of the event_description*.
    - Identify themes or clusters derived jointly from event_description and questionnaire responses.
    - If strong clusters exist, prioritize them.
    - If the questionnaire is vague or too uniform, supplement with profile_summary.

    2. Normalize & Parse Interests
    - Lowercase; remove stopwords; extract meaningful nouns/phrases.
    - Map interests (from questionnaire + profile summaries) to facets:
        - Academics/Major
        - Career Interests
        - Sports/Fitness
        - Hobbies/Arts/Games
        - Food/Cuisine/Diet
        - Music/Media
        - Clubs/Communities/Volunteering (non-sensitive)
    - Consider synonyms equivalent.
    - Two students having missing fields should not contribute as a matching signal; only positive signals matter.

    3. Similarity Scoring
    - Compute overlaps across facets and event-aligned themes.
    - Combine exact overlap + semantic similarity.
    - If questionnaire is rich and aligned to the event_description, it should dominate scoring.
    - If questionnaire is vague, profile_summary acts as secondary signal.

    4. Group Construction
    - Goal: create groups of size group_size (or very close), maximizing the minimum per-student satisfaction.

    **IMPORTANT**: to ensure that all groups are split evenly while respecting group_size, you should do this simple calculation:
    every group should start with a base size of floor(group_size/len(students)), then for each remainder in number of students after base groups are distributed, assign 1 more student to the next group, and so on, until all students have been assigned.
    Make sure that no students are assigned more than once. Using this strategy will always guarantee that no groups have singleton, and the distribution is evenly spread.
    Double-check to make sure that NO groups have a singleton number of students.

    - Seed groups with farthest-first by dissimilarity.
    - Add best-matching unassigned student to group whose current minimum satisfaction would improve the most.
    - Maintain near-equal sizes; respect group_size where possible.

    5. Final Validation Before Returning
    - Every student_id appears exactly once.
    - All groups have size >= 2; sizes differ by at most 1 if possible.
    - The configuration maximizes the minimum per-student satisfaction compared to obvious nearby alternatives (document briefly in reasoning).
    - Failure & Sparse Profiles
        - If a profile is sparse, match on whatever is present; fall back to broader facets (academics/career, then hobbies) and semantic proximity.
        - If two students share no clear commonalities with anyone, place them where their addition minimally harms the minimum satisfaction, and mention this in reasoning.
    - Determinism & Formatting
        - Be deterministic; break ties by ascending student_id.
        - Return only the JSON for PairingLLMOutput (with groups) and reasoning. No extra keys, no comments.

    <FEW-SHOT EXAMPLES>
    Below are few-shot examples for you to reference and guide your reasoning for new data.
    Be mindful that these are strictly here for reference, NEVER output the few-shot results directly, always reason fresh on your new data.

    1)
    Input:
    {{
        "group_size": 3,
        "event_description": "Pre-Med Society kickoff event focused on forming semester-long project groups blending clinical exposure, healthcare innovation, and interdisciplinary applications of technology in medicine.",
        "students": [
            {{"student_id": 101, "name": "Ava Li",
            "profile_summary": "CS major; loves machine learning, hackathons, and startups. Runs and climbs.",
            "questionnaire_response_summary": "Wants partners interested in ML-for-healthcare; prefers problem-solving and medical device innovation."}},

            {{"student_id": 102, "name": "Marco Diaz",
            "profile_summary": "Economics + finance; quant research interest; soccer; enjoys sushi and coffee tastings.",
            "questionnaire_response_summary": "Wants a group focused on healthcare economics and resource allocation."}},

            {{"student_id": 103, "name": "Priya N",
            "profile_summary": "CS + HCI; product design; UX research; bouldering; photography; matcha.",
            "questionnaire_response_summary": "Wants to work on patient-centered design tools and clinic workflow prototypes."}},

            {{"student_id": 104, "name": "Sora K",
            "profile_summary": "Data science and ML; entrepreneurship club; badminton; ramen; indie games.",
            "questionnaire_response_summary": "Prefers technical predictive-modeling teams; wants fast-paced iteration."}},

            {{"student_id": 105, "name": "Jon Park",
            "profile_summary": "Applied math; quant/fintech; soccer/basketball; cooks Korean food.",
            "questionnaire_response_summary": "Interested in decision-making under uncertainty and statistical modeling in medicine."}},

            {{"student_id": 106, "name": "Mina G",
            "profile_summary": "Biology pre-med; baking; piano; casual running; anime.",
            "questionnaire_response_summary": "Prefers clinical-exposure discussions, ethical case studies, and patient narratives."}}
        ]
    }}
    Model Output:
    {{
        "groups": [
            [101, 103, 104],
            [102, 105, 106]
        ],
        "reasoning": "Event description emphasizes interdisciplinary pre-med project groups mixing clinical and technical themes. Questionnaire responses naturally split students into (1) technical healthcare innovation and (2) clinical/policy/ethics. Group 1 (101,103,104) aligns with ML-for-healthcare, patient-centered design, and predictive modeling—high event-aligned cohesion. Group 2 (102,105,106) aligns on healthcare economics, uncertainty modeling, and clinical narrative discussions. Group sizes meet group_size=3 with no singletons. Fairness pass confirmed maximizing minimum satisfaction under event context."
    }}

    2)
    Input:
    {{
        "group_size": 2,
        "event_description": "Sustainability Coalition Fall Project Cycle: teams will focus on ecological field-work, climate modeling, or sustainability engineering prototypes.",
        "students": [
            {{"student_id": 201, "name": "Riley Chen",
            "profile_summary": "Environmental engineering; hiking; sustainable design.",
            "questionnaire_response_summary": "Wants field-work using eco-sensors for conservation tech."}},

            {{"student_id": 202, "name": "Nora Patel",
            "profile_summary": "Geosciences; climate modeling.",
            "questionnaire_response_summary": "Wants climate-impact modeling using local field data."}},

            {{"student_id": 203, "name": "Samir Khan",
            "profile_summary": "Film studies; photography.",
            "questionnaire_response_summary": "Wants to film short sustainability documentaries."}},

            {{"student_id": 204, "name": "Ivy Brooks",
            "profile_summary": "Music production; audio engineering.",
            "questionnaire_response_summary": "Wants to work on audio post-production for sustainability film teams."}},

            {{"student_id": 205, "name": "Elena Park",
            "profile_summary": "Ecology; conservation tech; camping.",
            "questionnaire_response_summary": "Prefers ecological monitoring and biodegradable material testing."}}
        ]
    }}
    Model Output:
    {{
        "groups": [
            [201, 202, 205],
            [203, 204]
        ],
        "reasoning": "With group_size=2 and 5 students, the groups should be split into 2 and 3 based on (floor(5/2) = 2, and assigning the remaining one student to one group). The event context and questionnaire responses yield 2 natural groups: (201,202,205) for conservation/field monitoring with tech and data, (203,204) for sustainability-focused media production. There are no singletons, and each group shares clear event-aligned project interests."
    }}

    3)
    Input:
    {{
        "group_size": 2,
        "event_description": "Board Games Society strategy workshop focusing on pair-based sessions to study tactics, run analysis, and co-review competitive games.",
        "students": [
            {{"student_id": 301, "name": "Oliver Stone",
            "profile_summary": "CS; competitive programming; chess.",
            "questionnaire_response_summary": "Prefers Go/chess variant analysis sessions with strategy-heavy partners."}},

            {{"student_id": 302, "name": "Sofia Morales",
            "profile_summary": "Mathematics; chess; board games.",
            "questionnaire_response_summary": "Wants abstract strategy practice and joint analysis sessions."}},

            {{"student_id": 303, "name": "Devin Wu",
            "profile_summary": "Basketball; sports analytics.",
            "questionnaire_response_summary": "Wants partner training for basketball analytics drills."}},

            {{"student_id": 304, "name": "Amara Johnson",
            "profile_summary": "Basketball; coaching; sports podcasts.",
            "questionnaire_response_summary": "Prefers small-group basketball training sessions."}},

            {{"student_id": 305, "name": "Gianna Rossi",
            "profile_summary": "Culinary arts; sourdough baking.",
            "questionnaire_response_summary": "Wants recipe-exchange cooking partners."}},

            {{"student_id": 306, "name": "Noah Bennett",
            "profile_summary": "Nutrition; vegan cooking.",
            "questionnaire_response_summary": "Wants collaborative experimental cooking partners."}},

            {{"student_id": 307, "name": "Yuna Kim",
            "profile_summary": "K-pop dance club; video editing.",
            "questionnaire_response_summary": "Wants duet choreography practice."}},

            {{"student_id": 308, "name": "Marcus Lee",
            "profile_summary": "Hip-hop choreography; videography.",
            "questionnaire_response_summary": "Prefers collaborative choreo video-making pairs."}}
        ]
    }}
    Model Output:
    {{
        "groups": [
            [301, 302],
            [303, 304],
            [305, 306],
            [307, 308]
        ],
        "reasoning": "Event is about pair-based strategic/tactical sessions. Questionnaire responses for each domain (strategy games, basketball drills, cooking, choreography) strongly favor tightly coupled pairs. Profile summaries reinforce, but questionnaire dominates. All pairs meet group_size=2; no remainder."
    }}

    4)
    Input:
    {{
        "group_size": 3,
        "event_description": "AASA Fall Social: a casual community-bonding event meant to help students form small groups for social hangouts, creative activities, or low-pressure meetups.",
        "students": [
            {{"student_id": 401, "name": "Emily Zhou",
            "profile_summary": "Neuroscience; piano; running; cognitive psych podcasts.",
            "questionnaire_response_summary": "Open to any bonding activities; no specific preferences."}},

            {{"student_id": 402, "name": "Daniel Cho",
            "profile_summary": "CS; gaming; esports broadcasting.",
            "questionnaire_response_summary": "Wants social mixers; no specific activity preferences."}},

            {{"student_id": 403, "name": "Hana Patel",
            "profile_summary": "Chemistry; violin; museums; coffee roasting.",
            "questionnaire_response_summary": "Interested in attending showcases; otherwise open."}},

            {{"student_id": 404, "name": "Kevin Lin",
            "profile_summary": "Economics; badminton; K-dramas; cooking nights.",
            "questionnaire_response_summary": "Wants casual meetups; flexible; questionnaire vague."}},

            {{"student_id": 405, "name": "Sophia Reyes",
            "profile_summary": "Visual arts; graphic design; indie music.",
            "questionnaire_response_summary": "Wants chill hangouts; open-ended responses."}},

            {{"student_id": 406, "name": "Brian Nguyen",
            "profile_summary": "Mechanical engineering; robotics; board games; photography.",
            "questionnaire_response_summary": "Wants to meet people; enjoys food events; vague otherwise."}}
        ]
    }}
    Model Output:
    {{
        "groups": [
            [401, 403, 405],
            [402, 404, 406]
        ],
        "reasoning": "Event is a low-structure social bonding context. Questionnaire responses are uniformly vague ('open to anything'), providing almost no differentiating signals. Thus profile_summary was used to form coherent social micro-communities aligned to the event: Group 1 (401,403,405) clusters reflective/arts/culture interests (music, museums, visual arts), while Group 2 (402,404,406) clusters social/active hobbies (gaming, badminton, cooking, board games). This grouping avoids singletons and maximizes satisfaction given minimal questionnaire guidance."
    }}
    </FEW-SHOT EXAMPLES>
    """

    # lightweight user prompt helper to parse inputs
    @staticmethod
    def get_questionnaire_group_pairing_user_prompt(
        group_size: int,
        event_description: str,
        students: list[UserPairingInformation]
    ) -> str:
        payload = {
            "group_size": group_size,
            "event_description": event_description,
            "students": [
                {
                    "student_id": s.id,
                    "name": s.name,
                    "profile_summary": s.profile_summary,
                    "questionnaire_response_summary": s.questionniare_response_summary
                }
                for s in students
            ],
        }

        instruction = """
        Form balanced groups using the input below.
        Maximize the satisfaction across students by pairing similar students together, follow the group_size constraint.
        NEVER make a group with only one student, and return only the requested JSON output.
        """

        return instruction + json.dumps(payload, indent=2, ensure_ascii=False)


class CustomPairingPrompts:
    """
    Customizable pairing prompts with aux. request and questionnaire response support.
    To be implemented, as a stretch goal.
    """
    