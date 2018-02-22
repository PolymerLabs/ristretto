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
import { Isolatable } from './isolatable.js';
import { Fixturable, FixturedSpec } from './fixturable.js';
import { describeSpecSpec } from '../spec-spec.js';
import '../../../../chai/chai.js';

const spec = Spec.create<FixturedSpec>(Fixturable);
const { expect } = (self as any).chai;
const { describe, it, before } = spec;

describe('Isolatable', () => {
  before((context: any) => ({
    ...context,
    spec: Spec.create(Isolatable)
  }));

  describe('with tests', () => {
    before((context: any) => {
      const { spec } = context;
      const { describe, it } = spec;
      const suite = new Suite([spec]);

      describe('isolated spec', () => {
        it('has an isolated test', () => {}, { isolated: true });
      });

      return { ...context, spec, suite };
    });

    describe('an isolated test', () => {
      it('is marked as isolated', ({ spec }: any) => {
        const test = spec.rootTopic.tests[0];
        expect(test.isolated).to.be.equal(true);
      });
    });
  });

  // TODO(cdata): It will probably take specialty testing to more thoroughly
  // test isolation. The current strategy for isolating tests in the browser
  // is not compatible with a spec being run within another spec.

  describeSpecSpec(spec, Spec.create<{}>(Isolatable));
});

export const isolatableSpec: Spec = spec;
