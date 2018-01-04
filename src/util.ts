const timePasses = (ms: number): Promise<void> => new Promise(
    resolve => setTimeout(() => {
      resolve();
    }, ms));

const timeLimit = (ms: number): Promise<void> => timePasses(ms)
    .then(() => Promise.reject(new Error(`Time ran out after ${ms}ms`)));

export { timePasses, timeLimit };
