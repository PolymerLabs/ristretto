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

import { Reporter } from '../reporter.js';
import { TestResult } from '../test.js';

export interface SpecResult {
  testResults: TestResult[];
}

export interface SuiteResult {
  specResults: SpecResult[];
}

/**
 * TestReporter provides a Reporter that accumulates test results
 * from a Suite run into the `results` property as an array.
 *
 * This is intended to be used for testing mixins that modify test results.
 */
export class TestReporter extends Reporter {
  suiteResult: SuiteResult = {specResults: []};

  /**
   * An array of test results from the Suite run.
   * Example:
   * ```js
   * const reporter = new TestReporter();
   * const suite = new Suite([spec], reporter);
   * await suite.run();
   * console.log(reporter.results);
   * ```
   */
  get results(): TestResult[] {
    const results: TestResult[] = [];
    for (const spec of this.suiteResult.specResults) {
      for (const test of spec.testResults) {
        results.push(test);
      }
    }
    return results;
  }

  onSpecStart() {
    this.suiteResult.specResults.push({
      testResults: []
    });
  }

  onTestEnd(result: TestResult) {
    const srs = this.suiteResult.specResults;
    const spec = srs[srs.length - 1];
    spec.testResults.push(result);
  }
}