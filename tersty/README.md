# Tersty - Test Database

## Overview
Tersty is the central test database for Meowstik, containing test scripts, procedures, and templates for validating functionality across all pages and components.

## Directory Structure

```
tersty/
├── tests/           # Test scripts for each component/page
├── procedures/      # Test procedures and execution plans
├── templates/       # Test templates for common patterns
└── README.md        # This file
```

## Purpose

- **Centralized Testing**: Keep all test scripts and procedures in one organized location
- **Page-Level Testing**: Each page/component has its own test suite
- **Reusable Templates**: Common test patterns for consistent testing
- **Evolution Support**: Test results feed into the Evolution Center for self-improvement

## Test Organization

### Tests Directory (`tests/`)
Contains individual test scripts for each component or page:
- `IntentPanel.test.json` - Tests for Intent Panel component
- `ArtifactPreview.test.json` - Tests for Artifact Preview component
- `AgentGenerator.test.json` - Tests for Agent Generator component
- `EvolutionCenter.test.json` - Tests for Evolution Center component

### Procedures Directory (`procedures/`)
Contains test execution procedures and plans:
- Standard operating procedures for testing
- Test execution workflows
- Integration test plans

### Templates Directory (`templates/`)
Contains reusable test templates:
- Component test template
- Page test template
- Integration test template
- E2E test template

## Test Script Format

Test scripts are stored in JSON format with the following structure:

```json
{
  "component": "ComponentName",
  "version": "1.0.0",
  "lastUpdated": "2026-01-29",
  "tests": [
    {
      "id": "test-001",
      "name": "Test Description",
      "type": "unit|integration|e2e",
      "steps": [
        {
          "action": "Action to perform",
          "expected": "Expected result"
        }
      ],
      "priority": "high|medium|low",
      "status": "active|deprecated"
    }
  ]
}
```

## Usage

1. **Adding Tests**: Create a new test file in the `tests/` directory
2. **Running Tests**: Use the Evolution Center to execute and analyze tests
3. **Templates**: Copy from `templates/` to create new test suites
4. **Procedures**: Follow procedures in `procedures/` for consistent testing

## Integration with Evolution Center

The Evolution Center uses Tersty to:
- Track test coverage
- Identify failing tests
- Generate improvement issues
- Monitor quality metrics

## Best Practices

1. Keep test scripts up-to-date with component changes
2. Use descriptive test names and IDs
3. Include expected results for all test steps
4. Mark deprecated tests appropriately
5. Review and update tests regularly
