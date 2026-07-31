/**
 * Endurance Test - Long duration stability (2+ hours)
 */

import { group, sleep } from 'k6';
import { getThresholds } from '../src/config/thresholds.js';
import { logger } from '../src/core/logger.js';
import { checkpointCount } from '../src/core/metrics.js';
import { createRunProfile } from '../src/core/runProfile.js';
import { createCheckpointSchedule } from '../src/core/scenarioAnalysis.js';
import { checkSwapiResponse, getSwapiResource, randomSwapiResource } from '../src/workloads/swapi.js';

const enduranceDuration = (typeof __ENV !== 'undefined' && __ENV.ENDURANCE_DURATION)
    ? __ENV.ENDURANCE_DURATION : '2h';
const checkpointSchedule = createCheckpointSchedule(15);

const profile = createRunProfile({
    name: 'endurance',
    options: {
        stages: [
            { duration: '5m', target: 30 },
            { duration: enduranceDuration, target: 30 },
            { duration: '5m', target: 0 }
        ],
        thresholds: getThresholds('endurance')
    },
    metadata: { intent: 'validate multi-hour stability', workload: 'uniform SWAPI reads' }
});

export const options = profile.options;
export const setup = profile.setup;
export const teardown = profile.teardown;
export const handleSummary = profile.handleSummary;

export default function (data) {
    const elapsed = (Date.now() - data.startTime) / 1000 / 60;

    const checkpointMinute = checkpointSchedule.take(elapsed);
    if (checkpointMinute !== null) {
        checkpointCount.add(1, {
            checkpoint_minute: String(checkpointMinute),
            vu: String(__VU)
        });
        logger.info(`Checkpoint at ${checkpointMinute} minutes`, { vu: __VU });
    }

    const resource = randomSwapiResource();

    group('Endurance Operations', () => {
        const response = getSwapiResource(resource);
        checkSwapiResponse(response, `${resource}.get`);
    });

    sleep(0.5);
}
