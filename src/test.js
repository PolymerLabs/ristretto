import { timeLimit } from './util.js';

const $run = Symbol('run');
const $description = Symbol('description');
const $topic = Symbol('topic');

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

  constructor(description, implementation, timeout = 10000, topic = null) {
    this[$topic] = topic;
    this[$run] = async () => {
      try {
        const context = topic != null ? topic.context : {};
        await Promise.race([implementation(context), timeLimit(timeout)]);
        return { passed: true, error: false };
      } catch (error) {
        console.error(error.stack);
        return { passed: false, error: { ...error } };
      }
    };

    this[$description] = description;
  }
}

export { Test };
