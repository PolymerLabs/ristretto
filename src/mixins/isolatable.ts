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

import { Constructor } from '../util.js';
import { Spec } from '../spec.js';
import { Topic } from '../topic.js';
import { Test, TestRunContext, TestConfig, TestResult } from '../test.js';
import { SuiteAddress } from '../suite.js';

/**
 * IsolatedTest
 */
export interface IsolatedTestConfig extends TestConfig {
  isolated?: boolean;
}

export interface IsolatedTest {
  readonly isolated: boolean;
}


/**
 * An isolated test is one that runs in a "clean room" context. Currently, this
 * means running in an iframe in a browser. This is useful to help test authors
 * control for global state that persists across test runs (for example, custom
 * element registration).
 */
export function IsolatedTest<T extends Constructor<Test>>(TestImplementation: T) {
  return class extends TestImplementation {
    /**
     * True if the test is configured to be isolated.
     */
    get isolated(): boolean {
      return !!(this.config && this.config.isolated);
    }

    protected config: IsolatedTestConfig;

    protected async windUp(context: TestRunContext): Promise<TestRunContext> {
      const { suite } = context;
      const { queryParams } = suite;
      const isIsolated = 'testrunner_isolated' in queryParams;
      const shouldBeIsolated = !!this.config.isolated;

      context = await super.windUp(context);

      if (!shouldBeIsolated || isIsolated) {
        return context;
      }

      const address = suite.getAddressForTest(this);
      const implementation = async () => {
        const isolatedResult = await this.isolatedRun(address);

        if (!!isolatedResult.error) {
          throw isolatedResult.error;
        }
      };

      return {
        ...context,
        implementation
      };
    }

    protected async isolatedRun(address: SuiteAddress): Promise<TestResult> {
      return new Promise(resolve => {
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
            `${searchPrefix}testrunner_suite_address=${uriAddress}&testrunner_isolated&testrunner_muted`;

        document.body.appendChild(iframe);
        iframe.src = url.toString();
      }) as Promise<TestResult>;
    }
  } as Constructor<Test & IsolatedTest>
};


/**
 * IsolatedTopic
 */
export interface IsolatedTopic {}

/**
 * An isolated topic is a trivial extension of a `Topic` that mixes-in an
 * exstension to the `Topic`'s `Test` implementation.
 */
export function IsolatedTopic<T extends Constructor<Topic>>(TopicImplementation: T) {
  return class extends TopicImplementation {
    protected get TestImplementation() {
      return IsolatedTest(super.TestImplementation);
    }
  } as Constructor<Topic & IsolatedTopic>
};


/**
 * IsolatedSpec
 */
export interface IsolatedSpec {}

/**
 * An isolatable spec is a trivial extension of a `Spec` that mixes-in an
 * extension to the `Spec`'s `Topic` implementation.
 */
export function IsolatedSpec<S extends Constructor<Spec>>(SpecImplementation: S) {
  return class extends SpecImplementation {
    protected get TopicImplementation() {
      return IsolatedTopic(super.TopicImplementation);
    }
  } as Constructor<Spec & IsolatedSpec>
};

export const Isolatable = IsolatedSpec;
