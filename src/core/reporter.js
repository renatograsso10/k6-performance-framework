/**
 * HTML Report Generator
 * Creates beautiful, detailed HTML reports from K6 test results
 */

import { getBaseUrl } from '../config/environments.js';
import { evaluateSLO } from '../config/slos.js';

/**
 * Generate comprehensive HTML report
 * @param {Object} data - K6 summary data
 * @param {string} testType - Type of test (smoke, load, stress, etc.)
 * @returns {string} HTML content
 */
export function generateHtmlReport(data, testType = 'performance', targetUrl = null) {
    const metrics = data.metrics || {};
    const timestamp = new Date().toISOString();
    const apiTarget = targetUrl || getBaseUrl();

    // Extract key metrics safely
    const getMetricValue = (metric, key, defaultVal = 0) => {
        return metrics[metric]?.values?.[key] ?? defaultVal;
    };

    const totalRequests = getMetricValue('http_reqs', 'count');
    const requestRate = getMetricValue('http_reqs', 'rate').toFixed(2);
    const avgDuration = getMetricValue('http_req_duration', 'avg').toFixed(2);
    const p95Duration = getMetricValue('http_req_duration', 'p(95)').toFixed(2);
    const p99Duration = getMetricValue('http_req_duration', 'p(99)').toFixed(2);
    const minDuration = getMetricValue('http_req_duration', 'min').toFixed(2);
    const maxDuration = getMetricValue('http_req_duration', 'max').toFixed(2);
    const errorRate = (getMetricValue('http_req_failed', 'rate') * 100).toFixed(2);
    const checksPass = (getMetricValue('checks', 'rate') * 100).toFixed(2);

    // Determine pass/fail status
    const isHealthy = parseFloat(errorRate) < 10 && parseFloat(checksPass) > 80;
    const statusColor = isHealthy ? '#10b981' : '#ef4444';
    const statusText = isHealthy ? 'PASSED' : 'FAILED';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K6 ${testType.toUpperCase()} Test Report</title>
    <style>
        :root {
            --primary: #7c3aed;
            --primary-light: #a78bfa;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --bg-dark: #0f172a;
            --bg-card: #1e293b;
            --bg-card-hover: #334155;
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --border: rgba(255, 255, 255, 0.1);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, var(--bg-dark) 0%, #1a1a2e 100%);
            color: var(--text-primary);
            min-height: 100vh;
            padding: 2rem;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border);
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .logo-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        h1 {
            font-size: 1.75rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .status-badge {
            padding: 0.5rem 1.5rem;
            border-radius: 50px;
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: ${statusColor}20;
            color: ${statusColor};
            border: 1px solid ${statusColor}40;
        }
        
        .meta-info {
            display: flex;
            gap: 2rem;
            margin-bottom: 2rem;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
        
        .meta-info span {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .kpi-card {
            background: var(--bg-card);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid var(--border);
            transition: all 0.3s ease;
        }
        
        .kpi-card:hover {
            background: var(--bg-card-hover);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        
        .kpi-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .kpi-title {
            color: var(--text-secondary);
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .kpi-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
        }
        
        .kpi-value {
            font-size: 2.5rem;
            font-weight: 700;
            line-height: 1.2;
        }
        
        .kpi-unit {
            font-size: 1rem;
            color: var(--text-secondary);
            margin-left: 0.25rem;
        }
        
        .kpi-trend {
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
        
        .trend-good { color: var(--success); }
        .trend-warning { color: var(--warning); }
        .trend-bad { color: var(--error); }
        
        .section {
            background: var(--bg-card);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 1px solid var(--border);
        }
        
        .section-title {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            text-align: left;
            padding: 1rem;
            border-bottom: 1px solid var(--border);
        }
        
        th {
            color: var(--text-secondary);
            font-weight: 500;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        tr:hover td {
            background: var(--bg-card-hover);
        }
        
        .metric-bar {
            width: 100%;
            height: 8px;
            background: var(--bg-dark);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        
        .metric-bar-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .footer {
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border);
        }
        
        .footer a {
            color: var(--primary-light);
            text-decoration: none;
        }
        
        @media (max-width: 768px) {
            body { padding: 1rem; }
            header { flex-direction: column; gap: 1rem; text-align: center; }
            .meta-info { flex-direction: column; gap: 0.5rem; }
            .kpi-value { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">
                <div class="logo-icon">📊</div>
                <div>
                    <h1>K6 Performance Report</h1>
                    <span style="color: var(--text-secondary); font-size: 0.875rem;">${testType.toUpperCase()} Test Results</span>
                </div>
            </div>
            <div class="status-badge">${statusText}</div>
        </header>
        
        <div class="meta-info">
            <span>📅 Generated: ${timestamp}</span>
            <span>⏱️ Test Type: ${testType}</span>
            <span>🎯 Target: ${apiTarget}</span>
        </div>
        
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">Total Requests</span>
                    <div class="kpi-icon" style="background: rgba(124, 58, 237, 0.2); color: var(--primary);">📨</div>
                </div>
                <div class="kpi-value">${totalRequests.toLocaleString()}</div>
                <div class="kpi-trend trend-good">@ ${requestRate} req/s</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">Response Time (p95)</span>
                    <div class="kpi-icon" style="background: rgba(16, 185, 129, 0.2); color: var(--success);">⚡</div>
                </div>
                <div class="kpi-value">${p95Duration}<span class="kpi-unit">ms</span></div>
                <div class="kpi-trend ${parseFloat(p95Duration) < 2000 ? 'trend-good' : 'trend-warning'}">
                    p99: ${p99Duration}ms
                </div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">Error Rate</span>
                    <div class="kpi-icon" style="background: ${parseFloat(errorRate) < 5 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${parseFloat(errorRate) < 5 ? 'var(--success)' : 'var(--error)'};">🚨</div>
                </div>
                <div class="kpi-value" style="color: ${parseFloat(errorRate) < 5 ? 'var(--success)' : 'var(--error)'}">${errorRate}<span class="kpi-unit">%</span></div>
                <div class="metric-bar">
                    <div class="metric-bar-fill" style="width: ${Math.min(errorRate, 100)}%; background: ${parseFloat(errorRate) < 5 ? 'var(--success)' : 'var(--error)'};"></div>
                </div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">Checks Passed</span>
                    <div class="kpi-icon" style="background: ${parseFloat(checksPass) > 90 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${parseFloat(checksPass) > 90 ? 'var(--success)' : 'var(--warning)'};">✅</div>
                </div>
                <div class="kpi-value" style="color: ${parseFloat(checksPass) > 90 ? 'var(--success)' : 'var(--warning)'}">${checksPass}<span class="kpi-unit">%</span></div>
                <div class="metric-bar">
                    <div class="metric-bar-fill" style="width: ${checksPass}%; background: ${parseFloat(checksPass) > 90 ? 'var(--success)' : 'var(--warning)'};"></div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📈 Response Time Distribution</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Minimum</td>
                        <td>${minDuration} ms</td>
                        <td><span class="trend-good">✓</span></td>
                    </tr>
                    <tr>
                        <td>Average</td>
                        <td>${avgDuration} ms</td>
                        <td><span class="${parseFloat(avgDuration) < 1000 ? 'trend-good' : 'trend-warning'}">${parseFloat(avgDuration) < 1000 ? '✓' : '⚠'}</span></td>
                    </tr>
                    <tr>
                        <td>p(90)</td>
                        <td>${getMetricValue('http_req_duration', 'p(90)').toFixed(2)} ms</td>
                        <td><span class="${parseFloat(getMetricValue('http_req_duration', 'p(90)')) < 2000 ? 'trend-good' : 'trend-warning'}">${parseFloat(getMetricValue('http_req_duration', 'p(90)')) < 2000 ? '✓' : '⚠'}</span></td>
                    </tr>
                    <tr>
                        <td>p(95)</td>
                        <td>${p95Duration} ms</td>
                        <td><span class="${parseFloat(p95Duration) < 3000 ? 'trend-good' : 'trend-warning'}">${parseFloat(p95Duration) < 3000 ? '✓' : '⚠'}</span></td>
                    </tr>
                    <tr>
                        <td>p(99)</td>
                        <td>${p99Duration} ms</td>
                        <td><span class="${parseFloat(p99Duration) < 5000 ? 'trend-good' : 'trend-bad'}">${parseFloat(p99Duration) < 5000 ? '✓' : '✗'}</span></td>
                    </tr>
                    <tr>
                        <td>Maximum</td>
                        <td>${maxDuration} ms</td>
                        <td><span class="trend-good">✓</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        ${generateSloSection(data)}
        
        <div class="section">
            <h2 class="section-title">🔍 Test Configuration</h2>
            <table>
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Test Type</td><td>${testType}</td></tr>
                    <tr><td>Target API</td><td>${apiTarget}</td></tr>
                    <tr><td>Total Iterations</td><td>${getMetricValue('iterations', 'count')}</td></tr>
                    <tr><td>Data Received</td><td>${(getMetricValue('data_received', 'count') / 1024).toFixed(2)} KB</td></tr>
                    <tr><td>Data Sent</td><td>${(getMetricValue('data_sent', 'count') / 1024).toFixed(2)} KB</td></tr>
                </tbody>
            </table>
        </div>
        
        <footer class="footer">
            <p>Generated by <a href="https://k6.io">K6 Performance Framework</a> | ${new Date().toLocaleDateString()}</p>
        </footer>
    </div>
</body>
</html>`;
}

function generateSloSection(data) {
    const slo = evaluateSLO(data, 'read_apis');
    const eb = slo.errorBudget;

    const budgetColor = eb.isHealthy ? '#10b981' : eb.isWarning ? '#f59e0b' : '#ef4444';
    const budgetWidth = Math.min(100, eb.percentUsed);

    return `
        <div class="section">
            <h2 class="section-title">🎯 SLO Status - ${slo.sloName}</h2>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: var(--bg-card); padding: 1rem; border-radius: 8px; text-align: center;">
                    <div style="color: #94a3b8; font-size: 0.875rem;">Latency P95</div>
                    <div style="font-size: 1.5rem; font-weight: 600; color: ${slo.results.latencyP95.passed ? '#10b981' : '#ef4444'};">
                        ${slo.results.latencyP95.actual.toFixed(0)}ms
                    </div>
                    <div style="color: #64748b; font-size: 0.75rem;">target: <${slo.results.latencyP95.target}ms</div>
                </div>
                <div style="background: var(--bg-card); padding: 1rem; border-radius: 8px; text-align: center;">
                    <div style="color: #94a3b8; font-size: 0.875rem;">Latency P99</div>
                    <div style="font-size: 1.5rem; font-weight: 600; color: ${slo.results.latencyP99.passed ? '#10b981' : '#ef4444'};">
                        ${slo.results.latencyP99.actual.toFixed(0)}ms
                    </div>
                    <div style="color: #64748b; font-size: 0.75rem;">target: <${slo.results.latencyP99.target}ms</div>
                </div>
                <div style="background: var(--bg-card); padding: 1rem; border-radius: 8px; text-align: center;">
                    <div style="color: #94a3b8; font-size: 0.875rem;">Error Rate</div>
                    <div style="font-size: 1.5rem; font-weight: 600; color: ${slo.results.errorRate.passed ? '#10b981' : '#ef4444'};">
                        ${(slo.results.errorRate.actual * 100).toFixed(2)}%
                    </div>
                    <div style="color: #64748b; font-size: 0.75rem;">target: <${(slo.results.errorRate.target * 100).toFixed(2)}%</div>
                </div>
            </div>
            
            <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="font-weight: 600;">Error Budget</span>
                    <span style="color: ${budgetColor}; font-weight: 600;">${eb.percentUsed.toFixed(1)}% used</span>
                </div>
                <div style="background: #334155; border-radius: 8px; height: 12px; overflow: hidden;">
                    <div style="background: ${budgetColor}; height: 100%; width: ${budgetWidth}%; transition: width 0.3s;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; color: #94a3b8; font-size: 0.875rem;">
                    <span>${eb.errorBudgetRemaining} remaining of ${eb.errorBudgetTotal}</span>
                    <span>${eb.summary}</span>
                </div>
            </div>
            
            <div style="margin-top: 1rem; padding: 1rem; background: ${slo.allPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border-radius: 8px; text-align: center;">
                <span style="font-size: 1.25rem; font-weight: 600; color: ${slo.allPassed ? '#10b981' : '#ef4444'};">
                    ${slo.allPassed ? '✓ All SLOs Passed' : '✗ SLO Violations Detected'}
                </span>
            </div>
        </div>
    `;
}

/**
 * Generate JSON summary
 */
export function generateJsonSummary(data) {
    const metrics = data.metrics || {};

    return {
        timestamp: new Date().toISOString(),
        summary: {
            totalRequests: metrics.http_reqs?.values?.count || 0,
            requestRate: metrics.http_reqs?.values?.rate || 0,
            errorRate: (metrics.http_req_failed?.values?.rate || 0) * 100,
            checksPassed: (metrics.checks?.values?.rate || 0) * 100
        },
        responseTime: {
            avg: metrics.http_req_duration?.values?.avg || 0,
            min: metrics.http_req_duration?.values?.min || 0,
            max: metrics.http_req_duration?.values?.max || 0,
            p90: metrics.http_req_duration?.values?.['p(90)'] || 0,
            p95: metrics.http_req_duration?.values?.['p(95)'] || 0,
            p99: metrics.http_req_duration?.values?.['p(99)'] || 0
        },
        thresholds: data.thresholds || {}
    };
}

export default {
    generateHtmlReport,
    generateJsonSummary
};
