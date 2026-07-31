/**
 * HTML Report Generator
 * Creates beautiful, detailed HTML reports from K6 test results
 */

function thresholdPresentation(status) {
    if (status === 'passed') return { color: '#10b981', cssClass: 'trend-good', label: 'PASSED', symbol: 'PASS' };
    if (status === 'failed') return { color: '#ef4444', cssClass: 'trend-bad', label: 'FAILED', symbol: 'FAIL' };
    return { color: '#94a3b8', cssClass: '', label: 'NOT EVALUATED', symbol: 'N/A' };
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
export function renderHtmlReport(model) {
    const testType = escapeHtml(model.context.testType);
    const apiTarget = escapeHtml(model.context.targetUrl);
    const targetKind = escapeHtml(model.context.targetKind);
    const runId = escapeHtml(model.context.runId);
    const timestamp = escapeHtml(model.timestamp);
    const totalRequests = model.summary.totalRequests;
    const requestRate = model.summary.requestRate.toFixed(2);
    const avgDuration = model.responseTime.avg.toFixed(2);
    const p90Duration = model.responseTime.p90.toFixed(2);
    const p95Duration = model.responseTime.p95.toFixed(2);
    const p99Duration = model.responseTime.p99.toFixed(2);
    const minDuration = model.responseTime.min.toFixed(2);
    const maxDuration = model.responseTime.max.toFixed(2);
    const errorRate = model.summary.errorRate.toFixed(2);
    const checksPass = model.summary.checksPassed.toFixed(2);
    const result = model.result;
    const durationThreshold = model.thresholdStatus.duration;
    const errorThreshold = model.thresholdStatus.errors;
    const checksThreshold = model.thresholdStatus.checks;
    const durationPresentation = thresholdPresentation(durationThreshold);
    const errorPresentation = thresholdPresentation(errorThreshold);
    const checksPresentation = thresholdPresentation(checksThreshold);
    const statusColor = result.status === 'passed'
        ? '#10b981'
        : result.status === 'failed' ? '#ef4444' : '#f59e0b';
    const statusText = result.status === 'no_data'
        ? 'NO DATA'
        : result.status.toUpperCase();

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
            <div class="status-badge" data-test-status="${result.status}">${statusText}</div>
        </header>
        
        <div class="meta-info">
            <span>📅 Generated: ${timestamp}</span>
            <span>⏱️ Test Type: ${testType}</span>
            <span>🎯 Target: ${apiTarget}</span>
            <span>Target kind: ${targetKind}</span>
            <span>Run ID: ${runId}</span>
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
            
            <div class="kpi-card" data-metric="http_req_duration" data-threshold-status="${durationThreshold}">
                <div class="kpi-header">
                    <span class="kpi-title">Response Time (p95)</span>
                    <div class="kpi-icon" style="color: ${durationPresentation.color};">⚡</div>
                </div>
                <div class="kpi-value">${p95Duration}<span class="kpi-unit">ms</span></div>
                <div class="kpi-trend ${durationPresentation.cssClass}">
                    Threshold: ${durationPresentation.label}
                </div>
            </div>
            
            <div class="kpi-card" data-metric="http_req_failed" data-threshold-status="${errorThreshold}">
                <div class="kpi-header">
                    <span class="kpi-title">Error Rate</span>
                    <div class="kpi-icon" style="color: ${errorPresentation.color};">🚨</div>
                </div>
                <div class="kpi-value" style="color: ${errorPresentation.color}">${errorRate}<span class="kpi-unit">%</span></div>
                <div class="metric-bar">
                    <div class="metric-bar-fill" style="width: ${Math.min(errorRate, 100)}%; background: ${errorPresentation.color};"></div>
                </div>
            </div>
            
            <div class="kpi-card" data-metric="checks" data-threshold-status="${checksThreshold}">
                <div class="kpi-header">
                    <span class="kpi-title">Checks Passed</span>
                    <div class="kpi-icon" style="color: ${checksPresentation.color};">✅</div>
                </div>
                <div class="kpi-value" style="color: ${checksPresentation.color}">${checksPass}<span class="kpi-unit">%</span></div>
                <div class="metric-bar">
                    <div class="metric-bar-fill" style="width: ${checksPass}%; background: ${checksPresentation.color};"></div>
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
                        <td><span class="${durationPresentation.cssClass}">${durationPresentation.symbol}</span></td>
                    </tr>
                    <tr>
                        <td>Average</td>
                        <td>${avgDuration} ms</td>
                        <td><span class="${durationPresentation.cssClass}">${durationPresentation.symbol}</span></td>
                    </tr>
                    <tr>
                        <td>p(90)</td>
                        <td>${p90Duration} ms</td>
                        <td><span class="${durationPresentation.cssClass}">${durationPresentation.symbol}</span></td>
                    </tr>
                    <tr>
                        <td>p(95)</td>
                        <td>${p95Duration} ms</td>
                        <td><span class="${durationPresentation.cssClass}">${durationPresentation.symbol}</span></td>
                    </tr>
                    <tr>
                        <td>p(99)</td>
                        <td>${p99Duration} ms</td>
                        <td><span class="${durationPresentation.cssClass}">${durationPresentation.symbol}</span></td>
                    </tr>
                    <tr>
                        <td>Maximum</td>
                        <td>${maxDuration} ms</td>
                        <td><span class="${durationPresentation.cssClass}">${durationPresentation.symbol}</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
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
                    <tr><td>Total Iterations</td><td>${model.operations.iterations}</td></tr>
                    <tr><td>Data Received</td><td>${(model.operations.dataReceivedBytes / 1024).toFixed(2)} KB</td></tr>
                    <tr><td>Data Sent</td><td>${(model.operations.dataSentBytes / 1024).toFixed(2)} KB</td></tr>
                </tbody>
            </table>
        </div>
        
        <footer class="footer">
            <p>Generated by <a href="https://k6.io">K6 Performance Framework</a> | ${new Date(model.timestamp).toLocaleDateString()}</p>
        </footer>
    </div>
</body>
</html>`;
}
