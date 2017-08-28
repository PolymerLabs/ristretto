import { Test } from './test.js';

const $description = Symbol('description');
const $tests = Symbol('tests');
const $topics = Symbol('topics');
const $fixtures = Symbol('fixtures');
const $cleanups = Symbol('cleanups');
const $parentTopic = Symbol('parentTopic');

class Topic {
  get description() {
    return this[$description];
  }

  get tests() {
    return this[$tests];
  }

  get fixtures() {
    return this[$fixtures];
  }

  get cleanups() {
    return this[$cleanups];
  }

  get topics() {
    return this[$topics];
  }

  get behaviorText() {
    return this[$parentTopic]
        ? `${this[$parentTopic].behaviorText} ${this.description}`
        : this.description;
  }

  get context() {
    const context = this[$parentTopic] != null
        ? this[$parentTopic].context
        : {};

    return this.fixtures.reduce(
        (context, fixture) => (fixture(context) || context), context);
  }

  constructor(description, parentTopic = null) {
    this[$description] = description;

    this[$tests] = [];
    this[$fixtures] = [];
    this[$cleanups] = [];
    this[$topics] = [];
    this[$parentTopic] = parentTopic;
  }

  addSubtopic(description) {
    const subtopic = new Topic(description, this);
    this.topics.push(subtopic);
    return subtopic;
  }

  addTest(description, implementation, config) {
    const test = new Test(description, implementation, config, this);
    this.tests.push(test);
    return test;
  }

  cleanupContext(context) {
    for (let i = this[$cleanups].length - 1; i > -1; --i) {
      this[$cleanups][i](context);
    }

    if (this[$parentTopic] != null) {
      this[$parentTopic].cleanupContext(context);
    }
  }
}

export { Topic };
