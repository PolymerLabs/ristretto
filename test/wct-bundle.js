(() => {
  'use strict';

  let rootUrl = new URL(window.location);

  window.WCT = window.WCT || {};
  window.WCT.loadSuites = async function(files) {
    const {WCTReporter} = await import('../lib/reporters/wct-reporter.js');
    const {Suite} = await import ('../lib/suite.js');
    // only use JS files for now
    let scripts = files.filter((f) => f.slice('-2') === 'js');
    // import all the "suites" as JS modules
    let modules = await Promise.all(scripts.map(s => import(new URL(s, rootUrl).href)));
    // map the module to the spec from the module
    let specs = modules.map(m => m.spec);
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
      })
    }
  };
})();