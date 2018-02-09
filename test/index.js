import {Spec, Suite, Isolatable} from '../lib/index.js';

export const spec = new (Isolatable(Spec))();
const {describe, it} = spec;

describe('test-runner tests', () => {
  it('normal', () => {});
  it('isolated', () => {
  }, {isolated: true})
});