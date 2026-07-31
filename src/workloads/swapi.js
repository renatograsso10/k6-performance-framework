import { check } from 'k6';
import { HttpClient } from '../core/httpClient.js';

const client = new HttpClient();

export const swapiCatalog = Object.freeze({
    people: Object.freeze({ validIds: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) }),
    planets: Object.freeze({ validIds: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) }),
    starships: Object.freeze({ validIds: Object.freeze([2, 3, 5, 9, 10]) }),
    films: Object.freeze({ validIds: Object.freeze([1, 2, 3, 4, 5, 6]) })
});

export const SWAPI_RESOURCE_NAMES = Object.freeze(Object.keys(swapiCatalog));

function requireResource(resource) {
    if (!swapiCatalog[resource]) throw new Error(`Unsupported SWAPI resource: ${resource}`);
    return resource;
}

export function randomSwapiResource(resources = SWAPI_RESOURCE_NAMES) {
    return resources[Math.floor(Math.random() * resources.length)];
}

export function randomValidId(resource) {
    const validIds = swapiCatalog[resource]?.validIds;
    if (!validIds) throw new Error(`Unsupported SWAPI resource: ${resource}`);
    return validIds[Math.floor(Math.random() * validIds.length)];
}

export function listSwapiResource(resource, page = 1) {
    const name = requireResource(resource);
    return client.get(`/api/${name}/?page=${page}`, { endpointType: name });
}

export function getSwapiResource(resource, id = randomValidId(resource)) {
    if (!swapiCatalog[resource]?.validIds.includes(id)) {
        throw new Error(`Invalid ${resource} id: ${id}`);
    }
    return client.get(`/api/${resource}/${id}/`, { endpointType: resource });
}

export function searchSwapiResource(resource, term) {
    const name = requireResource(resource);
    return client.get(`/api/${name}/?search=${encodeURIComponent(term)}`, { endpointType: name });
}

export function checkSwapiResponse(response, operation) {
    return check(response, { [`${operation} ok`]: (result) => result.status === 200 });
}
