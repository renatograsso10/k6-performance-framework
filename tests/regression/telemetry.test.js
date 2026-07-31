import { check } from 'k6';
import { HttpClient } from '../../src/core/httpClient.js';
import { getHttpLogLevel, getHttpLogSampleRate, getRunId, getTargetKind, shouldLogHttp } from '../../src/core/telemetry.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        checks: ['rate==1'],
        'http_reqs{run_id:contract-run,target_kind:fixture,type:health}': ['count==1'],
        'success_rate{run_id:contract-run,target_kind:fixture,endpoint:health}': ['rate==1']
    }
};

export default function () {
    const response = new HttpClient().get('/health', { endpointType: 'health' });

    check(response, {
        'run id is stable and explicit': () => getRunId() === 'contract-run',
        'fixture launcher identifies the target kind': () => getTargetKind() === 'fixture',
        'successful HTTP logs are disabled by default': () => getHttpLogSampleRate() === 0
            && shouldLogHttp(200, 0) === false,
        'HTTP errors are always logged': () => shouldLogHttp(500, 1) === true,
        'network failures are error-level and never sampled out': () => shouldLogHttp(0, 1) === true
            && getHttpLogLevel(0) === 'ERROR',
        'request remains successful': (result) => result.status === 200
    });
}
