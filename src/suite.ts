/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import { Spec } from './spec.js';
import { Topic } from './topic.js';
import { TestResult } from './test.js';

interface SuiteQueryParams {
  [index:string]: string | void;
  testrunner_suite_address?: string;
  testrunner_isolated?: void;
}

export interface SuiteAddress {
  spec: number;
  topic: number[];
  test: number;
}

const cloneableResult = (result: TestResult): TestResult => {
  if (result.error instanceof Error) {
    return {
      ...result,
      error: {
        stack: result.error.stack
      }
    };
  }

  return result;
};

export class Suite {
  private specs: Spec[];
  private address: SuiteAddress | null;

  readonly isIsolated: boolean;

  constructor(specs: Spec[] = []) {
    this.specs = specs;

    const queryParams: SuiteQueryParams = {};
    if (window.location != null && window.location.search != null) {
      window.location.search.slice(1).split('&').reduce((map, part) => {
        const parts = part.split('=');
        map[parts[0]] = decodeURIComponent(parts[1]);
        return map;
      }, queryParams);
    };

    this.address = queryParams.testrunner_suite_address
        ? JSON.parse(queryParams.testrunner_suite_address) as SuiteAddress
        : null;

    this.isIsolated = 'testrunner_isolated' in queryParams;
  }

  async run() {
    if (this.address) {
      await this.testRun(this.address);
    } else {
      for (let i = 0; i < this.specs.length; ++i) {
        const spec = this.specs[i];

        console.log(`%c ${spec.rootTopic!.description} `,
            `background-color: #bef; color: #246;
            font-weight: bold; font-size: 24px;`);

        await this.topicRun(spec.rootTopic!, i);
      }
    }
  }

  private async topicRun(topic: Topic,
      specIndex: number,
      topicAddress: number[] = []) {
    for (let i = 0; i < topic.tests.length; ++i) {
      await this.testRun({ spec: specIndex, topic: topicAddress, test: i });
    }

    for (let i = 0; i < topic.topics.length; ++i) {
      topicAddress.push(i);
      await this.topicRun(topic.topics[i], specIndex, topicAddress);
      topicAddress.pop();
    }
  }

  private async testRun(address: SuiteAddress) {
    const spec = this.specs[address.spec];
    const test = spec.getTestByAddress(address);

    if (test == null) {
      throw new Error('No test found!');
    }

    if (!(test!.isolated) || this.isIsolated) {
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

      window.top.postMessage(cloneableResult(result), window.location.origin);
    } else {
      await this.isolatedTestRun(address);
    }
  }

  private async isolatedTestRun(address: SuiteAddress) {
    await new Promise(resolve => {
      const url = new URL(window.location.toString());
      const iframe = document.createElement('iframe');
      const receiveMessage = (event: Event) => {
        if ((event as MessageEvent).source !== iframe.contentWindow) {
          return;
        }

        const result = (event as MessageEvent).data;
        document.body.removeChild(iframe);
        iframe.removeEventListener('message', receiveMessage);
        resolve(result);
      };

      iframe.style.position = 'absolute';
      iframe.style.top = '-1000px';
      iframe.style.left = '-1000px';

      window.addEventListener('message', receiveMessage);

      const searchPrefix = url.search ? `${url.search}&` : '?';
      const uriAddress = encodeURIComponent(JSON.stringify(address));
      url.search =
          `${searchPrefix}testrunner_suite_address=${uriAddress}&testrunner_isolated`;

      document.body.appendChild(iframe);
      iframe.src = url.toString();
    });
  }
}
