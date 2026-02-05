/**
 * Grafana Integration Configuration
 */

// K6 output configuration for different backends
export const grafanaConfig = {
    // Grafana Cloud (Prometheus Remote Write)
    prometheusRemoteWrite: {
        endpoint: 'https://prometheus-prod-XX-prod-XX.grafana.net/api/prom/push',
        username: '__GRAFANA_CLOUD_USER__',
        password: '__GRAFANA_CLOUD_API_KEY__'
    },

    // InfluxDB (self-hosted or cloud)
    influxdb: {
        endpoint: 'http://localhost:8086',
        database: 'k6',
        username: '',
        password: ''
    }
};

// K6 CLI flags for different outputs
export const outputFlags = {
    // Prometheus remote write
    prometheus: '--out experimental-prometheus-rw',

    // InfluxDB
    influxdb: '--out influxdb=http://localhost:8086/k6',

    // JSON file
    json: '--out json=results.json',

    // CSV file
    csv: '--out csv=results.csv',

    // Cloud (Grafana Cloud K6)
    cloud: '--out cloud'
};

// Environment variables needed for Grafana integration
export const envVars = {
    prometheus: {
        K6_PROMETHEUS_RW_SERVER_URL: grafanaConfig.prometheusRemoteWrite.endpoint,
        K6_PROMETHEUS_RW_USERNAME: grafanaConfig.prometheusRemoteWrite.username,
        K6_PROMETHEUS_RW_PASSWORD: grafanaConfig.prometheusRemoteWrite.password,
        K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM: 'true'
    },
    influxdb: {
        K6_INFLUXDB_ADDR: grafanaConfig.influxdb.endpoint,
        K6_INFLUXDB_DB: grafanaConfig.influxdb.database
    }
};

// Example usage in PowerShell
export const usageExamples = {
    prometheusRemoteWrite: `
# Set environment variables
$env:K6_PROMETHEUS_RW_SERVER_URL = "https://prometheus-prod-XX-prod-XX.grafana.net/api/prom/push"
$env:K6_PROMETHEUS_RW_USERNAME = "your-username"
$env:K6_PROMETHEUS_RW_PASSWORD = "your-api-key"

# Run test with Prometheus output
k6 run --out experimental-prometheus-rw tests/smoke.test.js
`,
    influxdb: `
# Run test with InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 tests/smoke.test.js
`,
    multipleOutputs: `
# Multiple outputs at once
k6 run --out json=results.json --out influxdb=http://localhost:8086/k6 tests/smoke.test.js
`
};

export default { grafanaConfig, outputFlags, envVars, usageExamples };
