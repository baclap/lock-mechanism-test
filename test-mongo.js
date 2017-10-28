const MongoClient = require('mongodb').MongoClient;
const uuid = require('uuid/v4');
const moment = require('moment');
const {
    REQUEST_TIMEOUT,
    LOCK_TTL,
    TEST_TIMEOUT,
    KEYS_LENGTH
} = require('./config');
const keys = require('./keys').slice(0, KEYS_LENGTH);
const originalLength = keys.length;

console.log('Mongo test running...');

let start;
let end;

let testDb;
let locks;

let totalRequest = 0;
let totalUnlocks = 0;
let totalSkips = 0;

function executeMongoTest() {
    setTimeout(() => {
        if (keys.length === 0) {
            console.log('####################');
            console.log(
                'Mongo: totalRequest:', totalRequest,
                ', totalUnlocks:', totalUnlocks,
                ', totalSkips:', totalSkips,
                ', time (ms):', end - start
            );
            console.log('####################');
            process.exit(0);
        }
    }, TEST_TIMEOUT);

    setTimeout(executeMongoTest, 1);

    while(keys.length) {
        const key = keys.shift();
        if (key || key === 0) {
            const lockId = uuid();
            locks.insert({
                key,
                lockId,
                expireAt: moment().add(LOCK_TTL, 'ms').toDate()
            })
            .then(() => {
                totalRequest += 1;
                // console.log('fake request', key, lockId);
                setTimeout(() => {
                    totalUnlocks += 1;
                    // console.log('unlock', key, lockId);
                    end = Date.now();
                    locks.remove({ key, lockId });
                }, REQUEST_TIMEOUT);
            })
            .catch((err) => {
                if (err.code === 11000) {
                    totalSkips += 1;
                    // console.log('skipping', key, lockId);
                    return keys.push(key);
                }
                console.log('Fatal:', err);
                process.exit(1);
            })
        }
    }
}

MongoClient.connect('mongodb://mongo:27017/test')
.then((db) => {
    testDb = db;
    locks = testDb.collection('locks');
    return locks.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
})
.then(() => locks.createIndex({ key: 1 }, { unique: true }))
.then(() => {
    start = Date.now();
})
.then(executeMongoTest)
.catch((err) => {
    console.error('M Fail:', err);
    process.exit(1);
});
