from enum import Enum

# enums to represent event status
class EventStatus(Enum):
    NOT_STARTED = "NOT_STARTED"
    STARTED = "STARTED"
    TERMINATED = "TERMINATED"
    PAIRING_PUBLISHED = "PAIRING_PUBLISHED"

# enums to represent event roles, currently big and little siblings
class EventRole(Enum):
    BIG_SIBLING = "BIG_SIBLING"
    LITTLE_SIBLING = "LITTLE_SIBLING"
    ANY_SIBLING = "ANY_SIBLING" # open to being big or little
