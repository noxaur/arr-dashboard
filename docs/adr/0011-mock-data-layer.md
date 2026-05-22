# ADR-0011: Mock Data Layer for Development and Testing

## Status
Accepted

## Context
[Why env-var-driven mock data instead of just mocking fetch in tests, or instead of running real services in dev]

## Decision
[USE_MOCK_DATA env var, mock data fixtures per service]

## Consequences
**Positive:**
- Dashboard can be developed and demoed without any *arr services running
- CI tests don't depend on external service availability
- Easy to reproduce specific states (errors, empty queues, full disk)

**Negative:**
- Mock data is a parallel implementation that must be kept in sync with real API shapes
- No compile-time guarantee that mocks match real responses
- Easy to forget to update mocks when adding new API fields
