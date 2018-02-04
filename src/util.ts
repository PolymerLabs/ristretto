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

import { TestResult } from './test.js';

export interface TimeLimitContext {
  promise: Promise<any>;
  cancel(): void;
};

/**
 * This helper makes it easy to express some amount of time as a
 * promise. The amount of time is not guaranteed to be exactly what is
 * requested (it will usually be a bit longer due to the timing details
 * of promises).
 *
 * A contrived usage in a test might look like this:
 *
 * ```javascript
 * it('requires some time to pass', async () => {
 *  await timePasses(100);
 * });
 * ```
 */
export const timePasses = (ms: number): Promise<void> => new Promise(
    resolve => setTimeout(() => {
      resolve();
    }, ms));

/**
 * This helper works as a guard against tests that will never end. As part
 * of its return value, it includes a promise that will reject after the
 * specified amount of time has passed. It also includes a cancel function
 * that "defuses" the eventually rejected promise.
 */
export const timeLimit = (ms: number): TimeLimitContext => {
  let cancelled = false;

  return {
    promise: timePasses(ms).then(() => cancelled
        ? Promise.reject(new Error(`Time ran out after ${ms}ms`))
        : Promise.resolve()),
    cancel() { cancelled = true; }
  };
};

/**
 * When a `TestResult` is broadcast using `postMessage`, it can throw because
 * the origin of an error doesn't match the origin of the context posting
 * the message. This helper pulls the most critical piece of information
 * out of the `TestResult` in order to avoid such errors.
 */
export const cloneableResult = (result: TestResult): TestResult => {
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

/**
 * The Constructor type is used when describing the type annotations for
 * mixins. See src/mixins/fixturable.ts for an example of usage.
 */
export type Constructor<T=object> = { new(...args: any[]): T };
