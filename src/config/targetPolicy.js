const PUBLIC_SWAPI_HOSTS = new Set(['swapi.info', 'www.swapi.info']);

function targetHostname(baseUrl) {
    const target = /^https?:\/\/(?:[^@/?#]+@)?([^/:?#]+)(?::\d+)?(?:[/?#]|$)/i.exec(baseUrl);
    if (!target) {
        throw new Error(`Invalid BASE_URL: ${baseUrl}`);
    }
    return target[1].toLowerCase().replace(/\.$/, '');
}

export function isPublicSwapiTarget(baseUrl) {
    return PUBLIC_SWAPI_HOSTS.has(targetHostname(baseUrl));
}

export function assertTargetAllowed(profile, baseUrl, maxRetries = 0) {
    const isPublicSwapi = isPublicSwapiTarget(baseUrl);
    if (isPublicSwapi && profile !== 'external-smoke') {
        throw new Error(
            `${profile} cannot run against public swapi.info; configure a controlled BASE_URL. `
            + 'Only external-smoke may use the public service.'
        );
    }
    if (isPublicSwapi && maxRetries !== 0) {
        throw new Error('Public swapi.info runs must set MAX_RETRIES=0');
    }

    return true;
}
