# Locking Data Store Test

Simulate using mongo and redis as a locking mechanism for request credentials in an effort to prove one as the more appropriate tool for the job.

Both the mongo and redis test consume a large array of "keys" with each key value appearing twice in the array. The test loops through the array and locks each specific key while a simulated request resolves. As keys are encountered that are currently locked they get pushed back onto the end of the queue until their key is unlocked. Final result of how long it takes to get through the entire array are printed to the console at the end.

Requirements:
- node
- docker

Instructions:
- `npm i`
- `docker-compose up`
