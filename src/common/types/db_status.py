from enum import Enum

# status for if DB query was successful or not
class DBStatus(Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    NOT_FOUND = "not_found"