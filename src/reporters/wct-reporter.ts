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
import { Suite } from '../suite.js';
import { Test, TestResult } from '../test.js';
import { Spec } from '../spec.js';

type WCTTestState = 'passing' | 'failing' | 'pending' | 'unknown';

function getState(result: TestResult): WCTTestState {
  // TODO(dfreedm): when "skipped" state is supported, return "pending"
  if (result.passed) {
    return 'passing';
  } else if (result.error) {
    return 'failing';
  } else {
    return 'unknown';
  }
}

export class WCTReporter extends Reporter {
  private socket: SocketIO.Socket;
  private browserId: string;
  private testStart: number = 0;

  constructor(socket: SocketIO.Socket) {
    super();
    this.socket = socket;
  }

  private emit(event: string, data?: any) {
    this.socket.emit('client-event', {
      browserId: this.browserId,
      event,
      data
    });
  }

  onUnexpectedError(message: string, error: Error, _suite: Suite) {
    this.emit('browser-fail',
      `Error thrown outside of test function: ${message}\n${error.stack}`
    );
  }

  onSuiteStart(suite: Suite) {
    this.browserId = suite.queryParams['cli_browser_id'] || '0';
    this.emit('browser-start', {
      url: window.location.toString()
    });
  }

  onSuiteEnd(_suite: Suite) {
    this.emit('browser-end');
  }

  onSpecStart(_spec: Spec, _suite: Suite) {
    this.emit('sub-suite-start');
  }

  onSpecEnd(_spec: Spec, _suite: Suite) {
    this.emit('sub-suite-end');
  }

  onTestStart(test: Test, _suite: Suite) {
    this.testStart = performance.now();
    this.emit('test-start', {
      test: [test.behaviorText]
    });
  }

  onTestEnd(result: TestResult, test: Test, _suite: Suite) {
    this.emit('test-end', {
      state: getState(result),
      test: [test.behaviorText],
      duration: performance.now() - this.testStart,
      error: result.error
    });
  }
}