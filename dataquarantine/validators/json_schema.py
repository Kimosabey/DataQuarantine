"""JSON Schema validator implementation"""

import jsonschema
from jsonschema import Draft7Validator, ValidationError as JSValidationError
from typing import Tuple, Optional, Dict, Any
import logging

from dataquarantine.validators.base import BaseValidator, ValidationError

logger = logging.getLogger(__name__)


class JSONSchemaValidator(BaseValidator):
    """
    Validates messages using JSON Schema (Draft 7).
    
    Features:
    - Schema caching for performance
    - Detailed error messages with field paths
    - Support for all JSON Schema Draft 7 features
    """
    
    def __init__(self):
        self._validator_cache: Dict[str, Draft7Validator] = {}
        logger.info("JSONSchemaValidator initialized")
    
    async def validate(
        self,
        message: Dict[str, Any],
        schema: Dict[str, Any]
    ) -> Tuple[bool, Optional[ValidationError]]:
        """
        Validate message against JSON Schema.
        
        Args:
            message: Message to validate
            schema: JSON Schema definition
            
        Returns:
            (is_valid, error) tuple
        """
        try:
            # Get or create validator (with caching)
            schema_id = schema.get("$id", schema.get("name", "default"))
            
            if schema_id not in self._validator_cache:
                self._validator_cache[schema_id] = Draft7Validator(schema)
                logger.debug(f"Created validator for schema: {schema_id}")
            
            validator = self._validator_cache[schema_id]
            
            # Validate and collect errors
            errors = list(validator.iter_errors(message))
            
            if errors:
                # Return the first error with detailed information
                error = errors[0]
                field_path = ".".join(str(p) for p in error.path) if error.path else "root"
                
                return False, ValidationError(
                    type="schema_violation",
                    message=error.message,
                    field_path=field_path,
                    expected=error.schema.get("type"),
                    actual=type(error.instance).__name__ if hasattr(error, 'instance') else None
                )
            
            # Validation successful
            logger.debug(f"Message validated successfully against schema: {schema_id}")
            return True, None
            
        except jsonschema.SchemaError as e:
            # Invalid schema definition
            logger.error(f"Invalid schema definition: {e}")
            return False, ValidationError(
                type="invalid_schema",
                message=f"Schema definition error: {str(e)}"
            )
        except Exception as e:
            # Unexpected error
            logger.error(f"Validation error: {e}", exc_info=True)
            return False, ValidationError(
                type="validation_error",
                message=f"Unexpected validation error: {str(e)}"
            )
    
    @property
    def validator_name(self) -> str:
        return "json_schema"
    
    def clear_cache(self):
        """Clear the validator cache (useful for testing)"""
        self._validator_cache.clear()
        logger.info("Validator cache cleared")
