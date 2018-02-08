import { Spec } from './spec.js';
import { Fixturable } from './mixins/fixturable.js';
import { timePasses, timeLimit, cloneableResult } from './util.js';
import '../../../chai/chai.js';

const spec = new (Fixturable(Spec))();

const { expect } = (self as any).chai;
const { describe, it, before } = spec;

describe('util', () => {
  describe('timePasses', () => {
    it('returns a promise', () => {
      const timePassagePromise = timePasses(0);
      expect(timePassagePromise).to.be.instanceof(Promise);
    });

    describe('when invoked with some time in ms', () => {
      it('allows that time to pass before resolving', async () => {
        const timeStart = performance.now();
        await timePasses(30);
        const timeEnd = performance.now();
        const delta = timeEnd - timeStart;

        expect(delta).to.be.greaterThan(30);
      });
    });
  });

  describe('timeLimit', () => {
    describe('when invoked with some time in ms', () => {
      it('eventually throws', async () => {
        let threw = false;

        try {
          await timeLimit(100).promise;
        } catch (e) {
          threw = true;
        }

        expect(threw).to.be.equal(true);
      }, { timeLimit: 1000 });
    });
  });

  describe('cloneableResult', () => {
    describe('when invoked', () => {
      describe('with a test result', () => {
        before((context: any) => ({
          ...context,
          result: { passed: true, error: false }
        }));
        describe('without an error object', () => {
          it('returns the same result', ({ result }: any) => {
            expect(cloneableResult(result)).to.be.equal(result);
          });
        });

        describe('with an error object', () => {
          before((context: any) => ({
            ...context,
            result: { passed: false, error: new Error('hi') }
          }));

          it('returns a copy of the object', ({ result }: any) => {
            const clonedResult = cloneableResult(result);

            expect(clonedResult).to.not.be.equal(result);
            expect(clonedResult.passed).to.be.equal(result.passed);
          });

          it('only copies the stack from the error subkey',
              ({ result }: any) => {
                const clonedResult = cloneableResult(result);
                const { error } = clonedResult as any;

                expect(error.stack).to.be.equal(result.error.stack);
                expect(error.message).to.not.be.ok;
              });
        });
      });
    });
  });
});

export const utilSpec: Spec = spec;
