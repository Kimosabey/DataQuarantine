"""Schema registry for loading and caching schemas"""

import os
import yaml
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import asyncio

from dataquarantine.config.settings import settings

logger = logging.getLogger(__name__)


class SchemaRegistry:
    """
    Manages schema loading, caching, and versioning.
    
    Features:
    - Load schemas from filesystem
    - In-memory caching with TTL
    - Version management
    - Support for YAML and JSON schemas
    """
    
    def __init__(self, schema_directory: Optional[str] = None):
        self.schema_directory = schema_directory or settings.schema_directory
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_timestamps: Dict[str, datetime] = {}
        self._lock = asyncio.Lock()
        logger.info(f"SchemaRegistry initialized with directory: {self.schema_directory}")
    
    async def get_schema(
        self,
        schema_name: str,
        version: str = "latest"
    ) -> Dict[str, Any]:
        """
        Get a schema by name and version.
        
        Args:
            schema_name: Name of the schema
            version: Version string (default: "latest")
            
        Returns:
            Schema definition as dictionary
            
        Raises:
            FileNotFoundError: If schema not found
            ValueError: If schema is invalid
        """
        cache_key = f"{schema_name}:{version}"
        
        # Check cache
        if self._is_cached(cache_key):
            logger.debug(f"Schema cache hit: {cache_key}")
            return self._cache[cache_key]
        
        # Load from filesystem
        async with self._lock:
            # Double-check after acquiring lock
            if self._is_cached(cache_key):
                return self._cache[cache_key]
            
            schema = await self._load_schema_from_file(schema_name, version)
            
            # Cache it
            self._cache[cache_key] = schema
            self._cache_timestamps[cache_key] = datetime.utcnow()
            
            logger.info(f"Schema loaded and cached: {cache_key}")
            return schema
    
    async def _load_schema_from_file(
        self,
        schema_name: str,
        version: str
    ) -> Dict[str, Any]:
        """Load schema from YAML or JSON file"""
        
        # Try different file extensions
        for ext in ['.yaml', '.yml', '.json']:
            if version == "latest":
                filepath = os.path.join(self.schema_directory, f"{schema_name}{ext}")
            else:
                filepath = os.path.join(
                    self.schema_directory,
                    schema_name,
                    f"{version}{ext}"
                )
            
            if os.path.exists(filepath):
                logger.debug(f"Loading schema from: {filepath}")
                
                with open(filepath, 'r') as f:
                    if ext == '.json':
                        schema_data = json.load(f)
                    else:
                        schema_data = yaml.safe_load(f)
                
                # Validate schema structure
                self._validate_schema_structure(schema_data)
                
                return schema_data.get('schema', schema_data)
        
        raise FileNotFoundError(
            f"Schema not found: {schema_name} (version: {version})"
        )
    
    def _validate_schema_structure(self, schema_data: Dict[str, Any]):
        """Validate that schema has required fields"""
        if 'schema' in schema_data:
            # Wrapped format
            required_fields = ['name', 'version', 'schema']
            for field in required_fields:
                if field not in schema_data:
                    raise ValueError(f"Schema missing required field: {field}")
        # Otherwise assume it's a raw JSON Schema
    
    def _is_cached(self, cache_key: str) -> bool:
        """Check if schema is in cache and not expired"""
        if cache_key not in self._cache:
            return False
        
        # Check TTL
        timestamp = self._cache_timestamps.get(cache_key)
        if timestamp:
            age = (datetime.utcnow() - timestamp).total_seconds()
            if age > settings.schema_cache_ttl:
                # Expired
                logger.debug(f"Schema cache expired: {cache_key}")
                del self._cache[cache_key]
                del self._cache_timestamps[cache_key]
                return False
        
        return True
    
    def clear_cache(self):
        """Clear all cached schemas"""
        self._cache.clear()
        self._cache_timestamps.clear()
        logger.info("Schema cache cleared")
    
    async def list_schemas(self) -> list[str]:
        """List all available schemas"""
        if not os.path.exists(self.schema_directory):
            return []
        
        schemas = []
        for filename in os.listdir(self.schema_directory):
            if filename.endswith(('.yaml', '.yml', '.json')):
                schema_name = os.path.splitext(filename)[0]
                schemas.append(schema_name)
        
        return sorted(schemas)
