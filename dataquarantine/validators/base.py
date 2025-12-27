"""Base validator interface"""

from abc import ABC, abstractmethod
from typing import Tuple, Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class ValidationError:
    """Represents a validation error with details"""
    type: str
    message: str
    field_path: Optional[str] = None
    expected: Optional[Any] = None
    actual: Optional[Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "type": self.type,
            "message": self.message,
            "field_path": self.field_path,
            "expected": self.expected,
            "actual": self.actual
        }


class BaseValidator(ABC):
    """
    Abstract base class for all validators.
    
    All validators must implement the validate method which takes
    a message and schema, and returns a tuple of (is_valid, error).
    """
    
    @abstractmethod
    async def validate(
        self,
        message: Dict[str, Any],
        schema: Dict[str, Any]
    ) -> Tuple[bool, Optional[ValidationError]]:
        """
        Validate a message against a schema.
        
        Args:
            message: The message to validate
            schema: The schema definition
            
        Returns:
            Tuple of (is_valid, error)
            - is_valid: True if valid, False otherwise
            - error: ValidationError if invalid, None if valid
        """
        pass
    
    @property
    @abstractmethod
    def validator_name(self) -> str:
        """Return the name of this validator"""
        pass
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}: {self.validator_name}>"
