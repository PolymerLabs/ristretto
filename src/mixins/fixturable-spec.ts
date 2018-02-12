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

import { Spec } from '../spec.js';
import { Suite } from '../suite.js';
import { Fixturable } from './fixturable.js';
import { describeSpecSpec } from '../spec-spec.js';
import '../../../../chai/chai.js';

const FixturableSpec = Fixturable(Spec);
const spec = new FixturableSpec();

const { expect } = (self as any).chai;
const { describe, it, before } = spec;

describe('Fixturable', () => {
  before((context: any) => ({
    ...context,
    spec: new FixturableSpec()
  }));

  describe('with tests and fixtures', () => {
    describe('invocation order', () => {
      before((context: any) => {
        const { spec } = context;
        const { describe, it, before, after, setup, teardown } = spec;
        const suite = new Suite([spec]);
        const callOrder: string[] = [];
        const record = (event: string) => () => callOrder.push(event);

        suite.reporter.disabled = true;

        describe('fixturable spec', () => {
          before(record('before1'));
          after(record('after1'));
          setup(record('before2'));
          teardown(record('after2'));

          it('has a test', record('test1'));

          describe('nested topic', () => {
            after(record('after4'));
            it('has a nested test', record('test2'));
            before(record('before4'));
          });

          before(record('before3'));
          after(record('after3'));
        });

        return { ...context, spec, suite, callOrder };
      });

      it('invokes before, after, test hooks in deterministic order',
          async ({ suite, callOrder }: any) => {
            await suite.run();
            expect(callOrder).to.be.eql([
              'before1',
              'before2',
              'before3',
              'test1',
              'after3',
              'after2',
              'after1',
              'before1',
              'before2',
              'before3',
              'before4',
              'test2',
              'after4',
              'after3',
              'after2',
              'after1'
            ]);
          });
    });
  });

  describeSpecSpec(spec, FixturableSpec);
});

export const fixturableSpec: Spec = spec;
