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
import { Topic } from './topic.js';
import '../../../chai/chai.js';

const spec = Spec.create<FixturedSpec>(Fixturable);

const { expect } = (self as any).chai;
const { describe, it, before } = spec;

describe('Topic', () => {
  describe('without a parent topic', () => {
    before((context: any) => ({
      ...context,
      topic: new Topic('some topic')
    }));

    it('has behavior text that matches the description', ({ topic }: any) => {
      expect(topic.behaviorText).to.be.equal(topic.description);
    });
  });

  describe('with a parent topic', () => {
    before((context: any) => ({
      ...context,
      topic: new Topic('some topic', new Topic('parented'))
    }));

    it('has behavior text that joins the parent and child descriptions',
        ({ topic }: any) => {
          const { parentTopic } = topic;
          expect(topic.behaviorText).to.be.equal(
              `${parentTopic.description} ${topic.description}`);
        });
  });
});

export const topicSpec: Spec = spec;

