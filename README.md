*🚨 **PROJECT STATUS: EXPERIMENTAL** 🚨This product is in the Experimentation phase. Someone on the team thinks it’s an idea worth exploring, but it may not go any further than this. Use at your own risk.*

# Ristretto

Ristretto is an extensible test runner.

There are several established test runners in the JavaScript ecosystem
([Mocha](https://mochajs.org/), [Jasmine](https://jasmine.github.io/) and
[Jest](https://facebook.github.io/jest/) to name a few of the more prominent
ones). Ristretto was created to address a feature sweet spot left unaddressed
by incumbent projects.

Ristretto has the following qualities:

 - Simple, concise, class-based factorization
 - Consumable as modules with browser-compatible path specifiers OOB
 - Batteries included for the most popular testing syntaxes (BDD/TDD)
 - Designed for extensibility (mixins, specialized reporters and a
 spec-as-data-structure philosophy)
 - Ships with mixins that enhance specs with powerful features (e.g., fixtures
 and test isolation)
 - Authored in TypeScript
 - No build tooling required to use
 - "JavaScript is the native language, The Web is the native land"

Ristretto is intended to be a single-responsibility detail of a broader, more
comprehensive testing regime. In this regard, it is most similar to Mocha in its
breadth of capabilities.

Currently, Ristretto only supports direct usage in a web browser with ESM
support. Other browsers and platforms (such as Node.js) should work fine with
sufficient code transformations applied to this module.

## Installing

```sh
npm install @polymer/ristretto
```

## Writing tests

All tests start with crafting a spec and exporting that spec for consumption
elsewhere. Here is an example of a spec written with Ristretto:

```javascript
// Import the Spec class from Ristretto:
import { Spec } from '../../@polymer/ristretto/lib/spec.js';

// Create a Spec instance that represents our spec:
const spec = new Spec();

// These "describe" and "it" methods work as you would expect when writing
// a test in Mocha, Jasmine or Jest:
const { describe, it } = spec;

// Author your spec as you would in any other test runner:
describe('My spec', () => {
  it('never fails', () => {});
});

// Export the spec as a module:
export { spec as mySpec };
```

## Running tests

In order to run the tests in your spec, you will need to craft a test suite.
A test suite is a collection of specs, and an optional specialized test
reporter. Here is a basic example of crafting a test suite and running tests:

```javascript
// Import the Suite class from Ristretto:
import { Suite } from '../../@polymer/ristretto/lib/suite.js';

// Import the spec we crafted above:
import { mySpec } from './my-spec.js';

// Craft a suite that includes our spec:
const suite = new Suite([ mySpec /*, other, specs, go, here */ ]);

// Run the test suite at your leisure. It will return a promise that resolves
// when all tests have been run:
suite.run();
```

## Reporting results

By default, Ristretto will use a basic `console`-based reporter called
`ConsoleReporter`. However, it is very easy to craft a custom reporter to
suite your needs. Let's write a custom reporter that counts tests and
reports how many failed at the end of the test suite run:

```javascript
// Import the base Reporter class from Ristretto:
import { Reporter } from '../../@polymer/ristretto/lib/reporter.js';

// We export a class that extends the base Reporter class. The reporter has
// a series of test suite life-cycle callbacks that can be optionally
// implemented by child classes to perform specialized reporting. We implement
// a few of them here:
export class CountingReporter extends Reporter {

  onSuiteStart(suite) {
    // Initialize some state when the test suite begins:
    this.totalTestCount = 0;
    this.failedTestCount = 0;
  }

  onTestStart(test, suite) {
    // When a test starts, increment the total test counter:
    this.totalTestCount++;
  }

  onTestEnd(result, test, suite) {
    // If there is an error in the result when a test ends, increment the
    // failed test counter:
    if (result.error) {
      this.failedTestCount++;
    }
  }

  onSuiteEnd(suite) {
    // When the test suite run has completed, announce the total number of
    // tests, and if there were any failed tests announce that number as well:
    console.log(`Total tests: ${this.totalTestCount}`);
    if (this.failedTestCount > 0) {
      console.error(`Failed tests: ${this.failedTestCount}`);
    } else {
      console.log('All tests pass!');
    }
  }
}
```

Now that we have a custom reporter, let's use it in a test suite:

```javascript
// Import the Suite class from Ristretto:
import { Suite } from '../../@polymer/ristretto/lib/suite.js';

// Import the custom reporter we created:
import { CountingReporter } from './counting-reporter.js';

// Craft a suite that includes any specs and our custom reporter:
const suite = new Suite([ /* specs, go, here */ ], new CountingReporter());

// Run the test suite at your leisure. The suite will invoke reporter callbacks
// is testing progresses to completion:
suite.run();
```

