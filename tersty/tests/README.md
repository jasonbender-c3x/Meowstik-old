# Tersty Tests Directory

This directory contains test scripts, sample data, and validation tools for the Meowstik test infrastructure.

## Files

### Test Definitions
- `IntentPanel.test.json` - Test suite for Intent Panel component
- `ArtifactPreview.test.json` - Test suite for Artifact Preview component  
- `AgentGenerator.test.json` - Test suite for Agent Generator component
- `EvolutionCenter.test.json` - Test suite for Evolution Center component

### Sample Data
- `sample-logs.json` - Sample tool execution logs for testing Evolution Center
  - Contains 12 log entries (9 errors, 3 successes)
  - Includes various error types: PermissionError, TimeoutError, NotFoundError
  - Used to validate error pattern detection and issue generation

### Validation Scripts
- `test-evolution-center.cjs` - Node.js script to validate Evolution Center logic
  - Parses sample logs
  - Identifies error patterns
  - Validates expected issue generation
  - Run with: `node tersty/tests/test-evolution-center.cjs`

## Running Tests

### Manual Testing with Evolution Center UI

1. Navigate to Evolution Center tab in Meowstik
2. Upload `sample-logs.json` or paste its contents
3. Set "Min Occurrences" to 3
4. Click "Analyze Logs"
5. Verify results:
   - Total Logs: 12
   - Errors Found: 9
   - Issues Generated: 2
   - Pattern 1: PermissionError (4 occurrences)
   - Pattern 2: TimeoutError (3 occurrences)

### Automated Validation

```bash
# From project root
node tersty/tests/test-evolution-center.cjs
```

Expected output:
- ✓ Sample logs are valid and parseable
- ✓ Error types are correctly identified
- ✓ Pattern grouping logic is sound
- ✓ Issue generation threshold works as expected
- ✓ Metadata (labels, assignees) is correctly formatted

## Sample Log Structure

Each log entry follows this structure:

```json
{
  "timestamp": "2026-01-29T10:15:30Z",
  "toolName": "tool_name",
  "status": "error|success|warning",
  "message": "Error description",
  "stack": "Optional stack trace"
}
```

## Adding New Tests

1. Copy appropriate template from `../templates/`
2. Fill in component/page details
3. Define test steps with actions and expected results
4. Set priority and status
5. Update this README with new test file

## Test Coverage

Current test coverage:
- ✓ IntentPanel (3 tests)
- ✓ ArtifactPreview (2 tests)  
- ✓ AgentGenerator (5 tests)
- ✓ EvolutionCenter (8 tests)

Total: 18 tests across 4 components

## Next Steps

- Add integration tests for component interactions
- Create E2E tests for complete workflows
- Add performance tests for log analysis
- Implement automated test execution
- Generate coverage reports
