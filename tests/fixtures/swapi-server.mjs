import http from 'node:http';

const collections = new Set(['people', 'planets', 'starships', 'films']);
const validIds = {
    people: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    planets: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    starships: new Set([2, 3, 5, 9, 10]),
    films: new Set([1, 2, 3, 4, 5, 6])
};

function json(response, status, payload) {
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(payload));
}

export function createSwapiFixture() {
    let unstableRequests = 0;
    return http.createServer((request, response) => {
        const url = new URL(request.url, 'http://fixture.local');

        if (request.method !== 'GET') {
            json(response, 405, { detail: 'Method not allowed' });
            return;
        }

        if (url.pathname === '/health') {
            json(response, 200, { status: 'ok' });
            return;
        }

        if (url.pathname === '/unstable') {
            unstableRequests += 1;
            const failures = Number(url.searchParams.get('failures') || 0);
            if (unstableRequests <= failures) {
                json(response, 500, { detail: 'Transient fixture failure' });
                return;
            }
            json(response, 200, { status: 'recovered', attempts: unstableRequests });
            return;
        }

        const match = url.pathname.match(/^\/api\/(people|planets|starships|films)\/?(\d+)?\/?$/);
        if (!match || !collections.has(match[1])) {
            json(response, 404, { detail: 'Not found' });
            return;
        }

        const [, resource, id] = match;
        if (id) {
            if (!validIds[resource].has(Number(id))) {
                json(response, 404, { detail: 'Not found' });
                return;
            }
            json(response, 200, { name: `${resource}-${id}`, url: `/api/${resource}/${id}/` });
            return;
        }

        json(response, 200, {
            count: 10,
            next: null,
            previous: null,
            results: [{ name: `${resource}-1`, url: `/api/${resource}/1/` }]
        });
    });
}
