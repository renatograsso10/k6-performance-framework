/**
 * Logger with structured JSON output and stable run IDs
 */

import { getHttpLogLevel, getRunId, shouldLogHttp } from './telemetry.js';

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

function getLogLevel() {
    try {
        const level = (typeof __ENV !== 'undefined' && __ENV.LOG_LEVEL) ? __ENV.LOG_LEVEL : 'INFO';
        return LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
    } catch { return LOG_LEVELS.INFO; }
}

function formatLog(level, message, data = {}) {
    const vu = (typeof __VU !== 'undefined') ? __VU : 0;
    const iter = (typeof __ITER !== 'undefined') ? __ITER : 0;

    return JSON.stringify({
        timestamp: new Date().toISOString(),
        runId: getRunId(),
        level,
        vu,
        iteration: iter,
        message,
        ...data
    });
}

function shouldLog(level) {
    return LOG_LEVELS[level] >= getLogLevel();
}

export const logger = {
    debug: (msg, data) => shouldLog('DEBUG') && console.log(formatLog('DEBUG', msg, data)),
    info: (msg, data) => shouldLog('INFO') && console.log(formatLog('INFO', msg, data)),
    warn: (msg, data) => shouldLog('WARN') && console.warn(formatLog('WARN', msg, data)),
    error: (msg, data) => shouldLog('ERROR') && console.error(formatLog('ERROR', msg, data)),

    http: (method, url, status, duration) => {
        if (!shouldLogHttp(status)) return;
        const level = getHttpLogLevel(status);
        const msg = `${method} ${url} -> ${status}`;
        if (!shouldLog(level)) return;
        const formatted = formatLog(level, msg, { type: 'http', method, url, status, duration });
        if (level === 'ERROR') console.error(formatted);
        else console.log(formatted);
    },

    child: (context) => ({
        debug: (msg, data) => logger.debug(msg, { ...context, ...data }),
        info: (msg, data) => logger.info(msg, { ...context, ...data }),
        warn: (msg, data) => logger.warn(msg, { ...context, ...data }),
        error: (msg, data) => logger.error(msg, { ...context, ...data })
    }),

    runId: getRunId
};
