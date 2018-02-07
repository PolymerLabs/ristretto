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

import { Test, TestConfig } from './test.js';

/**
 * A `Topic` is created to hold a set of tests with related context. The
 * base `Topic` implementation includes a "description" of the set of tests
 * as the only context information. You can think of a `Topic` as what is
 * represented in a BDD test suite by what you find inside of a `describe`
 * call. For example, here is a `Topic` with a description "some topic" and
 * one test:
 *
 * ```javascript
 * describe('some topic', () => {
 *   it('has a test', () => {});
 * });
 * ```
 *
 * `Topic`s can also have subtopics, which are created when `describe` calls
 * are nested:
 *
 * ```javascript
 * describe('some topic', () => {
 *   describe('some subtopic', () => {});
 * });
 * ```
 */
export class Topic {
  readonly parentTopic: Topic | void;

  /**
   * The set of tests directly associated with this topic. Subtopic tests
   * are associated with their immediate topic, and not their ancestor topics.
   */
  readonly tests: Test[] = [];

  /**
   * The set of subtopics directly associated with this topic. Sub-subtopics
   * are associated with their immediate parent topic, and not other ancestor
   * topics.
   */
  readonly topics: Topic[] = [];

  /**
   * The description for this topic.
   */
  readonly description: string;

  protected get TestImplementation() {
    return Test;
  }

  /**
   * The `behaviorText` is the topic description appended to its parent topic
   * description. For nested topics, this leads to useful, human-readable chains
   * of descriptions.
   */
  get behaviorText(): string {
    return this.parentTopic != null
        ? `${this.parentTopic.behaviorText} ${this.description}`
        : this.description;
  }

  /**
   * A `Topic` receives a description, and an optional reference to a parent
   * topic.
   */
  constructor(description: string, parentTopic?: Topic) {
    this.description = description;
    this.parentTopic = parentTopic;
  }

  /**
   * A subtopic can be added by offering a relevant description string. It
   * will automatically be parented to the current topic and returned.
   */
  addSubtopic(description: string): Topic {
    const subtopic = new (<typeof Topic>this.constructor)(description, this);
    this.topics.push(subtopic);
    return subtopic;
  }

  /**
   * Add a test to this topic. The test is described by its description, an
   * implementation function and an optional configuration object.
   */
  addTest(description: string, implementation: Function,
      config?: TestConfig): Test {
    const test = new (this.TestImplementation)(description, implementation,
        config, this);
    this.tests.push(test);
    return test;
  }

  /**
   * The total number of tests in this topic, including all tests in all
   * sub-topics.
   */
  get totalTestCount() {
    let count = this.tests.length;

    for (const topic of this.topics) {
      count += topic.totalTestCount;
    }

    return count;
  }

  /**
   * Iterate over all tests in the topic, including all sub-topics.
   */
  *[Symbol.iterator](): IterableIterator<Test> {
    for (const test of this.tests) {
      yield test;
    }

    for (const topic of this.topics) {
      for (const test of topic) {
        yield test;
      }
    }
  }
}
