module.exports = {
    REQUEST_TIMEOUT: 5000, // fake request take N ms to "respond"
    LOCK_TTL: 10000, // inserted lock gets N ms TTL
    TEST_TIMEOUT: 30000, // kill the test process after N ms and print results
    KEYS_LENGTH: 20000 // size of keys array to test
};
