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
import { Suite } from '../suite.js';
import { Spec } from '../spec.js';
import { Topic } from '../topic.js';
import { Test, TestRunContext, TestConfig, TestResult } from '../test.js';
import { Constructor } from '../util';
import { Reporter, ReporterEvent } from '../reporter';

export interface ConditionalTestConfig extends TestConfig {
  condition?: () => boolean;
}

export interface ConditionalTestResult extends TestResult {
  skipped?: boolean;
}

export interface ConditionalTest {}

export function ConditionalTest<T extends Constructor<Test>>(TestImplementation: T) {
  return class extends TestImplementation {
    protected config: ConditionalTestConfig;

    async run(suite: Suite, ...args: any[]): Promise<ConditionalTestResult> {
      const { reporter } = suite;

      if (this.config.condition) {
        try {
          const shouldRun = this.config.condition();
          if (!shouldRun) {
            return {
              config: this.config,
              behaviorText: this.behaviorText,
              passed: false,
              skipped: true
            };
          }
        } catch (error) {
          reporter.report(ReporterEvent.unexpectedError,
            'Error checking conditions for test.', error, suite);
        }
      }
      return super.run(suite, ...args);
    }
  } as Constructor<Test & ConditionalTest>
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

export function ConditionalSpec<T extends Constructor<Spec>>(SpecImplementation: T) {
  return class extends SpecImplementation {
    protected get TopicImplementation() {
      return ConditionalTopic(super.TopicImplementation);
    }
  } as Constructor<Spec & ConditionalSpec>
}

export const Conditional = ConditionalSpec;