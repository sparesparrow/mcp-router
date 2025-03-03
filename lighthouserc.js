module.exports = {
  ci: {
    collect: {
      // Static server configuration for development testing
      staticServerPort: 3000,
      // Use Chrome to run Lighthouse
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        skipAudits: ['uses-http2'],
      },
      // Define URLs to test
      url: [
        'http://localhost:3000/', // Home page
        'http://localhost:3000/workflow-designer', // Workflow designer page
        'http://localhost:3000/workflow-library' // Workflow library page
      ],
      // Number of times to run Lighthouse
      numberOfRuns: 3,
    },
    upload: {
      // Don't upload results to a server
      target: 'filesystem',
      outputDir: './lighthouse-results',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
    assert: {
      // Define performance budgets and assertions
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'max-potential-fid': ['warn', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
      },
    },
  },
}; 