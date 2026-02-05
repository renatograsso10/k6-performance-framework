# K6 Performance Framework

A modular, production-ready framework for API performance testing using [K6](https://k6.io) with integrated observability through Grafana Cloud.

## Overview

This framework provides a structured approach to performance testing with support for multiple test scenarios, automated CI/CD pipelines, and real-time metrics visualization.

### Supported Test Types

| Test Type | Purpose | Typical Duration |
|-----------|---------|------------------|
| Smoke | Quick validation of system health | 2 minutes |
| Load | Simulate expected production traffic | 15 minutes |
| Stress | Evaluate system behavior beyond normal capacity | 16 minutes |
| Spike | Test response to sudden traffic bursts | 4 minutes |
| Soak | Identify memory leaks and long-term stability issues | 30+ minutes |
| Endurance | Validate extended operation under sustained load | 2+ hours |
| Breakpoint | Determine maximum system capacity | Variable |

## Getting Started

### Prerequisites

- [K6](https://k6.io/docs/getting-started/installation/) installed locally
- Node.js (optional, for development utilities)

### Running Tests

```bash
# Smoke test - quick validation
k6 run tests/smoke.test.js

# Load test with custom parameters
k6 run tests/load.test.js --duration=30s --vus=10

# Run with HTML report generation
k6 run tests/smoke.test.js
```

Reports are generated automatically in the `reports/` directory.

## Project Structure

```
k6-performance-framework/
├── .github/
│   └── workflows/         # CI/CD pipeline definitions
├── docs/                  # Documentation
├── reports/               # Generated test reports
├── src/
│   ├── api/              # API clients (People, Planets, Films, Starships)
│   ├── config/           # Thresholds, SLOs, environment settings
│   ├── core/             # HTTP client, logger, reporter, metrics
│   └── utils/            # Helpers, tags, validation checks
└── tests/                # Test scenarios
```

## Features

- **Multiple Test Scenarios**: Pre-configured smoke, load, stress, spike, soak, endurance, and breakpoint tests
- **HTML Reports**: Detailed reports with response time metrics and SLO compliance status
- **Grafana Integration**: Real-time metrics streaming to Grafana Cloud
- **Automated Pipelines**: GitHub Actions workflow with scheduled daily runs
- **SLO Tracking**: Built-in Service Level Objective monitoring with error budget visualization

## CI/CD Integration

The framework includes a GitHub Actions workflow that:

- Runs automatically on push to main/develop branches
- Executes daily at 11:00 AM (Brasilia time)
- Supports manual trigger with test type selection
- Streams metrics to Grafana Cloud for visualization

### Required Secrets

Configure these secrets in your GitHub repository:

| Secret Name | Description |
|-------------|-------------|
| `GRAFANA_PROMETHEUS_URL` | Prometheus remote write endpoint |
| `GRAFANA_USERNAME` | Grafana Cloud user ID |
| `GRAFANA_API_TOKEN` | Grafana Cloud API token |

## Observability

Metrics are automatically sent to Grafana Cloud, enabling:

- Real-time performance monitoring during test execution
- Historical trend analysis
- Alerting on threshold violations (latency > 2s, error rate > 5%)

## Test Commands Reference

```bash
# Individual test types
k6 run tests/smoke.test.js
k6 run tests/load.test.js
k6 run tests/stress.test.js
k6 run tests/spike.test.js
k6 run tests/soak.test.js
k6 run tests/endurance.test.js
k6 run tests/breakpoint.test.js

# With Grafana output
k6 run --out experimental-prometheus-rw tests/smoke.test.js
```

## Technology Stack

- **K6**: Load testing engine
- **SWAPI**: Star Wars API (demonstration target)
- **Grafana Cloud**: Metrics visualization and alerting
- **GitHub Actions**: CI/CD automation

## License

MIT
