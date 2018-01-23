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

export interface TestResult {
  passed: boolean;
  error: boolean | Error | { stack: string | void };
};

export class Test {
  private config: TestConfig;
  private implementation: Function;

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

  async run(): Promise<TestResult> {
    const { implementation, topic, timeout } = this;
    let context;

    try {
      context = topic != null ? topic.context : {};
      await Promise.race([implementation(context), timeLimit(timeout)]);
      return { passed: true, error: false };
    } catch (error) {
      console.error(error.stack);
      return { passed: false, error };
    } finally {
      if (topic != null && context != null) {
        topic.cleanupContext(context);
      }
    }
  }
}
