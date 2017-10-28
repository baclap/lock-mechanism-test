const redis = require('redis').createClient({ host: 'redis' });
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

console.log('Redis test running...');

let start;
let end;

let testDb;
let locks;

let totalRequest = 0;
let totalUnlocks = 0;
let totalSkips = 0;

function executeRedisTest() {
    setTimeout(() => {
        if (keys.length === 0) {
            console.log('####################');
            console.log(
                'Redis: totalRequest:', totalRequest,
                ', totalUnlocks:', totalUnlocks,
                ', totalSkips:', totalSkips,
                ', time:', end - start
            );
            console.log('####################');
            process.exit(0);
        }
    }, TEST_TIMEOUT);

    setTimeout(executeRedisTest, 1);

    while(keys.length) {
        const key = keys.shift();
        if (key || key === 0) {
            const lockId = uuid();
            redis.set(key, lockId, 'NX', 'PX', LOCK_TTL, (err, res) => {
                if (err) {
                    console.log('Set Fatal:', err);
                    return process.exit(1);
                }
                if (res === 'OK') {
                    totalRequest += 1;
                    // console.log('fake request', key, lockId);
                    setTimeout(() => {
                        totalUnlocks += 1;
                        // console.log('unlock', key, lockId);
                        end = Date.now();
                        redis.get(key, (err, val) => {
                            if (err) {
                                console.log('Get Fatal:', err);
                                return process.exit(1);
                            }
                            if (val === lockId) {
                                redis.del(key);
                            } else {
                                console.log('WTF');
                                process.exit(1);
                            }
                        });
                    }, REQUEST_TIMEOUT);
                } else {
                    totalSkips += 1;
                    // console.log('skipping', key, lockId);
                    return keys.push(key);
                }
            });
        }
    }
}

start = Date.now();
executeRedisTest();
