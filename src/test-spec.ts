import { Spec } from './spec.js';
import { Fixturable } from './mixins/fixturable.js';
import { Suite } from './suite.js';
import { Test } from './test.js';
import { timePasses } from './util.js';
import '../../../chai/chai.js';

const spec = new (Fixturable(Spec))();

const { expect } = (self as any).chai;
const { describe, it, before } = spec;

describe('Test', () => {
  before((context: any) => {
    let testRunCount = 0;
    const testSpy = {
      get runCount() { return testRunCount; },
      implementation: () => { testRunCount++ }
    };
    const suite = new Suite([]);

    return {
      ...context,
      suite,
      testSpy,
      test: new Test('is awesome', testSpy.implementation, {})
    };
  });

  it('always assumes tests could be asynchronous', ({ test, suite }: any) => {
    expect(test.run(suite)).to.be.instanceof(Promise);
  });

  it('invokes the implementation when run', async ({ test, testSpy, suite }: any) => {
    await test.run(suite);
    expect(testSpy.runCount).to.be.equal(1);
  });

  describe('when timing out', () => {
    before((context: any) => ({
      ...context,
      test: new Test('is timing out',
          async () => await timePasses(100), { timeout: 50 })
    }));

    it('eventually fails', async ({ test, suite }: any) => {
      const result = await test.run(suite);
      expect(result.passed).to.be.equal(false);
      expect(result.error).to.be.instanceof(Error);
    });
  });
});

export const testSpec: Spec = spec;
