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

import { Topic } from './topic.js';
import { Test, TestConfig } from './test.js';
import { SuiteAddress } from './suite.js';

/**
 * The `Spec` is the main point of entry to this library for most test suite
 * authors. A `Spec` holds the relevant "tear-off" test helpers. The base
 * implementation includes only the most basic BDD helpers (`describe` and
 * `it`), but it is extensible, and additional tearoffs can be added by
 * using mixins. An contrived example usage of a `Spec` looks like this:
 *
 * ```javascript
 * export const spec = new Spec();
 * const { describe, it } = spec;
 *
 * describe('some test suite', () => {
 *   it('has a test!', () => {});
 * });
 * ```
 *
 * Note that the instance of the `Spec` is exported by the test module.
 *
 * `Spec`
 */
export class Spec {
  // NOTE(cdata): These are described as class fields so that they can be
  // "torn off" when used in a test:
  it: Function;
  describe: Function;

  rootTopic: Topic | null;
  protected currentTopic: Topic | null;

  protected get TopicImplementation() {
    return Topic;
  }

  constructor() {
    this.rootTopic = null;
    this.currentTopic = null;

    this.it = (description: string, implementation: Function, config?: TestConfig): void => {
      if (this.currentTopic != null) {
        this.currentTopic.addTest(description, implementation, config);
      }
    }

    this.describe = (description: string, factory: Function): void => {
      const { currentTopic } = this as Spec;
      const nextTopic = currentTopic == null
          ? new this.TopicImplementation(description)
          : currentTopic!.addSubtopic(description);

      this.currentTopic = nextTopic;

      try {
        factory();
      } catch (error) {
        console.error(`Error invoking topic "${nextTopic.description}"`);
        console.error(error);
      }

      if (currentTopic == null) {
        this.rootTopic = nextTopic;
      }

      this.currentTopic = currentTopic;
    }
  }

  getTestByAddress(address: SuiteAddress): Test | null {
    let topic = this.rootTopic;

    for (let i = 0; i < address.topic.length; ++i) {
      if (topic != null) {
        topic = topic.topics[address.topic[i]];
      }
    }

    if (topic != null) {
      return topic.tests[address.test];
    }

    return null;
  }
}
