import { check } from 'k6';
import { options as externalOptions } from '../external-smoke.test.js';
import { getDefaultHeaders } from '../../src/config/environments.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: { checks: ['rate==1'] }
};

export default function () {
    const scenario = externalOptions.scenarios?.external_smoke;
    const abortThreshold = externalOptions.thresholds?.external_abort_rate?.[0];
    const userAgent = getDefaultHeaders()['User-Agent'];

    check({ scenario, abortThreshold, userAgent }, {
        'external smoke is capped at one request per second': (policy) => policy.scenario?.executor === 'constant-arrival-rate'
            && policy.scenario.rate === 1
            && policy.scenario.timeUnit === '1s',
        'external smoke uses one VU for sixty seconds': (policy) => policy.scenario?.duration === '60s'
            && policy.scenario.preAllocatedVUs === 1
            && policy.scenario.maxVUs === 1,
        'external smoke aborts on forbidden throttled or server responses': (policy) => policy.abortThreshold?.threshold === 'rate==0'
            && policy.abortThreshold.abortOnFail === true,
        'requests identify framework and repository': (policy) => policy.userAgent?.includes('k6-performance-framework')
            && policy.userAgent.includes('github.com/renatograsso10/k6-performance-framework')
    });
}
