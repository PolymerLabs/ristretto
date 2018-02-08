import { Spec } from './spec.js';
import { Fixturable } from './mixins/fixturable.js';
import { Topic } from './topic.js';
import '../../../chai/chai.js';

const spec = new (Fixturable(Spec))();

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

