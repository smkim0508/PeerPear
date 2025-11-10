# universal helper to easily convert DTO and ORM objects
from pydantic import BaseModel
from typing import TypeVar, Generic, Optional

def orm_to_dto(orm_obj, dto_cls):
    return dto_cls.model_validate(orm_obj)

def dto_to_orm(dto_obj, orm_cls):
    return orm_cls(**dto_obj.model_dump(exclude_unset=True))