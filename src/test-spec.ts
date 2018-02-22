/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import { Spec } from './spec.js';
import { Fixturable, FixturedSpec } from './mixins/fixturable.js';
import { Suite } from './suite.js';
import { Test, TestResult, TestRunContext } from './test.js';
import { timePasses } from './util.js';
import '../../../chai/chai.js';

const spec = Spec.create<FixturedSpec>(Fixturable);

const { expect } = (self as any).chai;
const { describe, it, before, after } = spec;

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

  it('invokes the implementation when run',
      async ({ test, testSpy, suite }: any) => {
        await test.run(suite);
        expect(testSpy.runCount).to.be.equal(1);
      });

  describe('postProcess', () => {
    before((context: any) => {
      const originalPostProcess = (Test as any).prototype.postProcess;

      Object.defineProperty(Test.prototype, 'postProcess', {
        value: (_context: TestRunContext, result: TestResult) => {
          return { ...result, special: true };
        }
      });

      return {
        ...context,
        originalPostProcess
      };
    });

    after(({ originalPostProcess }: any) => {
      Object.defineProperty(Test.prototype,
          'postProcess', { value: originalPostProcess });
    });

    it('manipulates the TestResult after the test is run',
        async ({ test, suite }: any) => {
          const result = await test.run(suite);
          expect(result.special).to.be.equal(true);
        });
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
