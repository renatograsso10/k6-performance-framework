/**
 * Utility helpers for K6 tests
 */

import { sleep } from 'k6';

export function thinkTime(min = 1, max = 3) {
    sleep(Math.random() * (max - min) + min);
}

export function wait(seconds = 1) {
    sleep(seconds);
}

export function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(ms) {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
}

export function timestamp() {
    return new Date().toISOString();
}

export function retry(fn, maxRetries = 3, baseDelay = 1) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return fn();
        } catch (error) {
            lastError = error;
            sleep(baseDelay * Math.pow(2, i));
        }
    }
    throw lastError;
}

export function withTimeout(fn, timeoutMs = 5000) {
    const startTime = Date.now();
    const result = fn();
    if (Date.now() - startTime > timeoutMs) {
        console.warn(`Timeout exceeded: ${Date.now() - startTime}ms`);
    }
    return result;
}

export function timedGroup(name, fn) {
    const startTime = Date.now();
    const result = fn();
    const duration = Date.now() - startTime;
    return { name, result, duration, formattedDuration: formatDuration(duration) };
}

export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

export default {
    thinkTime, wait, formatBytes, formatDuration, timestamp,
    retry, withTimeout, timedGroup, shuffle, randomItem
};
