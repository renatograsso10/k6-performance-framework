/**
 * Tags for filtering and analyzing test results
 */

export const TagCategories = {
    TEST_TYPE: {
        SMOKE: 'smoke', LOAD: 'load', STRESS: 'stress',
        SPIKE: 'spike', SOAK: 'soak', ENDURANCE: 'endurance', BREAKPOINT: 'breakpoint'
    },
    ENDPOINT: { USERS: 'users', AUTH: 'auth', RESOURCES: 'resources' },
    OPERATION: { READ: 'read', WRITE: 'write', UPDATE: 'update', DELETE: 'delete' },
    PRIORITY: { CRITICAL: 'critical', HIGH: 'high', STANDARD: 'standard', LOW: 'low' }
};

export function createTags(endpoint, operation = 'read', priority = 'standard', extra = {}) {
    return { endpoint, operation, priority, ...extra };
}

export const usersTags = {
    list: createTags('users', 'read', 'standard'),
    get: createTags('users', 'read', 'standard'),
    create: createTags('users', 'write', 'high'),
    update: createTags('users', 'update', 'high'),
    delete: createTags('users', 'delete', 'high')
};

export const authTags = {
    login: createTags('auth', 'write', 'critical'),
    register: createTags('auth', 'write', 'critical'),
    logout: createTags('auth', 'write', 'high')
};

export const resourcesTags = {
    list: createTags('resources', 'read', 'standard'),
    get: createTags('resources', 'read', 'standard')
};

export function getTestTags(testType) {
    return { testType, framework: 'k6-performance-framework' };
}

export function mergeTags(...tagObjects) {
    return Object.assign({}, ...tagObjects);
}

export default { TagCategories, createTags, usersTags, authTags, resourcesTags, getTestTags, mergeTags };
