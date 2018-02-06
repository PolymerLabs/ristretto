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

import { timeLimit } from './util.js';
import { Topic } from './topic.js';
import { Suite } from './suite.js';

/**
 * The basic test configuration object supports a timeout in milliseconds.
  */
export interface TestConfig {
  timeout?: number;
}

/**
 * A `TestRunContext` represents state that can be shared across test setup
 * and teardown routines in the `Test` classes internal implementation. It
 * is intended to be useful for specializations of the `Test` class, but not
 * directly exposed to the author of a test suite.
 */
export interface TestRunContext {
  suite: Suite,
  implementation: Function,
  cancelTimeLimit?: Function
}

/**
 * A `TestResult` represents the pass or failure of a given test run. The
 * result contains a boolean `passed`, and also an `error` property that
 * contains the relevant error object if the test failed. Note that some
 * kinds of tests cannot report the error object in its original form, so a
 * sparse representation containing only the error stack will be availabe in
 * that case.
 */
export interface TestResult {
  behaviorText: string;
  config: TestConfig;
  passed: boolean;
  error: boolean | Error | { stack: string | void };
};

/**
 * `Test`s are the bread and butter of any good test suite. They represent some
 * chunk of script - referred to as the `implementation` - that asserts some
 * thing related to whatever you are testing. In addition to the test
 * `implementation`, a `Test` also has a related human-readable `description`
 * and a reference to its immediate parent `Topic`. A test can be configured
 * with a `timeout` after which the a test run will automatically fail.
 *
 * A `Test` is typically created when test details are added to a topic. An
 * example of this is whenever `it` is invoked in a test suite:
 *
 * ```javascript
 * it('creates a test', () => {});
 * ```
 *
 * If the `it` invocation is "nested" in a `describe` invocation, it will
 * cause a `Test` to be added to the `Topic` that is created by the `describe`.
 */
export class Test {
  protected config: TestConfig;
  protected implementation: Function;

  /**
   * The immediate parent `Topic` of the `Test`.
   */
  readonly topic: Topic | void;

  /**
   * A human readable description of the `Test`.
   */
  readonly description: string;

  /**
   * The `behaviorText` of a `Test` is its `description` appended to the
   * `behaviorText` of its immediate parent `Topic`.
   */
  get behaviorText(): string {
    return this.topic != null
        ? `${this.topic.behaviorText} ${this.description}`
        : this.description;

  }

  /**
   * A time in ms after which a test run will automatically fail. If left
   * unconfigured, the default timeout is 10 seconds.
   */
  get timeout(): number {
    return this.config.timeout || 10000;
  }

  /**
   * A `Test` is created by providing a human readable `description`, a
   * function implementating the actual test routine, an optional configuration
   * object and an optional reference to a related parent `Topic`.
   */
  constructor(description: string,
      implementation: Function,
      config: TestConfig = {},
      topic?: Topic) {
    this.config = config;
    this.description = description;
    this.implementation = implementation;
    this.topic = topic;
  }

  /**
   * When preparing to invoke a test `implementation`, there is a "wind-up"
   * phase that allows the `Test` class and any specializations to prepare
   * the `implementation` based on the configured `TestRunContext`. The
   * default `TestRunContext` contains only one key: the current
   * `implementation` of the test. It is important to refer to this
   * `implementation`, as it may be modified by specialized overridden
   * implementations of `windUp`.
   *
   * The `windUp` method should return a modified `TestRunContext`, if
   * any modifications are deemed necessary. The default implementation,
   * for example, modifies the test `implementation` to include a time limit
   * after which the test will automatically fail.
   */
  protected async windUp(context: TestRunContext): Promise<TestRunContext> {
    const { timeout } = this;
    const { implementation } = context;
    const {
      promise: timeLimitPromise,
      cancel: cancelTimeLimit
    } = timeLimit(timeout);

    return {
      ...context,
      cancelTimeLimit,
      implementation: (...args: any[]) =>
          Promise.race([implementation(...args), timeLimitPromise])
    };
  }

  /**
   * When a test invokation has completed, there is a "wind-down" phase
   * that allows the `Test` class and any specializations to clean up the
   * `TestRunContext` that was created during the "wind-up" phase. The
   * `windDown` method is always invoked at the end of a test run, regardless
   * of whether the test passed or failed. However, it is not invoked if an
   * exception is thrown during the "wind-up" phase.
   *
   * The default `windDown` method, for example, cancels the time limit
   * created by the default `windUp` method.
   */
  protected async windDown(context: TestRunContext): Promise<void> {
    context.cancelTimeLimit!();
  }

  /**
   * The `run` method initiates a test run. A test run consists of three
   * phases:
   *
   *  1. Wind-up phase, during which the `TestRunContext` is created.
   *  2. Test run phase, when the test `implementation` is invoked and measured.
   *  3. Wind-down phase, during which the `TestRunContext` is cleaned up.
   *
   * The "wind-up" and "wind-down" phases are described in detail by the
   * related `windUp` and `windDown` methods in this class.
   *
   * The test run phase consists of taking the `implementation` generated
   * by the "wind-up" phase, invoking it, and measuring it for exceptions. If
   * no exceptions are measured, the method returns a passing `TestResult`. If
   * an exception is measured, the method returns a non-passing `TestResult`.
   */
  async run(suite: Suite): Promise<TestResult> {
    const partialResult = {
      behaviorText: this.behaviorText,
      config: this.config
    };

    let context;

    try {
      context = await this.windUp({
        suite,
        implementation: this.implementation
      });
    } catch (error) {
      if (!suite.isMuted) {
        console.error('Error preparing test context.');
        console.error(error.stack);
      }

      return { ...partialResult, passed: false, error };
    }

    try {
      const { implementation } = context;
      await implementation();
      return { ...partialResult, passed: true, error: false };
    } catch (error) {
      if (!suite.isMuted) {
        console.error(error.stack);
      }

      return { ...partialResult, passed: false, error };
    } finally {
      await this.windDown(context);
    }
  }
};
