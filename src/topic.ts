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

export class Topic {
  protected parentTopic: Topic | void;

  readonly tests: Test[] = [];
  readonly topics: Topic[] = [];
  readonly description: string;

  get TestImplementation() {
    return Test;
  }

  get behaviorText(): string {
    return this.parentTopic != null
        ? `${this.parentTopic.behaviorText} ${this.description}`
        : this.description;
  }

  constructor(description: string, parentTopic?: Topic) {
    this.description = description;
    this.parentTopic = parentTopic;
  }

  addSubtopic(description: string): Topic {
    const subtopic = new (<typeof Topic>this.constructor)(description, this);
    this.topics.push(subtopic);
    return subtopic;
  }

  addTest(description: string, implementation: Function,
      config?: TestConfig): Test {
    const test = new (this.TestImplementation)(description, implementation,
        config, this);
    this.tests.push(test);
    return test;
  }
}
