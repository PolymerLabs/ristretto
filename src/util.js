const timePasses = ms => new Promise(resolve => {
  const timer = setTimeout(() => {
    resolve();
  }, ms);
});

const timeLimit = ms => timePasses(ms)
    .then(() => Promise.reject(new Error(`Time ran out after ${ms}ms`)));

export { timePasses, timeLimit };
