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
import { Reporter, ReporterEvent } from './reporter.js';
import { Fixturable, FixturedSpec } from './mixins/fixturable.js';
import { spy } from './helpers/spy.js';
import '../../../chai/chai.js';

const spec = Spec.create<FixturedSpec>(Fixturable);

const { expect } = (self as any).chai;
const { describe, it, before } = spec;

describe('Reporter', () => {
  describe('when extended', () => {
    before((context: any) => {
      class TestReporter extends Reporter {
        events: { event: ReporterEvent, args: any[] }[] = [];

        reporter(event: ReporterEvent, ...args: any[]) {
          this.events.push({ event, args });
          super.report(event, ...args);
        }
      }

      Object.keys(ReporterEvent).forEach((key: string) => {
        const event = (ReporterEvent as any)[key];
        spy(TestReporter.prototype, `on${event}`);
      });

      return {
        ...context,
        TestReporter
      };
    });

    describe('when reporting an event', () => {
      it('invokes the corresponding callback', ({ TestReporter }: any) => {
        const reporter = new TestReporter();
        reporter.report(ReporterEvent.testStart);
        expect(reporter.onTestStart.callCount).to.be.equal(1);
      });

      it('forwards arguments to the callback', ({ TestReporter }: any) => {
        const reporter = new TestReporter();
        reporter.report(ReporterEvent.specStart, 'foo');
        expect(reporter.onSpecStart.args).to.be.eql([['foo']]);
      });
    });
  });
});

export const reporterSpec: Spec = spec;
