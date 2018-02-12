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

import { Constructor, cloneableResult } from '../util.js';
import { Suite } from '../suite.js';
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

export interface IsolatedTestResult extends TestResult {
  isolated?: boolean;
}

export interface IsolatedTestRunContext extends TestRunContext {
  isolated?: boolean;
}

export interface IsolatedTest {
  readonly isolated: boolean;
}

enum IsolatedTestMessage {
  messagePort = 'TestrunnerIsolatedTestMessagePort',
  ready = 'TestrunnerIsolatedTestReady'
}

/**
 * An isolated test is one that runs in a "clean room" context. Currently, this
 * means running in an iframe in a browser. This is useful to help test authors
 * control for global state that persists across test runs (for example, custom
 * element registration).
 *
 * For test runs isolated by iframes, the following steps are taken:
 *
 *  1. On wind-up, if the test is to be isolated, the implementation is replaced
 *  by one that generates an iframe pointing to the same URL but with specially
 *  crafted query params that inform the suite to run only one test, and informs
 *  the test that it is running in an isolated context.
 *  2. The test implementation is invoked in the main frame, causing an iframe
 *  (the isolated context) to be loaded.
 *  3. The test in the isolated frame notifies that it is ready to run.
 *  4. The test in the main frame posts a `MessagePort` to the test in the
 *  isolated frame.
 *  5. The test in the isolated frame receives the `MessagePort`, and invokes
 *  the actual test implementation.
 *  6. The test in the isolated frame posts the `TestResult` back through the
 *  `MessagePort` to the main frame.
 *  7. The test in the main frame resolves its implementation with the
 *  `TestResult` received from the isolated frame.
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

    /**
     * An isolated test run must post its results to the parent frame in order
     * to be completed. We override run to do this if we detect that we are
     * isolated.
     */
    async run(suite: Suite, ...args: any[]) {
      const { queryParams } = suite;
      let port: MessagePort | undefined;

      if ('testrunner_isolated' in queryParams) {
        // Step 5: The isolated test receives the `MessagePort` and proceeds to
        // invoke the actual test implementation:
        port = await this.receiveMessagePort();
      }

      const result = await super.run(suite, ...args);

      if ('testrunner_isolated' in queryParams && port != null) {
        // Step 6: The isolated test posts the results through the `MessagePort`
        // back to the main frame:
        port.postMessage(cloneableResult(result));
      }

      return result;
    }

    protected async windUp(context: TestRunContext)
        : Promise<IsolatedTestRunContext> {
      const { suite } = context;
      const { queryParams } = suite;
      const isIsolated = 'testrunner_isolated' in queryParams;
      const shouldBeIsolated = !!this.isolated;

      context = await super.windUp(context);

      if (!shouldBeIsolated || isIsolated) {
        return { ...context, isolated: false };
      }

      // Step 1: replace the implementation with one that generates an isolated
      // context:
      const address = suite.getAddressForTest(this);
      const implementation = async () => {
        // Step 2: an isolated run is invoked:
        const isolatedResult = await this.isolatedRun(address);

        // Step 7: report an error result, if any, from the isolated test
        // result:
        if (!!isolatedResult.error) {
          throw isolatedResult.error;
        }
      };

      return {
        ...context,
        isolated: true,
        implementation
      };
    }

    protected async postProcess(context: IsolatedTestRunContext,
        result: TestResult) : Promise<IsolatedTestResult> {
      return { ...result, isolated: context.isolated };
    }

    protected async receiveMessagePort(): Promise<MessagePort> {
      // Step 3: the isolated context notifies that it is ready to proceed:
      window.parent.postMessage(IsolatedTestMessage.ready, window.location.origin);

      return new Promise(resolve => {
        const receiveMessage = (event: MessageEvent) => {
          if (event.data !== IsolatedTestMessage.messagePort) {
            return;
          }

          resolve(event.ports[0]);
          window.removeEventListener('message', receiveMessage);
        };

        window.addEventListener('message', receiveMessage);
      }) as Promise<MessagePort>;
    }

    protected async isolatedRun(address: SuiteAddress): Promise<TestResult> {
      return new Promise(resolve => {
        const channel = new MessageChannel();
        const { port1, port2 } = channel;
        const url = new URL(window.location.toString());
        const iframe = document.createElement('iframe');
        const receiveMessage = (event: MessageEvent) => {
          if (event.source !== iframe.contentWindow &&
              event.data !== IsolatedTestMessage.ready) {
            return;
          }

          window.removeEventListener('message', receiveMessage);
          // Step 4: the main frame responds to the isolated frame with a
          // `MessagePort` for hygeinically communicating test results:
          iframe.contentWindow.postMessage(
              IsolatedTestMessage.messagePort, '*', [port2]);
        };

        const receiveResult = (event: MessageEvent) => {
          if (event.data == null) {
            return;
          }

          port1.removeEventListener('message', receiveResult);
          document.body.removeChild(iframe);
          resolve(event.data);
        };

        port1.addEventListener('message', receiveResult);
        port1.start();

        iframe.style.position = 'absolute';
        iframe.style.top = '-1000px';
        iframe.style.left = '-1000px';

        window.addEventListener('message', receiveMessage);

        const searchPrefix = url.search ? `${url.search}&` : '?';
        const uriAddress = encodeURIComponent(JSON.stringify(address));
        url.search =
            `${searchPrefix}testrunner_suite_address=${uriAddress}&testrunner_isolated&testrunner_disable_reporting`;

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
