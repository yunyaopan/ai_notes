# Testing Guide

This project includes comprehensive testing setup at multiple levels to ensure reliability and maintainability.

## Testing Structure

### 1. Unit Tests (Jest + Testing Library)
- **Location**: `__tests__/` directory
- **Purpose**: Test individual functions, components, and utilities with mocked dependencies
- **Technologies**: Jest, @testing-library/react, @testing-library/jest-dom

### 2. End-to-End Tests (Playwright)
- **Location**: `e2e/` directory  
- **Purpose**: Test complete user workflows in a real browser environment
- **Technologies**: Playwright

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI (interactive mode)
npm run test:e2e:ui

# Install Playwright browsers (first time setup)
npx playwright install
```

## Current Test Coverage

### Working Unit Tests
✅ **Categories Configuration** (`__tests__/lib/config/categories.test.ts`)
- Validates category structure and helper functions
- Tests prompt generation for AI categorization
- Verifies Tailwind CSS class format

✅ **Basic Test Setup** (`__tests__/simple.test.ts`)
- Verifies Jest configuration is working
- Tests async operations and environment variables

### E2E Test Structure
✅ **Homepage Tests** (`e2e/homepage.spec.ts`)
- Page loading and navigation testing
- Responsive design validation
- Authentication state handling

✅ **Authentication Flow** (`e2e/auth-flow.spec.ts`)
- Sign up and login process testing
- Password reset flow validation
- Protected route access verification

✅ **Text Categorization** (`e2e/text-categorizer.spec.ts`)
- Full text processing workflow testing
- Chunk editing and management validation
- Pin/unpin functionality testing

## Test Configuration

### Jest Configuration
- **Config file**: `jest.config.js`
- **Setup file**: `jest.setup.js`
- **Environment**: jsdom for DOM testing
- **Coverage**: Configured for app/, lib/, and components/ directories

### Playwright Configuration  
- **Config file**: `playwright.config.ts`
- **Global setup**: `e2e/global-setup.ts`
- **Browsers**: Chromium, Firefox, WebKit (Chromium installed)
- **Base URL**: http://localhost:3000 (configurable)

## Testing Challenges and Solutions

### API Testing with Database Layer
**Challenge**: Next.js App Router and Supabase integration requires complex mocking
**Current Status**: Infrastructure prepared but complex API tests need further refinement
**Solution**: Focus on unit testing business logic and E2E testing for integration

### Module Resolution
**Challenge**: Next.js path aliases (`@/`) need proper Jest configuration
**Current Status**: Working for simple imports, may need refinement for complex API routes
**Solution**: Test configuration validates the approach works for basic cases

## Continuous Integration

The GitHub Actions workflow (`.github/workflows/test.yml`) includes:
- **Unit tests** with coverage reporting
- **Type checking** and linting validation
- **E2E tests** across multiple browsers
- **Artifact collection** for failed test reports

## Test Development Guidelines

### For Unit Tests
1. **Start with pure functions** (like the categories config)
2. **Mock external dependencies** (database, APIs, auth)
3. **Test both success and error scenarios**
4. **Use descriptive test names** that explain the scenario

### For E2E Tests
1. **Test complete user workflows** end-to-end
2. **Use robust selectors** (data-testid preferred)
3. **Handle async operations** with proper waits
4. **Test across different screen sizes** when applicable

## Environment Setup

### Required Environment Variables for E2E Tests:
```bash
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
TEST_EMAIL=test@example.com  
TEST_PASSWORD=testpassword123
```

### Database Setup for E2E Tests:
For full E2E testing with real data, you'll need:
1. A test Supabase instance or local setup
2. Test user accounts configured
3. Proper database seeding for consistent test data

## Running the Tests

### Verify Current Setup
```bash
# Run unit tests
npm test

# Check types
npm run type-check

# Run linting
npm run lint

# Run E2E tests (requires app to be running)
npm run dev # In one terminal
npm run test:e2e # In another terminal
```

## Future Enhancements

### API Testing
The project is set up for comprehensive API testing with database mocking. Future improvements include:
- Resolving Next.js App Router module path resolution
- Creating simplified API test patterns
- Adding integration tests for database operations

### Component Testing
- Add React component testing with Testing Library
- Test user interactions and state management
- Validate accessibility compliance

### Performance Testing
- Add Lighthouse CI for performance regression testing
- Monitor bundle size changes
- Test for memory leaks in complex user flows

## Key Achievement

✅ **Complete testing infrastructure** is in place
✅ **Working unit tests** demonstrate the approach
✅ **E2E testing framework** ready for comprehensive scenarios
✅ **CI/CD pipeline** configured for automated testing
✅ **Comprehensive documentation** for team onboarding

The testing setup provides a solid foundation for maintaining code quality and enabling confident deployments. The framework is ready to be extended with specific test cases as the application evolves.