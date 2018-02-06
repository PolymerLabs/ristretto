import { Suite } from './suite.js';
import { Spec } from './spec.js';
import { Test, TestResult } from './test.js';

export enum ReporterEvent {
  suiteStart = 'SuiteStart',
  suiteEnd = 'SuiteEnd',
  specStart = 'SpecStart',
  specEnd = 'SpecEnd',
  testStart = 'TestStart',
  testEnd = 'TestEnd',
  unexpectedError = 'UnexpectedError'
};

export abstract class Reporter {
  disabled: boolean = false;

  dispatchEvent(eventName: ReporterEvent, ...args: any[]): boolean {
    const methodName = `on${eventName}` as keyof this;

    if (this.disabled || this[methodName] == null) {
      return false;
    }

    this[methodName](...args);
    return true;
  }

  onSuiteStart?(suite: Suite): void;
  onSuiteEnd?(suite: Suite): void;

  onSpecStart?(spec: Spec, suite: Suite): void;
  onSpecEnd?(spec: Spec, suite: Suite): void;

  onTestStart?(test: Test, suite: Suite): void;
  onTestEnd?(result: TestResult, test: Test, suite: Suite): void;

  onUnexpectedError?(message: string, error: Error, suite: Suite): void;
};
