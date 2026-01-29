# Test Execution Procedure

## Purpose
Standard procedure for executing tests in the Tersty test database.

## Prerequisites
- Test scripts are up-to-date in the `tests/` directory
- Evolution Center is accessible
- All components are built and running

## Procedure Steps

### 1. Pre-Test Setup
1. Review test scripts in `tersty/tests/`
2. Verify component versions match test versions
3. Ensure test environment is clean
4. Document test execution time and conditions

### 2. Test Execution
1. Open Evolution Center in the application
2. Click "Analyze" button to scan for errors
3. Review error patterns detected
4. Execute individual tests as needed
5. Document any test failures

### 3. Results Analysis
1. Review test results in Evolution Center
2. Identify recurring error patterns
3. Check generated GitHub issues
4. Verify copilot assignments

### 4. Post-Test Actions
1. Update test scripts based on findings
2. Mark deprecated tests
3. Add new tests for uncovered scenarios
4. Document lessons learned

## Test Types

### Unit Tests
- Test individual component functions
- Verify component rendering
- Check state management

### Integration Tests
- Test component interactions
- Verify data flow between components
- Check API integrations

### E2E Tests
- Test complete user workflows
- Verify navigation
- Check responsive design

## Recording Results
- Document test execution date/time
- Note pass/fail status for each test
- Record any anomalies or unexpected behavior
- Update test scripts as needed

## Escalation
If tests reveal critical issues:
1. Create high-priority GitHub issue
2. Assign to copilot for immediate attention
3. Document impact and urgency
4. Track resolution progress
