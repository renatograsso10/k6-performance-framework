/**
 * Performance thresholds by test type
 */

const smokeThresholds = {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.10'],
    'checks': ['rate>0.80'],
    'api_response_time': ['p(95)<2000']
};

const loadThresholds = {
    'http_req_duration': ['p(95)<3000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.05'],
    'checks': ['rate>0.90'],
    'api_response_time': ['p(95)<3000'],
    'api_errors': ['count<100']
};

const stressThresholds = {
    'http_req_duration': ['p(95)<5000', 'p(99)<10000'],
    'http_req_failed': ['rate<0.20'],
    'checks': ['rate>0.75'],
    'api_response_time': ['p(95)<5000'],
    'api_errors': ['count<500']
};

const spikeThresholds = {
    'http_req_duration': ['p(95)<8000', 'p(99)<15000'],
    'http_req_failed': ['rate<0.25'],
    'checks': ['rate>0.70'],
    'api_response_time': ['p(95)<8000'],
    'api_errors': ['count<1000']
};

const soakThresholds = {
    'http_req_duration': ['p(95)<3000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.05'],
    'checks': ['rate>0.90'],
    'api_response_time': ['p(95)<3000', 'avg<1500'],
    'api_errors': ['count<200']
};

const enduranceThresholds = {
    'http_req_duration': ['p(95)<4000', 'p(99)<8000'],
    'http_req_failed': ['rate<0.03'],
    'checks': ['rate>0.95'],
    'api_response_time': ['p(95)<4000', 'avg<2000'],
    'api_errors': ['count<500']
};

export const thresholds = {
    smoke: smokeThresholds,
    load: loadThresholds,
    stress: stressThresholds,
    spike: spikeThresholds,
    soak: soakThresholds,
    endurance: enduranceThresholds
};

export function getThresholds(type) {
    return thresholds[type] || thresholds.smoke;
}
