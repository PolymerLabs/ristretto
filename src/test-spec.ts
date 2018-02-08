import { Spec } from './spec.js';
import { Fixturable } from './mixins/fixturable.js';
import { Suite } from './suite.js';
import { Test } from './test.js';
import '../../../chai/chai.js';

const spec = new (Fixturable(Spec))();

const { expect } = (self as any).chai;
const { describe, it, before } = spec;

describe('Test', () => {
  before((context: any) => {
    let testRunCount = 0;
    const testState = {
      get runCount() { return testRunCount; },
      implementation: () => { testRunCount++ }
    };
    const suite = new Suite([]);

    return {
      ...context,
      suite,
      testState,
      test: new Test('is awesome', testState.implementation, {})
    };
  });

  it('always assumes tests could be asynchronous', ({ test, suite }: any) => {
    expect(test.run(suite)).to.be.instanceof(Promise);
  });

  it('invokes the implementation when run', async ({ test, testState, suite }: any) => {
    await test.run(suite);
    expect(testState.runCount).to.be.equal(1);
  });
});

export const testSpec: Spec = spec;
