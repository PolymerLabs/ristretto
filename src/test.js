import { timeLimit } from './util.js';

const $run = Symbol('run');
const $description = Symbol('description');
const $topic = Symbol('topic');
const $config = Symbol('config');

class Test {
  get run() {
    return this[$run];
  }

  get description() {
    return this[$description];
  }

  get topic() {
    return this[$topic];
  }

  get behaviorText() {
    return this.topic != null
        ? `${this.topic.behaviorText} ${this.description}`
        : this.description;
  }

  get timeout() {
    return this[$config].timeout || 10000;
  }

  get isolated() {
    return !!this[$config].isolated;
  }

  constructor(description, implementation, config = {}, topic = null) {
    this[$config] = config;
    this[$topic] = topic;
    this[$run] = async () => {
      let context;
      try {
        context = topic != null ? topic.context : {};
        await Promise.race([implementation(context), timeLimit(this.timeout)]);
        return { passed: true, error: false };
      } catch (error) {
        console.error(error.stack);
        return { passed: false, error: { stack: error.stack } };
      } finally {
        if (topic != null && context != null) {
          topic.cleanupContext(context);
        }
      }
    };

    this[$description] = description;
  }
}

export { Test };
