// SmartSpend - lightweight runtime boot health checks
function ssHealthNotify(msg) {
  if (typeof window.toast === 'function') {
    window.toast(msg, 'error', 5000);
  }
  console.error('[HealthCheck] ' + msg);
}

function ssHealthCheckFunctions() {
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
    ssHealthNotify('Missing app modules/functions: ' + missing.join(', '));
    return false;
  }

  return true;
}

function ssHealthCheckDom() {
  var requiredIds = ['tab-dashboard', 'tab-transactions', 'tab-analytics', 'tab-settings'];
  var missing = requiredIds.filter(function (id) {
    return !document.getElementById(id);
  });

  if (missing.length) {
    ssHealthNotify('Missing required DOM sections: ' + missing.join(', '));
    return false;
  }

  return true;
}

function ssRunHealthChecks() {
  var okFunctions = ssHealthCheckFunctions();
  var okDom = ssHealthCheckDom();
  var build = window.__APP_BUILD__ || 'unknown-build';

  if (okFunctions && okDom) {
    console.info('[HealthCheck] SmartSpend runtime checks passed. Build: ' + build);
  }
}

document.addEventListener('DOMContentLoaded', ssRunHealthChecks);
