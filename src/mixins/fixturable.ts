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

import { Spec } from '../spec.js';
import { Test, TestRunContext } from '../test.js';
import { Topic } from '../topic.js';
import { Constructor } from '../util.js';

/**
 * FixturedTest
 */
export interface FixturedTestRunContext extends TestRunContext {
  fixtureContext?: any
};

export interface FixturedTest {
  readonly topic: Topic & FixturedTopic;
};

/**
 * Decorates a `Test` implementation with the necessary "wind-up" and
 * "wind-down" behavior to support fixtured contexts in tests.
 */
export function FixturedTest<T extends Constructor<Test>>(TestImplementation: T) {
  return class extends TestImplementation {
    readonly topic: Topic & FixturedTopic;

    /**
     * When winding up, a fixtured context is generated from a topic, and
     * the test invocation is wrapped so that the context is passed in
     * to the test implementation when it is invoked.
     */
    protected async windUp(context: TestRunContext):
        Promise<FixturedTestRunContext> {
      const testContext = await super.windUp(context);
      const { implementation } = testContext;

      const { topic } = this;
      const fixtureContext = topic != null ? topic.createContext() : {};

      return {
        ...testContext,
        fixtureContext,
        implementation: (...args: any[]) => implementation(...args, fixtureContext)
      };
    }

    /**
     * When winding down, a fixtured context is cleaned up by the topic that
     * created it.
     */
    protected async windDown(context: FixturedTestRunContext) {
      const { fixtureContext } = context;
      const { topic } = this;

      await super.windDown(context);

      if (topic != null) {
        topic.disposeContext(fixtureContext);
      }
    }
  } as Constructor<Test & FixturedTest>;
};


/**
 * FixturedTopic
 */
export interface FixturedTopic {
  readonly fixtures: Function[];
  readonly cleanups: Function[];

  createContext(): object;
  disposeContext(context: object): void;
}

/**
 * Decorates a `Topic` with the implementation necessary to support describing
 * fixture steps and cleanup steps on a test, and generating a fixtured context
 * from those steps.
 */
export function FixturedTopic<T extends Constructor<Topic>>(TopicImplementation: T) {
  return class extends TopicImplementation {
    parentTopic: (Topic & FixturedTopic) | void;

    readonly fixtures: Function[] = [];
    readonly cleanups: Function[] = [];

    /**
     * The `Test` implementation used for fixture-capable `Topic`s has to
     * include its own specialized fixture-capable implementation.
     */
    get TestImplementation() {
      return FixturedTest(super.TestImplementation);
    }

    /**
     * Generates a fixture context by generating its parent `Topic`'s fixture
     * context (if there is a parent `Topic`) and passing it through all
     * fixture steps configured for itself.
     */
    createContext(): object {
      const context = this.parentTopic != null
          ? this.parentTopic.createContext()
          : {};

      return this.fixtures.reduce(
          (context, fixture) => (fixture(context) || context), context);
    }

    /**
     * Cleans up a fixture context by passing it through all of the configured
     * cleanup steps on itself, and then passing that context through the
     * parent `Topic`'s cleanup steps (if there is a parent `Topic`).
     */
    disposeContext(context: object): void {
      for (let i = this.cleanups.length - 1; i > -1; --i) {
        this.cleanups[i](context);
      }

      if (this.parentTopic != null) {
        this.parentTopic.disposeContext(context);
      }
    }
  } as Constructor<Topic & FixturedTopic>;
}

/**
 * FixturedSpec
 */
export interface FixturedSpec {
  fixture: Function;
  cleanup: Function;
}

export type FixtureFunction = (context: object) => any;
export type CleanupFunction = (context: object) => void;

/**
 * Decorates a `Spec` implementation with the necessary behavior to support
 * fixtures in tests. For the `Spec`, this primarily consists of adding two
 * new "tear-off" methods: `fixture` and `cleanup`.
 */
export function FixturedSpec<S extends Constructor<Spec>>(SpecImplementation: S) {
  return class extends SpecImplementation {

    /**
     * The `fixture` method is one of two added "tear-off" methods offered in
     * the fixture implementation for `Spec`. Invoking `fixture` causes a
     * step to be added that is run before each test in the immediate parent
     * topic and all subtopics of the immediate parent topic.
     *
     * Additionally, a fixture step function receives a context argument which
     * can be decorated or substituted and returned by the step. This same
     * context object will be passed in to all test implementations for which
     * the fixture step is applicable.
     *
     * An example fixture step looks like this:
     *
     * ```javascript
     * describe('some spec', () => {
     *   fixture(context => ({
     *     ...context,
     *     message: 'foo'
     *   }));
     *
     *   it('has context', ({ message }) => {
     *     console.log(message); // prints 'foo'
     *   });
     * });
     * ```
     *
     * The `fixture` method has two aliases that can be used interchangeably,
     * even within the same `Spec` if desired (though this is not recommended):
     *
     *  - BDD style `before`
     *  - TDD style `setup`
     */
    fixture: Function;
    before: Function;
    setup: Function;

    /**
     * The `cleanup` method is one of two added "tear-off" methods offered in
     * the fixture implementation for `Spec`. Invoking `cleanup` causes a step
     * to be added that is run after each test in the immediate parent topic
     * all subtopics of the immediate parent topic.
     *
     * A cleanup step is intended to unset any critical state that is set by a
     * correspondign fixture step, such as cleaning up mocked global state or
     * shutting down a server.
     *
     * The `cleanup` method has two aliases that can be used interchangeably,
     * even within the same `Spec` if desired (though this is not recommended):
     *
     *  - BDD style `after`
     *  - TDD style `teardown`
     */
    cleanup: Function;
    after: Function;
    teardown: Function;

    rootTopic: (Topic & FixturedTopic) | null;
    protected currentTopic: (Topic & FixturedTopic) | null;

    /**
     * The `Topic` implementation used by a fixture-capable spec requires
     * the special behavior added by the `FixturedTopic` mixin.
     */
    protected get TopicImplementation() {
      return FixturedTopic(super.TopicImplementation);
    }

    constructor(...args: any[]) {
      super(...args);

      this.fixture = this.before = this.setup =
          (fixture: FixtureFunction): void => {
            if (this.currentTopic != null) {
              this.currentTopic.fixtures.push(fixture);
            }
          };

      this.cleanup = this.after = this.teardown =
          (cleanup: CleanupFunction): void => {
            if (this.currentTopic != null) {
              this.currentTopic.cleanups.push(cleanup);
            }
          };
    }
  } as Constructor<Spec & FixturedSpec>;
}

/**
 * This is an alias for the `FixturedSpec` mixin, added for convenience and
 * subjective readability for spec authors.
 */
export const Fixturable = FixturedSpec;
