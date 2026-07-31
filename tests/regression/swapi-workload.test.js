import { check } from 'k6';
import {
    SWAPI_RESOURCE_NAMES,
    getSwapiResource,
    listSwapiResource,
    randomValidId,
    searchSwapiResource,
    swapiCatalog
} from '../../src/workloads/swapi.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        checks: ['rate==1'],
        http_req_failed: ['rate==0']
    }
};

export default function () {
    check(swapiCatalog, {
        'catalog contains supported SWAPI resources': () => SWAPI_RESOURCE_NAMES.join(',') === 'people,planets,starships,films',
        'starship catalog excludes nonexistent ids': (catalog) => [1, 4, 6, 7, 8]
            .every((id) => !catalog.starships.validIds.includes(id))
    });

    for (const resource of SWAPI_RESOURCE_NAMES) {
        const listResponse = listSwapiResource(resource);
        check(listResponse, { [`${resource} list is valid`]: (response) => response.status === 200 });
        const searchResponse = searchSwapiResource(resource, 'fixture result');
        check(searchResponse, { [`${resource} search is valid`]: (response) => response.status === 200 });

        for (const id of swapiCatalog[resource].validIds) {
            const response = getSwapiResource(resource, id);
            check(response, { [`${resource}/${id} is valid`]: (result) => result.status === 200 });
        }

        for (let sample = 0; sample < 100; sample += 1) {
            check(randomValidId(resource), {
                [`${resource} random id comes from catalog`]: (id) => swapiCatalog[resource].validIds.includes(id)
            });
        }
    }
}
