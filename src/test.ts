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

export interface TestConfig {
  timeout?: number;
  isolated?: boolean;
}

export interface TestRunContext {
  implementation: Function,
  cancelTimeLimit?: Function
}

export interface TestResult {
  passed: boolean;
  error: boolean | Error | { stack: string | void };
};

export class Test {
  protected config: TestConfig;
  protected implementation: Function;

  readonly topic: Topic | void;
  readonly description: string;

  get behaviorText(): string {
    return this.topic != null
        ? `${this.topic.behaviorText} ${this.description}`
        : this.description;

  }

  get timeout(): number {
    return this.config.timeout || 10000;
  }

  get isolated(): boolean {
    return !!this.config.isolated;
  }

  constructor(description: string,
      implementation: Function,
      config: TestConfig = {},
      topic?: Topic) {
    this.config = config;
    this.description = description;
    this.implementation = implementation;
    this.topic = topic;
  }

  protected async wind(context: TestRunContext): Promise<TestRunContext> {
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

  protected async unwind(context: TestRunContext): Promise<void> {
    context.cancelTimeLimit!();
  }

  async run(): Promise<TestResult> {
    let context;

    try {
      context = await this.wind({ implementation: this.implementation });
    } catch (error) {
      console.error('Error preparing test context.');
      console.error(error.stack);
      return { passed: false, error };
    }

    try {
      const { implementation } = context;
      await implementation();
      return { passed: true, error: false };
    } catch (error) {
      console.error(error.stack);
      return { passed: false, error };
    } finally {
      await this.unwind(context);
    }
  }
};
