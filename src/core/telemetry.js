function runtimeEnv() {
    return typeof __ENV !== 'undefined' ? __ENV : {};
}

export function getRunId() {
    const runId = runtimeEnv().RUN_ID || 'local';
    if (!/^[A-Za-z0-9._:-]{1,100}$/.test(runId)) {
        throw new Error(`Invalid RUN_ID: ${runId}`);
    }
    return runId;
}

export function getTargetKind() {
    const targetKind = runtimeEnv().TARGET_KIND || 'unspecified';
    if (!/^[A-Za-z0-9._:-]{1,50}$/.test(targetKind)) {
        throw new Error(`Invalid TARGET_KIND: ${targetKind}`);
    }
    return targetKind;
}

export function getHttpLogSampleRate() {
    const configured = runtimeEnv().HTTP_LOG_SAMPLE_RATE ?? '0';
    const rate = Number(configured);
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
        throw new Error(`Invalid HTTP_LOG_SAMPLE_RATE: ${configured}`);
    }
    return rate;
}

export function getHttpLogLevel(status) {
    return status === 0 || status >= 400 ? 'ERROR' : 'INFO';
}

export function shouldLogHttp(status, sample = Math.random()) {
    return getHttpLogLevel(status) === 'ERROR' || sample < getHttpLogSampleRate();
}
