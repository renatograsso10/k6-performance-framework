/**
 * Test data generators
 */

const names = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Edward', 'Fiona'];
const jobs = ['Developer', 'Designer', 'Manager', 'Analyst', 'Engineer', 'Architect'];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export const testData = {
    user() {
        return {
            name: randomItem(names),
            job: randomItem(jobs)
        };
    },

    userUpdate() {
        return {
            name: `Updated ${randomItem(names)}`,
            job: `Senior ${randomItem(jobs)}`
        };
    },

    validUserId() {
        return Math.floor(Math.random() * 12) + 1;
    },

    validResourceId() {
        return Math.floor(Math.random() * 12) + 1;
    },

    invalidId() {
        return 9999;
    },

    email() {
        const timestamp = Date.now();
        return `test.${timestamp}@example.com`;
    },

    password() {
        return 'TestPassword123!';
    }
};

export default testData;
