const timePasses = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

const timeLimit = ms => timePasses(ms)
    .then(() => Promise.reject(new Error(`Time ran out after ${ms}ms`)));

const spec = topicsFactory => {

  let topics = [];
  let node = { topic: 'Spec', tests: [], topics: [] };

  const it = (description, implementation, timeout = 10000) => {
    const run = async () => Promise.race([implementation(), timeLimit(timeout)]);
    node.tests.push({ description, run });
  };

  const describe = (topic, testsFactory) => {
    const nextNode = { topic, tests: [], topics: [] };
    const currentNode = node;

    node.topics.push(nextNode);
    node = nextNode;

    try {
      testsFactory();
    } catch (error) {
      console.error(`Error invoking topic "${topic}"`);
      console.error(error);
    }

    node = currentNode;
  };

  topicsFactory({ describe, it });

  print(node);
}

const print = async ({ topic, tests, topics }) => {
  console.group(topic);
  for (let i = 0; i < tests.length; ++i) {
    const { description, run } = tests[i];

    try {
      console.log(`"${description}" running...`);
      await run();
      console.log('PASSED!');
    } catch (error) {
      console.error('FAILED!');
      console.error(error);
    }
  }

  for (let i = 0; i < topics.length; ++i) {
    await print(topics[i]);
  }

  console.groupEnd(topic);
};

export { spec };
