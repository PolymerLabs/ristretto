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
import { Test } from './test.js';
import { Reporter, ReporterEvent } from './reporter.js';
import { ConsoleReporter } from './reporters/console-reporter.js';

/**
 * These are the query params that are observed and used as configuration by a
 * `Suite` if they are present in the URL. In the base implementation, these
 * are primarily used when running tests in a specialized fashion.
 */
export interface SuiteQueryParams {
  [index:string]: string | void;
  ristretto_suite_address?: string;
  ristretto_disable_reporting?: void;
}

/**
 * A `SuiteAddress` describes the logical position of a `Test` in the hierarchy
 * of a given `Suite`. It always points to a `Spec` by index, a `Topic` by array
 * of indicies (e.g., `[0, 1, 2]` would refer to the second subtopic of the
 * first subtopic of the zeroeth root topic of a given `Spec`), and a `Test` by
 * index.
 */
export interface SuiteAddress {
  spec: number;
  topic: number[];
  test: number;
}

/**
 * A `Suite` represents an ordered set of `Spec` instances. Typically, `Spec`
 * instances are created for each module in a library to represent their
 * relevant topics and tests, and then imported and composed into a `Suite` in
 * order to be invoked. For example:
 *
 * ```javascript
 * import { Suite } from '../../@polymer/ristretto/suite.js';
 * import { fooSpec } from './lib/foo-spec.js';
 * import { barSpec } from './lib/bar-spec.js';
 *
 * const suite = new Suite([
 *   fooSpec,
 *   barSpec
 * ]);
 *
 * // Start the test suite:
 * suite.run();
 * ```
 */
export class Suite {
  protected specs: Spec[];
  protected address: SuiteAddress | null;

  readonly reporter: Reporter;
  readonly queryParams: SuiteQueryParams;

  /**
   * The only argument that the base implementation receives is an array of
   * the specs it consists of, in the order that they should be invoked.
   */
  constructor(specs: Spec[] = [], reporter: Reporter = new ConsoleReporter()) {
    this.specs = specs;
    this.reporter = reporter;

    const queryParams: SuiteQueryParams = {};
    if (window.location != null && window.location.search != null) {
      window.location.search.slice(1).split('&').reduce((map, part) => {
        const parts = part.split('=');
        map[parts[0]] = decodeURIComponent(parts[1]);
        return map;
      }, queryParams);
    };

    this.queryParams = queryParams;
    this.address = queryParams.ristretto_suite_address
        ? JSON.parse(queryParams.ristretto_suite_address) as SuiteAddress
        : null;

    if ('ristretto_disable_reporting' in queryParams) {
      this.reporter.disabled = true;
    }
  }

  /**
   * Looks up a test within the current suite hierarchy by address. Returns
   * `null` if no test is found at the given address.
   */
  getTestByAddress(address: SuiteAddress): Test | null {
    const spec = this.specs[address.spec];
    const test = spec ? spec.getTestByAddress(address) : null;

    return test;
  }

  /**
   * Resolves an address for a given test within the current suite hierarchy.
   */
  getAddressForTest(test: Test): SuiteAddress {
    let { topic } = test;
    const testIndex = topic ? topic.tests.indexOf(test) : -1;
    const topicAddress = [];
    let specIndex = -1;

    while (topic != null) {
      const { parentTopic } = topic;

      if (parentTopic != null) {
        topicAddress.unshift(parentTopic.topics.indexOf(topic));
      } else {
        for (let i = 0; i < this.specs.length; ++i) {
          const spec = this.specs[i];

          if (spec.rootTopic === topic) {
            specIndex = i;
          }
        }
      }

      topic = parentTopic;
    }

    return { spec: specIndex, topic: topicAddress, test: testIndex };
  }

  /**
   * This method invokes the `Test`s in the `Spec`s in the `Suite`. If there
   * is a `SuiteAddress` described in the query parameters of the current
   * URL, it will invoke only the test that corresponds to that address.
   * Otherwise, it will invoke all tests sequentially in a deterministic order.
   * The returned promise resolves when all test invocations have completed.
   *
   * TODO(cdata): This method should probably also accept and respect an address
   * for a given test to run as an argument.
   */
  async run() {
    const { reporter, address } = this;
    const soloTest = address ? this.getTestByAddress(address) : null;
    const soloSpec = address ? this.specs[address.spec] : null;

    reporter.report(ReporterEvent.suiteStart, this);

    for (const spec of this.specs) {
      reporter.report(ReporterEvent.specStart, spec, this);

      if (soloSpec != null && spec !== soloSpec) {
        continue;
      }

      for (const test of spec) {
        if (soloTest != null && test !== soloTest) {
          continue;
        }

        reporter.report(ReporterEvent.testStart, test, this);

        const result = await test.run(this);

        reporter.report(ReporterEvent.testEnd, result, test, this);
      }

      reporter.report(ReporterEvent.specEnd, spec, this);
    }

    reporter.report(ReporterEvent.suiteEnd, this);
  }

  /**
   * The total number of tests in suite, including in all spec topics and their
   * sub-topics.
   */
  get totalTestCount() {
    let count = 0;

    for (const spec of this.specs) {
      count += spec.totalTestCount;
    }

    return count;
  }

  /**
   * Iterate over all tests in the suite.
   */
  *[Symbol.iterator](): IterableIterator<Test> {
    const { specs } = this;

    for (let i = 0; i < specs.length; ++i) {
      const spec = specs[i];

      for (const test of spec) {
        yield test;
      }
    }
  }
}
