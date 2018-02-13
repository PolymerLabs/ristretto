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
import { Fixturable, FixturedSpec } from './mixins/fixturable.js';
import { Isolatable, IsolatedSpec } from './mixins/isolatable.js';
import { Constructor } from './util.js';

const UberSpec: Constructor<FixturedSpec & IsolatedSpec & Spec> =
    Fixturable(Isolatable(Spec));

export { UberSpec as Spec, Spec as BasicSpec, Fixturable, Isolatable };
export { Suite } from './suite.js';
export { Reporter } from './reporter.js';
export { ConsoleReporter } from './reporters/console-reporter.js';
export { timePasses, timeLimit } from './util.js';
export { spy } from './helpers/spy.js';

