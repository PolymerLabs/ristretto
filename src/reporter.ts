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

import { Suite } from './suite.js';
import { Spec } from './spec.js';
import { Test, TestResult } from './test.js';

/**
 * These are the events that represent the different stages of the reporting
 * lifecycle.
 */
export enum ReporterEvent {
  suiteStart = 'SuiteStart',
  suiteEnd = 'SuiteEnd',
  specStart = 'SpecStart',
  specEnd = 'SpecEnd',
  testStart = 'TestStart',
  testEnd = 'TestEnd',
  unexpectedError = 'UnexpectedError'
};

/**
 * A reporter is an object that implements some callbacks associated with
 * reporting lifecycle stages of interest. The default reporter has none
 * of these callbacks implemented.
 */
export abstract class Reporter {
  /**
   * If set to true, the reporter will not dispatch lifecycle event details
   * to its associated callbacks. This is useful for disabling reporting for
   * some stretch of time (for example, when a test is isolated).
   */
  disabled: boolean = false;

  /**
   * Dispatches an event's details to the appropriate lifecycle callback.
   */
  report(eventName: ReporterEvent, ...args: any[]): boolean {
    const methodName = `on${eventName}` as keyof this;

    if (this.disabled || this[methodName] == null) {
      return false;
    }

    this[methodName](...args);
    return true;
  }

  /**
   * Invoked just before a suite begins iterating over specs and invoking tests.
   */
  onSuiteStart?(suite: Suite): void;

  /**
   * Invoked after a suite has finished iterating over specs and invoking all
   * tests.
   */
  onSuiteEnd?(suite: Suite): void;

  /**
   * Invoked before each spec in the suite, before ivoking tests.
   */
  onSpecStart?(spec: Spec, suite: Suite): void;

  /**
   * Invoked for each spec in the suite, after all tests have been invoked.
   */
  onSpecEnd?(spec: Spec, suite: Suite): void;

  /**
   * Invoked for each test, before its implementation is invoked.
   */
  onTestStart?(test: Test, suite: Suite): void;

  /**
   * Invoked for each test, after its implementation has been invoked. Receives
   * the result of the test.
   */
  onTestEnd?(result: TestResult, test: Test, suite: Suite): void;

  /**
   * Invoked when there is an out-of-band error, such as an internal exception
   * of the test runner or one of its related mixins.
   */
  onUnexpectedError?(message: string, error: Error, suite: Suite): void;
};
