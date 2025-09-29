# MCP-Router Performance Testing Guide

This guide explains how to implement, run, and analyze performance tests for the MCP-Router application.

## Overview

Our performance testing strategy consists of three main components:

1. **API Performance Testing** using K6
2. **Frontend Performance Testing** using Lighthouse CI
3. **End-to-End Performance Testing** using Cypress with performance tracking

## Prerequisites

Install the required dependencies:

```bash
# Install k6 (Linux)
curl -L https://github.com/grafana/k6/releases/download/v0.42.0/k6-v0.42.0-linux-amd64.tar.gz | tar xvz
sudo cp k6-v0.42.0-linux-amd64/k6 /usr/local/bin

# Install Lighthouse CI
npm install -g @lhci/cli
```

## Running Performance Tests

You can run all performance tests with a single command:

```bash
npm run test:performance
```

Or run individual test suites:

```bash
# API performance tests
npm run test:performance:api

# Frontend performance tests
npm run test:performance:lighthouse

# E2E performance tests
npm run test:performance:e2e
```

## Viewing Results

After running the tests, you can generate a performance dashboard:

```bash
npm run performance:report
```

This will create an HTML dashboard at `performance-reports/performance-dashboard.html`.

## Implementing New Tests

### API Performance Tests

Create a new K6 script in the `tests/performance` directory:

```js
import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up
    { duration: '1m', target: 20 },   // Steady load
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

// Test execution
export default function() {
  // Your test logic here
  let response = http.get('http://localhost:8000/api/your-endpoint');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

### Frontend Performance Tests

Update the `lighthouserc.js` file to include new URLs or metrics:

```js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/your-new-page',
      ],
    },
    assert: {
      assertions: {
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
      },
    },
  },
};
```

### E2E Performance Tests

Create a new test file in `integration-tests/cypress/e2e`:

```ts
describe('Your Feature Performance Tests', () => {
  const measurePerformance = (operation, name) => {
    const start = performance.now();
    operation();
    cy.window().then(() => {
      const end = performance.now();
      const duration = end - start;
      cy.log(`${name} took ${duration.toFixed(2)}ms`);
      cy.task('logPerformance', { name, duration });
    });
  };

  it('should measure your feature performance', () => {
    cy.visit('/your-feature');
    
    measurePerformance(() => {
      // Your test actions here
    }, 'Your Feature Operation');
  });
});
```

## CI/CD Integration

Performance tests are automatically run in the CI pipeline. The results are uploaded as artifacts and can be downloaded for analysis.

## Performance Budgets

We have established the following performance budgets:

| Metric | Budget |
|--------|--------|
| API Response Time (95th percentile) | < 500ms |
| First Contentful Paint | < 2000ms |
| Time to Interactive | < 3500ms |
| Largest Contentful Paint | < 2500ms |
| Cumulative Layout Shift | < 0.1 |

## Troubleshooting

If you encounter issues with the performance tests:

1. Ensure all services are running locally
2. Check the performance test logs
3. Verify that the Cypress performance plugin is working correctly

## Contributing

When adding new features, please include appropriate performance tests that:

1. Measure the key metrics for your feature
2. Set appropriate thresholds based on performance requirements
3. Document any performance considerations

## References

- [K6 Documentation](https://k6.io/docs/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)
- [Cypress Performance Testing](https://docs.cypress.io/guides/tooling/plugins-guide) 