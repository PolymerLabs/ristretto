/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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
import { Topic } from '../topic.js';
import { Test, TestRunContext, TestConfig, TestResult } from '../test.js';
import { Constructor } from '../util';

export interface ConditionalTestConfig extends TestConfig {
  condition?: () => boolean;
}

export interface ConditionalTestResult extends TestResult {
  skipped?: boolean;
}

export interface ConditionalTestRunContext extends TestRunContext {
  skipped?: boolean;
}

export interface ConditionalTest {
  readonly condition: () => boolean;
}

/**
 * A conditional test is one that runs only if supplied conditions for the test
 * are satisfied.
 * In particular, ConditionalTest adds a `condition` configuration property as a
 * function that returns `true` or `false`.
 * If `condition` returns `true`, the test will run, and if it returns `false`,
 * the test will not run.
 *
 * Example:
 * ```javascript
 * describe('a topic with conditions', () => {
 *   it('a conditional test', () => {}, {condition: () => {...}}
 * });
 * ```
 */
export function ConditionalTest<T extends Constructor<Test>>(TestImplementation: T) {
  return class extends TestImplementation {
    protected config!: ConditionalTestConfig;

    /**
     * True if the test should run.
     */
    get condition(): () => boolean {
      return this.config.condition || (() => true);
    }

    protected async postProcess(context: ConditionalTestRunContext, result: TestResult): Promise<ConditionalTestResult> {
      const superResult = await super.postProcess(context, result);
      return {
        ...superResult,
        skipped: context.skipped,
        passed: context.skipped ? false : superResult.passed
      };
    }

    protected async windUp(context: TestRunContext): Promise<ConditionalTestRunContext> {
      const skipped = !this.condition();
      context = await super.windUp(context);
      if (skipped) {
        return {
          ...context,
          // provide a void implementation to "skip" the test
          implementation: () => {},
          skipped
        };
      } else {
        return context;
      }
    }

  } as Constructor<Test & ConditionalTest>;
}

export interface ConditionalTopic {}

export function ConditionalTopic<T extends Constructor<Topic>>(TopicImplementation: T) {
  return class extends TopicImplementation {
    protected get TestImplementation() {
      return ConditionalTest(super.TestImplementation);
    }
  } as Constructor<Topic & ConditionalTopic>
}

export interface ConditionalSpec {}

/**
 * A conditional spec is an extension to `Spec` that allows
 * individual tests to be conditionally run based on a
 * `condition` function in the test config.
 */
export function ConditionalSpec<S extends Constructor<Spec>>(SpecImplementation: S) {
  return class extends SpecImplementation {
    protected get TopicImplementation() {
      return ConditionalTopic(super.TopicImplementation);
    }
  } as Constructor<Spec & ConditionalSpec>
}

export const Conditional = ConditionalSpec;