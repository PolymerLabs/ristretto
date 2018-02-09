(() => {
  'use strict';

  let rootUrl = new URL(window.location);

  window.WCT = window.WCT || {};
  window.WCT.loadSuites = async function(files) {
    // import required library components
    const {WCTReporter} = await import('../lib/reporters/wct-reporter.js');
    const {Suite, Spec} = await import ('../lib/index.js');
    // only use JS files for now
    let scripts = files.filter((f) => f.slice('-2') === 'js');
    // import all the "suites" as JS modules
    let modules = await Promise.all(
      scripts.map(
        (s) => import(new URL(s, rootUrl).href)
      )
    );
    // map the module object to the exported specs
    let specs = [];
    modules.forEach((m) => {
      Object.keys(m).forEach((s) => {
        if (m[s] instanceof Spec) {
          specs.push(m[s]);
        }
      });
    });
    // If isolated, just run it
    if (rootUrl.searchParams.has('testrunner_isolated')) {
      new Suite(specs).run();
    } else {
      // Create socket to WCT
      const socket = io(`${window.location.protocol}//${window.location.host}`);
      // wait for WCT connection
      socket.on('connect', () => {
        // Disable two-way reporting
        socket.off();
        // Start tests
        new Suite(specs, new WCTReporter(socket)).run();
      });
    }
  };
})();