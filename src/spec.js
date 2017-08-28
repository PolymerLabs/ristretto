import { Topic } from './topic.js';
import { Test } from './test.js';

const $rootTopic = Symbol('rootTopic');
const $currentTopic = Symbol('currentTopic');
const $scriptUrl = Symbol('scriptUrl');

class Spec {
  get scriptUrl() {
    return this[$scriptUrl];
  }

  get rootTopic() {
    return this[$rootTopic];
  }

  constructor() {
    this[$scriptUrl] = document.currentScript;
    this[$rootTopic] = null;
    this[$currentTopic] = null;

    this.it = (description, implementation, config) => {
      if (this[$currentTopic]) {
        this[$currentTopic].addTest(description, implementation, config);
      }
    }

    this.describe = (description, factory) => {
      const currentTopic = this[$currentTopic];
      const nextTopic = currentTopic == null
          ? new Topic(description)
          : currentTopic.addSubtopic(description);

      this[$currentTopic] = nextTopic;

      try {
        factory();
      } catch (error) {
        console.error(`Error invoking topic "${nextTopic.description}"`);
        console.error(error);
      }

      this[$currentTopic] = currentTopic;

      if (currentTopic == null) {
        this[$rootTopic] = nextTopic;
      }
    }

    this.fixture = (fixture) => {
      if (this[$currentTopic]) {
        this[$currentTopic].fixtures.push(fixture);
      }
    }

    this.cleanup = (cleanup) => {
      if (this[$currentTopic]) {
        this[$currentTopic].cleanups.push(cleanup);
      }
    }
  }

  getTestByAddress(address) {
    let topic = this.rootTopic;

    for (let i = 0; i < address.topic.length; ++i) {
      if (topic != null) {
        topic = topic.topics[address.topic[i]];
      }
    }

    if (topic != null) {
      return topic.tests[address.test];
    }
  }
}

export { Spec };

