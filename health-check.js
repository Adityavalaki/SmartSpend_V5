// SmartSpend — lightweight runtime boot health checks
(function () {
  function notify(msg) {
    if (typeof window.toast === 'function') {
      window.toast(msg, 'error', 5000);
    }
    console.error('[HealthCheck] ' + msg);
  }

  function checkFunctions() {
    var required = [
      'goTab',
      'saveTx',
      'loadAllTx',
      'setWallet',
      'saveGoal',
      'saveSplit',
      'buildAnalyticsCharts',
      'saveSettings',
      'submitFeedback'
    ];

    var missing = required.filter(function (name) {
      return typeof window[name] !== 'function';
    });

    if (missing.length) {
      notify('Missing app modules/functions: ' + missing.join(', '));
      return false;
    }

    return true;
  }

  function checkDom() {
    var requiredIds = ['tab-dashboard', 'tab-transactions', 'tab-analytics', 'tab-settings'];
    var missing = requiredIds.filter(function (id) {
      return !document.getElementById(id);
    });

    if (missing.length) {
      notify('Missing required DOM sections: ' + missing.join(', '));
      return false;
    }

    return true;
  }

  function runChecks() {
    var okFunctions = checkFunctions();
    var okDom = checkDom();

    if (okFunctions && okDom) {
      console.info('[HealthCheck] SmartSpend runtime checks passed.');
    }
  }

  document.addEventListener('DOMContentLoaded', runChecks);
})();
