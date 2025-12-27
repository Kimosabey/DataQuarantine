"""
DataQuarantine - Streaming Schema Enforcer

A production-ready streaming schema enforcement system that validates,
quarantines, and monitors data quality in real-time streaming pipelines.
"""

__version__ = "1.0.0"
__author__ = "Kimo"

from dataquarantine.core.validator_engine import ValidatorEngine, ValidationResult
from dataquarantine.validators.base import BaseValidator
from dataquarantine.validators.json_schema import JSONSchemaValidator

__all__ = [
    "ValidatorEngine",
    "ValidationResult",
    "BaseValidator",
    "JSONSchemaValidator",
]
