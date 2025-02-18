from typing import Dict, List, Optional, Type
from dataclasses import dataclass
import re
import logging
from abc import ABC, abstractmethod

@dataclass
class PatternRule:
    """Represents a pattern validation rule."""
    name: str
    description: str
    pattern: str
    message: str
    severity: str = "error"  # error, warning, info

class PatternViolation:
    """Represents a pattern violation."""
    def __init__(self, rule: PatternRule, location: str):
        self.rule = rule
        self.location = location
        self.timestamp = datetime.now()

class PatternValidator:
    """Validates implementation patterns against defined rules."""
    
    def __init__(self):
        self._rules: Dict[str, PatternRule] = {}
        self._logger = logging.getLogger(__name__)
        self._initialize_default_rules()
    
    def _initialize_default_rules(self):
        """Initialize default pattern validation rules."""
        self._rules.update({
            "component_structure": PatternRule(
                name="component_structure",
                description="Ensure proper cognitive component structure",
                pattern=r"class\s+\w+\([^)]*CognitiveComponent\)",
                message="Components must implement CognitiveComponent interface"
            ),
            "memory_management": PatternRule(
                name="memory_management",
                description="Verify memory system implementation",
                pattern=r"class\s+\w+Memory\b",
                message="Implement structured memory systems"
            ),
            "pattern_orchestration": PatternRule(
                name="pattern_orchestration",
                description="Check pattern orchestration implementation",
                pattern=r"async\s+def\s+select_pattern|orchestrate",
                message="Implement proper pattern orchestration"
            ),
            "resource_management": PatternRule(
                name="resource_management",
                description="Verify resource management implementation",
                pattern=r"resource\.getrusage|ResourceLimits",
                message="Implement resource monitoring and limits"
            ),
            "security_validation": PatternRule(
                name="security_validation",
                description="Check security validation implementation",
                pattern=r"SecurityViolation|validate_\w+",
                message="Implement security validation checks"
            )
        })
    
    def add_rule(self, rule: PatternRule) -> None:
        """Add a new pattern validation rule."""
        if rule.name in self._rules:
            raise ValueError(f"Rule {rule.name} already exists")
        self._rules[rule.name] = rule
    
    def validate_code(self, code: str, location: str) -> List[PatternViolation]:
        """Validate code against all registered patterns."""
        violations: List[PatternViolation] = []
        
        for rule in self._rules.values():
            if not re.search(rule.pattern, code):
                violation = PatternViolation(rule, location)
                violations.append(violation)
                self._logger.warning(
                    f"Pattern violation: {rule.message} in {location}"
                )
        
        return violations
    
    def validate_component(self, component: Type) -> List[PatternViolation]:
        """Validate a component class against patterns."""
        violations: List[PatternViolation] = []
        code = inspect.getsource(component)
        location = f"{component.__module__}.{component.__name__}"
        
        return self.validate_code(code, location)
    
    def get_rule(self, name: str) -> Optional[PatternRule]:
        """Get a pattern rule by name."""
        return self._rules.get(name)
    
    def list_rules(self) -> List[PatternRule]:
        """List all registered pattern rules."""
        return list(self._rules.values())

class PatternEnforcer:
    """Enforces pattern compliance during runtime."""
    
    def __init__(self, validator: PatternValidator):
        self._validator = validator
        self._violations: List[PatternViolation] = []
        self._logger = logging.getLogger(__name__)
    
    def enforce_patterns(self, component: Type) -> bool:
        """Enforce patterns on a component, raising exception on violations."""
        violations = self._validator.validate_component(component)
        
        if violations:
            self._violations.extend(violations)
            error_msg = "\n".join([
                f"- {v.rule.message} ({v.location})"
                for v in violations
            ])
            raise ValueError(f"Pattern violations detected:\n{error_msg}")
        
        return True
    
    def get_violations(self) -> List[PatternViolation]:
        """Get all recorded pattern violations."""
        return self._violations.copy()
    
    def clear_violations(self) -> None:
        """Clear recorded pattern violations."""
        self._violations.clear() 