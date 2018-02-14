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
import { Conditional } from './conditional.js';
import { Fixturable } from '../index.js';
import { describeSpecSpec } from '../spec-spec.js';
import { TestReporter } from '../reporters/test-reporter.js';
import '../../../../chai/chai.js';

const ConditionalSpec = Conditional(Spec);
const spec = new (Fixturable(Spec))();

const { expect } = (self as any).chai;
const { describe, it, before } = spec;

describe('Conditional', () => {
  before((context: any) => ({
    ...context,
    spec: new ConditionalSpec()
  }));

  describe('with tests', () => {
    before((context: any) => {
      const {spec} = context;
      const {describe, it} = spec;
      const suite = new Suite([spec], new TestReporter());

      describe('conditional spec', () => {
        it('runs by default', () => {});
        it('has a skipped test', () => {}, {condition: () => false});
      });

      return {...context, spec, suite};
    });

    describe('conditional tests', () => {
      it ('marked as skipped', async ({suite}: any) => {
        await suite.run();
        const results = (suite.reporter as TestReporter).results;
        expect(results).to.have.length.greaterThan(0);
        expect(results[0].passed).to.be.equal(true);
        expect(results[1].passed).to.be.equal(false);
        expect(results[1]).to.have.property('skipped');
      });
    })
  });

  describeSpecSpec(spec, ConditionalSpec);
});

export const conditionalSpec: Spec = spec;
