import { Spec } from '../spec.js';
import { Test, TestRunContext } from '../test.js';
import { Topic } from '../topic.js';
import { Constructor } from '../util.js';

/**
 * FixturedTest
 */
export interface FixturedTestRunContext extends TestRunContext {
  fixtureContext?: any
};

export interface FixturedTest {
  readonly topic: Topic & FixturedTopic;
};

export function FixturedTest<T extends Constructor<Test>>(TestImplementation: T) {
  return class extends TestImplementation {
    readonly topic: Topic & FixturedTopic;

    protected async wind(context: TestRunContext):
        Promise<FixturedTestRunContext> {
      const testContext = await super.wind(context);
      const { implementation } = testContext;

      const { topic } = this;
      const fixtureContext = topic != null ? topic.createContext() : {};

      return {
        ...testContext,
        fixtureContext,
        implementation: (...args: any[]) => implementation(...args, fixtureContext)
      };
    }

    protected async unwind(context: FixturedTestRunContext) {
      const { fixtureContext } = context;
      const { topic } = this;

      if (topic != null) {
        topic.disposeContext(fixtureContext);
      }
    }
  } as Constructor<Test & FixturedTest>;
};


/**
 * FixturedTopic
 */
export interface FixturedTopic {
  readonly fixtures: Function[];
  readonly cleanups: Function[];

  createContext(): object;
  disposeContext(context: object): void;
}

export function FixturedTopic<T extends Constructor<Topic>>(TopicImplementation: T) {
  return class extends TopicImplementation {
    protected parentTopic: (Topic & FixturedTopic) | void;

    readonly fixtures: Function[] = [];
    readonly cleanups: Function[] = [];

    get TestImplementation() {
      return FixturedTest(super.TestImplementation);
    }

    createContext(): object {
      const context = this.parentTopic != null
          ? this.parentTopic.createContext()
          : {};

      return this.fixtures.reduce(
          (context, fixture) => (fixture(context) || context), context);
    }

    disposeContext(context: object): void {
      for (let i = this.cleanups.length - 1; i > -1; --i) {
        this.cleanups[i](context);
      }

      if (this.parentTopic != null) {
        this.parentTopic.disposeContext(context);
      }
    }
  } as Constructor<Topic & FixturedTopic>;
}

/**
 * FixturedSpec
 */
export interface FixturedSpec {
  fixture: Function;
  cleanup: Function;
}

export type FixtureFunction = (context: object) => any;
export type CleanupFunction = (context: object) => void;

export function FixturedSpec<S extends Constructor<Spec>>(SpecImplementation: S) {
  return class extends SpecImplementation {

    fixture: Function;
    cleanup: Function;

    rootTopic: (Topic & FixturedTopic) | null;
    protected currentTopic: (Topic & FixturedTopic) | null;

    protected get TopicImplementation() {
      return FixturedTopic(super.TopicImplementation);
    }

    constructor(...args: any[]) {
      super(...args);

      this.fixture = (fixture: FixtureFunction): void => {
        if (this.currentTopic != null) {
          this.currentTopic.fixtures.push(fixture);
        }
      };

      this.cleanup = (cleanup: CleanupFunction): void => {
        if (this.currentTopic != null) {
          this.currentTopic.cleanups.push(cleanup);
        }
      };
    }
  } as Constructor<Spec & FixturedSpec>;
}

export const Fixturable = FixturedSpec;
