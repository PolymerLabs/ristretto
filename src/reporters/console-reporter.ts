import { Reporter } from '../reporter.js';
import { Suite } from '../suite.js';
import { Test, TestResult } from '../test.js';
import { Spec } from '../spec.js';

export class ConsoleReporter extends Reporter {
  onSpecStart(spec: Spec, _suite: Suite): void {
    if (spec.rootTopic != null) {
      console.log(`%c ${spec.rootTopic!.description} `,
          `background-color: #bef; color: #246;
          font-weight: bold; font-size: 24px;`);
    }
  }

  onTestEnd(result: TestResult, test: Test, _suite: Suite): void {
    const { config } = result;
    const resultString = result.passed ? ' PASSED ' : ' FAILED ';
    const resultColor = result.passed ? 'green' : 'red';
    const resultLog = [
      `${test.behaviorText}... %c${resultString}`,
      `color: #fff; font-weight: bold; background-color: ${resultColor}`
    ];

    // TODO(cdata): `isolated` is specific to `IsolatableTestConfig`. It would
    // be nice to generalize this somehow, perhaps with some kind of "flags"
    // array generated from the config or something.
    if ((config as any).isolated) {
      resultLog[0] = `%c ISOLATED %c ${resultLog[0]}`;
      resultLog.splice(1, 0,
          `background-color: #fd0; font-weight: bold; color: #830`, ``);
    }

    if (result.error && (result.error as any).stack) {
      console.error((result.error as any).stack);
    }

    console.log(...resultLog);
  }

  onUnexpectedError(message: string, error: Error, _suite: Suite): void {
    console.error(message);
    console.error(error.stack);
  }
}