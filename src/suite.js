const $specs = Symbol('specs');
const $isolatedTestRun = Symbol('isolatedTestRun');
const $address = Symbol('address');
const $topicRun = Symbol('topicRun');
const $testRun = Symbol('testRun');
const $isIsolated = Symbol('isIsolated');

class Suite {
  constructor(specs) {
    this[$specs] = specs;

    const queryParams = window.location &&
        window.location.search &&
        window.location.search.slice(1).split('&').reduce((map, part) => {
          const parts = part.split('=');
          map[parts[0]] = decodeURIComponent(parts[1]);
          return map;
        }, {}) || {};

    this[$address] = queryParams.testrunner_address
        ? JSON.parse(queryParams.testrunner_address)
        : null;

    this[$isIsolated] = 'testrunner_isolated' in queryParams;
  }

  async run() {
    if (this[$address]) {
      await this[$testRun](this[$address]);
    } else {
      for (let i = 0; i < this[$specs].length; ++i) {
        const spec = this[$specs][i];

        console.log(`%c ${spec.rootTopic.description} `,
            `background-color: #bef; color: #246;
            font-weight: bold; font-size: 24px;`);

        await this[$topicRun](this[$specs][i].rootTopic, i);
      }
    }
  }

  async [$topicRun](topic, specIndex, topicAddress = []) {
    for (let i = 0; i < topic.tests.length; ++i) {
      await this[$testRun]({ spec: specIndex, topic: topicAddress, test: i });
    }

    for (let i = 0; i < topic.topics.length; ++i) {
      topicAddress.push(i);
      await this[$topicRun](topic.topics[i], specIndex, topicAddress);
      topicAddress.pop();
    }
  }

  async [$testRun](address) {
    const spec = this[$specs][address.spec];
    const test = spec.getTestByAddress(address);

    if (!test.isolated || this[$isIsolated]) {
      const result = await test.run();

      const resultString = result.passed ? ' PASSED ' : ' FAILED ';
      const resultColor = result.passed ? 'green' : 'red';

      const resultLog = [`${test.behaviorText}... %c${resultString}`,
          `color: #fff; font-weight: bold; background-color: ${resultColor}`];

      if (test.isolated) {
        resultLog[0] = `%c ISOLATED %c ${resultLog[0]}`;
        resultLog.splice(1, 0,
            `background-color: #fd0; font-weight: bold; color: #830`, ``);
      }

      console.log(...resultLog);

      window.top.postMessage(result, window.location.origin);
    } else {
      await this[$isolatedTestRun](address);
    }
  }

  async [$isolatedTestRun](address) {
    await new Promise(resolve => {
      const url = new URL(window.location.toString());
      const iframe = document.createElement('iframe');
      const receiveMessage = event => {
        if (event.source !== iframe.contentWindow) {
          return;
        }

        const result = event.data;
        document.body.removeChild(iframe);
        iframe.removeEventListener('message', receiveMessage);
        resolve(result);
      };

      iframe.style.position = 'absolute';
      iframe.style.top = '-1000px';
      iframe.style.left = '-1000px';

      window.addEventListener('message', receiveMessage);

      const searchPrefix = url.search ? `${url.search}&` : '?';
      url.search = `${searchPrefix}testrunner_address=${encodeURIComponent(JSON.stringify(address))}&testrunner_isolated`;

      document.body.appendChild(iframe);
      iframe.src = url.toString();
    });
  }
}

export { Suite };
