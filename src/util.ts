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

export interface TimeLimitContext {
  promise: Promise<any>;
  cancel(): void;
};

const timePasses = (ms: number): Promise<void> => new Promise(
    resolve => setTimeout(() => {
      resolve();
    }, ms));

const timeLimit = (ms: number): TimeLimitContext => {
  let cancelled = false;

  return {
    promise: timePasses(ms).then(() => cancelled
        ? Promise.reject(new Error(`Time ran out after ${ms}ms`))
        : Promise.resolve()),
    cancel() { cancelled = true; }
  };
};

export { timePasses, timeLimit };

export type Constructor<T=object> = { new(...args: any[]): T };
