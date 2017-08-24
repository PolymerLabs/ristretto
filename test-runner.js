const timePasses = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

const timeLimit = ms => timePasses(ms)
    .then(() => Promise.reject(new Error(`Time ran out after ${ms}ms`)));

const spec = () => {

  let topics = [];
  let node = null;

  const it = (description, implementation, timeout = 10000) => {
    const run = async () => Promise.race([implementation(), timeLimit(timeout)]);
    node.tests.push({ description, run });
  };

  const describe = (topic, testsFactory) => {
    const nextNode = { topic, tests: [], topics: [] };
    const currentNode = node;

    node = nextNode;

    try {
      testsFactory();
    } catch (error) {
      console.error(`Error invoking topic "${topic}"`);
      console.error(error);
    }

    node = currentNode;

    if (node != null) {
      node.topics.push(nextNode);
    } else {
      print(nextNode);
    }
  };

  return { describe, it };
}

const print = async ({ topic, tests, topics }) => {
  console.group(topic);
  for (let i = 0; i < tests.length; ++i) {
    const { description, run } = tests[i];

    try {
      console.log(`"${description}"`);
      await run();
    } catch (error) {
      console.error(error);
    }
  }

  for (let i = 0; i < topics.length; ++i) {
    await print(topics[i]);
  }

  console.groupEnd(topic);
};

export { spec };
