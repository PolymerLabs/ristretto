import { Spec } from './spec.js';
import { Fixturable } from './mixins/fixturable.js';
import { Suite, SuiteAddress } from './suite.js';
import '../../../chai/chai.js';

const spec = new (Fixturable(Spec))();

const { expect } = (self as any).chai;
const { describe, it, before } = spec;

describe('Suite', () => {
  before((context: any) => ({
    ...context,
    makeSpec: (topic: string = 'topic') => {
      const spec = new Spec();
      const { describe, it } = spec;
      describe(topic, () => {
        it('has a test', () => {});
      });
      return spec;
    }
  }));

  describe('with specs', () => {
    before((context: any) => {
      const { makeSpec } = context;
      const suite = new Suite([
        makeSpec('foo'),
        makeSpec('bar')
      ]);

      return {
        ...context,
        suite
      };
    });

    it('iterates over all tests in all specs', ({ suite }: any) => {
      const tests = ['foo has a test', 'bar has a test'];
      let count = 0;
      for (const test of suite) {
        expect(test.behaviorText).to.be.equal(tests[count++]);
      }
      expect(count).to.be.equal(2);
    });

    it('resolves an address for a test', ({ suite }: any) => {
      const test = suite.specs[0].rootTopic.tests[0];
      const address = suite.getAddressForTest(test);

      expect(address).to.be.eql({
        spec: 0,
        topic: [],
        test: 0
      });
    });

    it('resolves a test for an address', ({ suite }: any) => {
      const address: SuiteAddress = {
        spec: 1,
        topic: [],
        test: 0
      };
      const test = suite.getTestByAddress(address);

      expect(test.behaviorText).to.be.equal('bar has a test');
    });
  });
});

export const suiteSpec: Spec = spec;
