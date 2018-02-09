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
import { Fixturable } from './mixins/fixturable.js';
import '../../../chai/chai.js';

const spec = new (Fixturable(Spec))();

const { expect } = (self as any).chai;
const { describe, it, before } = spec;

describe('Spec', () => {
  describe('with topics and tests', () => {
    before((context: any) => {
      const spec = new Spec();
      const { describe, it } = spec;

      describe('a spec', () => {
        it('has a test', () => {});
        describe('nested topic', () => {
          it('also has a test', () => {});
          it('may have another test', () => {});
        });
        it('may include trailing tests', () => {});
      });

      return { ...context, spec };
    });

    it('counts the total tests in all topics', ({ spec }: any) => {
      expect(spec.totalTestCount).to.be.equal(4);
    });
  });
});

export const specSpec: Spec = spec;
