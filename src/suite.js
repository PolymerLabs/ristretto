const $specs = Symbol('specs');
const $isolatedTestRun = Symbol('isolatedTestRun');
const $address = Symbol('address');
const $runTopic = Symbol('runTopic');

class Suite {
  constructor(specs) {
    this[$specs] = specs;

    const queryParams = window.location &&
        window.location.search &&
        window.location.search.slice(1).split('&').reduce((map, part) => {
          const parts = part.split('=');
          map[parts[0]] = decodeURIComponent(parts[1]);
          return map;
        }, {});

    this[$address] = queryParams.address
        ? JSON.parse(queryParams.address)
        : null;
  }

  async run() {
    if (this[$address]) {
      const spec = this[$specs][this[$address].spec];
      const test = spec.getTestByAddress(this[$address]);
      const result = await test.run();

      const resultString = result.passed ? ' PASSED ' : ' FAILED ';
      const resultColor = result.passed ? 'green' : 'red';

      console.log(`${test.behaviorText}... %c${resultString}`,
          `color: #fff; font-weight: bold; background-color: ${resultColor}`);

      window.top.postMessage(result, window.location.origin);
    } else {
      for (let i = 0; i < this[$specs].length; ++i) {
        const spec = this[$specs][i];

        console.log(`%c ${spec.rootTopic.description} `,
            `background-color: #bef; color: #246; font-weight: bold; font-size: 18px;`);

        await this[$runTopic](this[$specs][i].rootTopic, i);
      }
    }
  }

  async [$runTopic](topic, specIndex, topicAddress = []) {
    for (let i = 0; i < topic.tests.length; ++i) {
      await this[$isolatedTestRun]({ spec: specIndex, topic: topicAddress, test: i });
    }

    for (let i = 0; i < topic.topics.length; ++i) {
      topicAddress.push(i);
      await this[$runTopic](topic.topics[i], specIndex, topicAddress);
      topicAddress.pop();
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
      url.search = `${searchPrefix}address=${encodeURIComponent(JSON.stringify(address))}`;

      document.body.appendChild(iframe);
      iframe.src = url.toString();
    });
  }
}

export { Suite };
