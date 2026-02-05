/**
 * Logger with structured JSON output and correlation IDs
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const sessionId = Math.random().toString(36).substring(2, 15);

function getLogLevel() {
    try {
        const level = (typeof __ENV !== 'undefined' && __ENV.LOG_LEVEL) ? __ENV.LOG_LEVEL : 'INFO';
        return LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
    } catch { return LOG_LEVELS.INFO; }
}

function generateCorrelationId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

function formatLog(level, message, data = {}) {
    const vu = (typeof __VU !== 'undefined') ? __VU : 0;
    const iter = (typeof __ITER !== 'undefined') ? __ITER : 0;

    return JSON.stringify({
        timestamp: new Date().toISOString(),
        sessionId,
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
        const level = status >= 400 ? 'ERROR' : 'INFO';
        const msg = `${method} ${url} -> ${status}`;
        if (shouldLog(level)) console.log(formatLog(level, msg, { type: 'http', method, url, status, duration }));
    },

    child: (context) => ({
        debug: (msg, data) => logger.debug(msg, { ...context, ...data }),
        info: (msg, data) => logger.info(msg, { ...context, ...data }),
        warn: (msg, data) => logger.warn(msg, { ...context, ...data }),
        error: (msg, data) => logger.error(msg, { ...context, ...data })
    }),

    correlationId: generateCorrelationId,
    sessionId: () => sessionId
};

export default logger;
