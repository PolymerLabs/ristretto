import { Test, TestConfig } from './test.js';

export class Topic {
  private parentTopic: Topic | void;

  readonly tests: Test[] = [];
  readonly topics: Topic[] = [];
  readonly fixtures: Function[] = [];
  readonly cleanups: Function[] = [];
  readonly description: string;

  get behaviorText(): string {
    return this.parentTopic != null
        ? `${this.parentTopic.behaviorText} ${this.description}`
        : this.description;
  }

  get context(): object {
    const context = this.parentTopic != null
        ? this.parentTopic.context
        : {};

    return this.fixtures.reduce(
        (context, fixture) => (fixture(context) || context), context);
  }

  constructor(description: string, parentTopic?: Topic) {
    this.description = description;
    this.parentTopic = parentTopic;
  }

  addSubtopic(description: string): Topic {
    const subtopic = new Topic(description, this);
    this.topics.push(subtopic);
    return subtopic;
  }

  addTest(description: string,
      implementation: Function,
      config?: TestConfig): Test {
    const test = new Test(description, implementation, config, this);
    this.tests.push(test);
    return test;
  }

  cleanupContext(context: object): void {
    for (let i = this.cleanups.length - 1; i > -1; --i) {
      this.cleanups[i](context);
    }

    if (this.parentTopic != null) {
      this.parentTopic.cleanupContext(context);
    }
  }
}
