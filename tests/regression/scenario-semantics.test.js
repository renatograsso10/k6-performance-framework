import { check } from 'k6';
import { options as loadOptions } from '../load.test.js';
import { BREAKPOINT_LEVELS, options as breakpointOptions } from '../breakpoint.test.js';
import { analyzeBreakpoint, createCheckpointSchedule } from '../../src/core/scenarioAnalysis.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: { checks: ['rate==1'] }
};

function threshold(ok) {
    return { values: {}, thresholds: { contract: { ok } } };
}

export default function () {
    const checkpoint = createCheckpointSchedule(15);
    const observed = [
        checkpoint.take(0),
        checkpoint.take(14.9),
        checkpoint.take(15),
        checkpoint.take(15.1),
        checkpoint.take(30)
    ];

    const syntheticSummary = { metrics: {} };
    for (const vus of [50, 100]) {
        const scenario = `vus_${String(vus).padStart(4, '0')}`;
        syntheticSummary.metrics[`http_req_duration{scenario:${scenario}}`] = threshold(true);
        syntheticSummary.metrics[`http_req_failed{scenario:${scenario}}`] = threshold(true);
        syntheticSummary.metrics[`checks{scenario:${scenario}}`] = threshold(true);
    }
    syntheticSummary.metrics['http_req_duration{scenario:vus_0200}'] = threshold(false);
    syntheticSummary.metrics['http_req_failed{scenario:vus_0200}'] = threshold(true);
    syntheticSummary.metrics['checks{scenario:vus_0200}'] = threshold(true);

    const analysis = analyzeBreakpoint(syntheticSummary, [50, 100, 200]);
    const incompleteAnalysis = analyzeBreakpoint({
        metrics: {
            'http_req_duration{scenario:vus_0100}': threshold(true),
            'http_req_failed{scenario:vus_0100}': threshold(true),
            'checks{scenario:vus_0100}': threshold(true)
        }
    }, [50, 100]);
    const scenarios = Object.values(breakpointOptions.scenarios);

    check({ observed, analysis, incompleteAnalysis, scenarios }, {
        'load controls request arrival rate': () => loadOptions.scenarios.load.executor === 'constant-arrival-rate'
            && loadOptions.scenarios.load.rate === 20
            && loadOptions.scenarios.load.timeUnit === '1s'
            && loadOptions.scenarios.load.duration === '10m'
            && !('stages' in loadOptions),
        'endurance checkpoints fire once per crossed interval': (result) => JSON.stringify(result.observed)
            === JSON.stringify([null, null, 15, null, 30]),
        'breakpoint stages are isolated and ordered': (result) => result.scenarios.length === BREAKPOINT_LEVELS.length
            && result.scenarios.every((scenario) => scenario.executor === 'constant-vus')
            && result.scenarios.every((scenario) => scenario.gracefulStop === '0s'),
        'breakpoint analysis reports last healthy stage': (result) => result.analysis.maxHealthyVus === 100
            && result.analysis.firstFailedVus === 200
            && result.analysis.stages[2].status === 'failed'
            && result.incompleteAnalysis.maxHealthyVus === null
    });
}
