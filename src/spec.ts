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
import { Constructor, TestRunnerDomainExtender, TestRunnerDomain } from './util.js';


/*
export interface Domain<S extends Constructor<Spec>,
    T extends Constructor<Topic>, U extends Constructor<Test>> {
  Spec: S;
  Topic: T;
  Test: U;
};


export type SpecMixin<SpecExtension = {}, TopicExtension = {}, TestExtension = {}> =
    <S extends Spec,
     T extends Topic,
     U extends Test>(implementations: SpecImplementations<S, T, U>) =>
        SpecImplementations<SpecExtension, TopicExtension, TestExtension>;
 */

//export type SpecMixin<S extends Constructor<Spec>,
    //T extends Constructor<Topic>,
    //U extends Constructor<Test>> =
  //(implementations: SpecImplementations<S, T, U>) => SpecImplementations<>;

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

export type Ext = TestRunnerDomainExtender<any, any, any>;

export class Spec {

  static create(): Spec;
  static create<M0>(A0: Ext): Spec & M0;
  static create<M0, M1>(A0: Ext, A1: Ext): Spec & M0 & M1;
  static create<M0, M1, M2>(A0: Ext, A1: Ext, A2: Ext): Spec & M0 & M1 & M2;
  static create<M0, M1, M2, M3>(A0: Ext, A1: Ext, A2: Ext, A3: Ext)
      : Spec & M0 & M1 & M2 & M3;
  static create<M0, M1, M2, M3, M4>(A0: Ext, A1: Ext, A2: Ext, A3: Ext, A4: Ext)
      : Spec & M0 & M1 & M2 & M3 & M4;
  static create<M0, M1, M2, M3, M4, M5>
      (A0: Ext, A1: Ext, A2: Ext, A3: Ext, A4: Ext, A5: Ext)
          : Spec & M0 & M1 & M2 & M3 & M4 & M5;
  static create<M0, M1, M2, M3, M4, M5, M6>
      (A0: Ext, A1: Ext, A2: Ext, A3: Ext, A4: Ext, A5: Ext, A6: Ext)
          : Spec & M0 & M1 & M2 & M3 & M4 & M5 & M6;
  static create<M0, M1, M2, M3, M4, M5, M6, M7>
      (A0: Ext, A1: Ext, A2: Ext, A3: Ext, A4: Ext, A5: Ext, A6: Ext, A7: Ext)
          : Spec & M0 & M1 & M2 & M3 & M4 & M5 & M6 & M7;
  static create<M0, M1, M2, M3, M4, M5, M6, M7, M8>
      (A0: Ext, A1: Ext, A2: Ext, A3: Ext, A4: Ext, A5: Ext, A6: Ext, A7: Ext,
       A8: Ext)
          : Spec & M0 & M1 & M2 & M3 & M4 & M5 & M6 & M7 & M8;
  static create<M0, M1, M2, M3, M4, M5, M6, M7, M8, M9>
      (A0: Ext, A1: Ext, A2: Ext, A3: Ext, A4: Ext, A5: Ext, A6: Ext, A7: Ext,
       A8: Ext, A9: Ext)
          : Spec & M0 & M1 & M2 & M3 & M4 & M5 & M6 & M7 & M8 & M9;


  /**
   * This helper supports more expressive extension of the `Spec` by
   * chaining mixin functions and instantiating a specialized `Spec` class
   * with the appropriate implementations for `Topic` and `Test`.
   *
   * Example usage:
   *
   * ```javascript
   * import { FooMixin } from './mixins/foo.js';
   * import { BarMixin } from './mixins/bar.js';
   * import { Spec } from './spec.js';
   *
   * const spec = Spec.create(FooMixin, BarMixin);
   * ```
   *
   * A spec mixin is a function that receives constructors for `Spec`, `Topic`
   * and `Test` respectively, and returns a set of optionally enhanced
   * constructors. For example:
   *
   * ```javascript
   * export const FooMixin = ({ Spec, Topic, Test }) => {
   *   const FooTest extends Test {
   *     // ...
   *   }
   *
   *   return { Spec, Topic, Test: FooTest };
   * };
   * ```
   */
  static create(...mixins: Ext[]): Spec {
    let implementations: TestRunnerDomain<Spec, Topic, Test> = { Spec, Topic, Test };

    for (const mixin of mixins) {
      implementations = mixin(implementations);
    }

    const { Spec: FinalSpec, Topic: FinalTopic, Test: FinalTest } =
        implementations;

    return new FinalSpec(FinalTopic, FinalTest);
  }

  // NOTE(cdata): `it` and `describe` are annotated as class fields so that
  // they can be "torn off" when used in a test:

  /**
   * The `it` method is one of two "tear-off" methods offered in the base
   * `Spec` implementation. This method is used by a spec author to describe
   * a test. It takes a string description of the test, a function that is
   * the actual script used to run the test, and an optional configuration
   * object as arguments.
   */
  it: Function;

  /**
   * The `describe` method is one of two "tear-off" methods offered in
   * the base `Spec` implementation. This method is used by the spec author to
   * describe a topic. It takes a string description of the topic, and a
   * function that, when invoked, describes any additional details of the
   * topic via additional `it`, `describe` or other specialized tear-off
   * function invokcations.
   */
  describe: Function;

  /**
   * The `rootTopic` of a spec is the entry point to the tree of all `Topic`s
   * and `Test`s in a `Spec`.
   */
  rootTopic: Topic | null = null;
  protected currentTopic: Topic | null = null;

  constructor(protected TopicImplementation: Constructor<Topic> = Topic,
      protected TestImplementation: Constructor<Test> = Test) {

    this.it = (description: string, implementation: Function,
        config?: TestConfig): void => {
      if (this.currentTopic != null) {
        this.currentTopic.addTest(description, implementation, config);
      }
    }

    this.describe = (description: string, factory: Function): void => {
      const { currentTopic } = this as Spec;
      const nextTopic = currentTopic == null
          ? new this.TopicImplementation(description, this.TestImplementation)
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

  /**
   * The total number of tests in this spec, including the root topic and
   * all sub-topics.
   */
  get totalTestCount() {
    let count = 0;

    if (this.rootTopic != null) {
      count += this.rootTopic.totalTestCount;
    }

    return count;
  }

  /**
   * Iterate over all tests in the spec.
   */
  *[Symbol.iterator](): IterableIterator<Test> {
    if (this.rootTopic != null) {
      for (const test of this.rootTopic) {
        yield test;
      }
    }
  }

  /**
   * All tests in the `Spec` are retrievable by `SuiteAddress`. Any
   * retrieved `Test` can be invoked on an individual basis exactly
   * as it would be invoked if it were running inline with the rest of the
   * test suite that it is a part of.
   */
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
