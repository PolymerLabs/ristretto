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

/**
 * This helper is used to create spy functions, and replace methods on objects
 * in with those spy functions in hygeinic ways.
 *
 * A spy function records the number of times it has been called, the arguments
 * it was called with in call order, and has a method of its own to restore the
 * original method it replaced (if any).
 */
// TODO(cdata): consider just ripping this out entirely and using Sinon instead.
export const spy = (context?: any, methodName?: string) => {
  const callArgs: any[] = [];
  let callCount = 0;
  let originalMethod: Function | null = null;

  const spyMethod = (...args: any[]) => {
    callArgs.push(args);
    callCount++;
    if (originalMethod != null) {
      return originalMethod.call(context, ...args);
    }
  };

  const restore = () => {
    if (originalMethod != null) {
      context[methodName!] = originalMethod;
    }
  };

  if (context != null && methodName != null) {
    originalMethod = context[methodName] || null;
    context[methodName] = spyMethod;
  }


  Object.defineProperty(spyMethod, 'args', { get() { return callArgs; } });
  Object.defineProperty(spyMethod, 'callCount', {
    get() {
      return callCount;
    }
  });

  (spyMethod as any).restore = restore;

  return spyMethod;
};



