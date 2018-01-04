import { Topic } from './topic.js';
import { Test, TestConfig } from './test.js';
import { SuiteAddress } from './suite.js';

export type FixtureFunction = (context: object) => any;
export type CleanupFunction = (context: object) => void;

export class Spec {
  // NOTE(cdata): These are described as class fields so that they can be
  // "torn off" when used in a test:
  it: Function;
  describe: Function;
  fixture: Function;
  cleanup: Function;

  rootTopic: Topic | null;

  private currentTopic: Topic | null;

  constructor() {
    this.rootTopic = null;
    this.currentTopic = null;

    this.it = (description: string, implementation: Function, config?: TestConfig): void => {
      if (this.currentTopic != null) {
        this.currentTopic.addTest(description, implementation, config);
      }
    }

    this.describe = (description: string, factory: Function): void => {
      const { currentTopic } = this as Spec;
      const nextTopic = currentTopic == null
          ? new Topic(description)
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

    this.fixture = (fixture: FixtureFunction): void => {
      if (this.currentTopic != null) {
        this.currentTopic.fixtures.push(fixture);
      }
    }

    this.cleanup = (cleanup: CleanupFunction): void => {
      if (this.currentTopic != null) {
        this.currentTopic.cleanups.push(cleanup);
      }
    }
  }

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
