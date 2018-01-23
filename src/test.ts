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
