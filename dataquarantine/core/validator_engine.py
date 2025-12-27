"""Core validation engine orchestration"""

from typing import Dict, Any, List, Optional
from enum import Enum
from dataclasses import dataclass
import time
import logging

from dataquarantine.validators.base import BaseValidator, ValidationError
from dataquarantine.core.schema_registry import SchemaRegistry
from dataquarantine.core.metrics import metrics

logger = logging.getLogger(__name__)


class ValidationResult(Enum):
    """Validation result status"""
    VALID = "valid"
    INVALID = "invalid"
    ERROR = "error"


@dataclass
class ValidationOutcome:
    """
    Result of validation with detailed information.
    
    Attributes:
        result: Validation status (VALID, INVALID, ERROR)
        error_type: Type of error if invalid
        error_message: Detailed error message
        field_path: Path to the invalid field
        remediated: Whether auto-remediation was applied
        metadata: Additional metadata
    """
    result: ValidationResult
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    field_path: Optional[str] = None
    remediated: bool = False
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "result": self.result.value,
            "error_type": self.error_type,
            "error_message": self.error_message,
            "field_path": self.field_path,
            "remediated": self.remediated,
            "metadata": self.metadata
        }


class ValidatorEngine:
    """
    Core validation engine that orchestrates the validation pipeline.
    
    Pipeline:
    1. Load schema from registry
    2. Run all validators in sequence
    3. Apply auto-remediation if enabled
    4. Emit metrics
    5. Return validation outcome
    """
    
    def __init__(
        self,
        schema_registry: SchemaRegistry,
        validators: List[BaseValidator],
        enable_auto_remediation: bool = False
    ):
        self.schema_registry = schema_registry
        self.validators = validators
        self.enable_auto_remediation = enable_auto_remediation
        
        logger.info(
            f"ValidatorEngine initialized with {len(validators)} validators"
        )
    
    async def validate_message(
        self,
        message: Dict[str, Any],
        schema_name: str,
        schema_version: str = "latest",
        topic: str = "unknown"
    ) -> ValidationOutcome:
        """
        Validate a message against a schema.
        
        Args:
            message: The message to validate
            schema_name: Name of the schema
            schema_version: Version of the schema (default: "latest")
            topic: Kafka topic name (for metrics)
            
        Returns:
            ValidationOutcome with result and error details
        """
        start_time = time.time()
        
        try:
            # 1. Load schema
            try:
                schema = await self.schema_registry.get_schema(
                    schema_name,
                    schema_version
                )
            except FileNotFoundError as e:
                logger.error(f"Schema not found: {schema_name}:{schema_version}")
                metrics.record_error("schema_not_found")
                return ValidationOutcome(
                    result=ValidationResult.ERROR,
                    error_type="schema_not_found",
                    error_message=str(e)
                )
            
            # 2. Run validators
            for validator in self.validators:
                logger.debug(
                    f"Running validator: {validator.validator_name} "
                    f"for schema: {schema_name}"
                )
                
                is_valid, error = await validator.validate(message, schema)
                
                if not is_valid:
                    # Validation failed
                    logger.warning(
                        f"Validation failed: {error.type} - {error.message}"
                    )
                    
                    # TODO: Auto-remediation logic here
                    # if self.enable_auto_remediation:
                    #     remediated_msg = await self._remediate(message, error)
                    #     if remediated_msg:
                    #         # Re-validate
                    #         is_valid, _ = await validator.validate(remediated_msg, schema)
                    #         if is_valid:
                    #             return ValidationOutcome(
                    #                 result=ValidationResult.VALID,
                    #                 remediated=True,
                    #                 metadata={"original": message}
                    #             )
                    
                    # Record metrics
                    metrics.record_invalid(schema_name, error.type, topic)
                    
                    return ValidationOutcome(
                        result=ValidationResult.INVALID,
                        error_type=error.type,
                        error_message=error.message,
                        field_path=error.field_path
                    )
            
            # 3. All validators passed
            logger.debug(f"Message validated successfully: {schema_name}")
            metrics.record_valid(schema_name, topic)
            
            return ValidationOutcome(result=ValidationResult.VALID)
            
        except Exception as e:
            # Unexpected error
            logger.error(
                f"Validation error for schema {schema_name}: {e}",
                exc_info=True
            )
            metrics.record_error("validation_exception")
            
            return ValidationOutcome(
                result=ValidationResult.ERROR,
                error_type="system_error",
                error_message=str(e)
            )
        
        finally:
            # Record duration
            duration = time.time() - start_time
            metrics.record_duration(schema_name, duration)
            logger.debug(f"Validation took {duration:.4f}s")
    
    def add_validator(self, validator: BaseValidator):
        """Add a validator to the pipeline"""
        self.validators.append(validator)
        logger.info(f"Added validator: {validator.validator_name}")
    
    def remove_validator(self, validator_name: str):
        """Remove a validator from the pipeline"""
        self.validators = [
            v for v in self.validators
            if v.validator_name != validator_name
        ]
        logger.info(f"Removed validator: {validator_name}")
