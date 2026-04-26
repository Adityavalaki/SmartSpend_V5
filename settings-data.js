// SmartSpend — settings & data export module

function saveSettings() {
  cfg.currency = document.getElementById('cur-sel').value;
  POST(API + '/settings.php', {currency:cfg.currency}, function(err, r) {
    var hc = document.getElementById('hdr-cur');
    if (hc) hc.textContent = cfg.currency;
    toast(r ? 'Saved!' : 'Saved locally', r ? 'success' : 'info');
    updateDashboard();
  });
}

function exportCSV() {
  var rows = [['Date','Category','Type','Pay Mode','Amount','Description','Recurring']];
  txs.forEach(function(t){ rows.push([t.tx_date, t.category, t.type, t.pay_mode, t.amount, t.description||'', t.recurring?'Yes':'No']); });
  dl(rows.map(function(r){ return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(','); }).join('\n'), 'smartspend-'+TODAY+'.csv', 'text/csv');
  toast('CSV exported!', 'success');
}

function exportJSON() {
  dl(JSON.stringify({transactions:txs, goals:goals, splits:splits, wallets:wallets, settings:cfg, exported:new Date().toISOString()}, null, 2), 'smartspend-backup-'+TODAY+'.json', 'application/json');
  toast('Backup saved!', 'success');
}

function dl(content, fname, mime) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type:mime}));
  a.download = fname;
  a.click();
  URL.revokeObjectURL(a.href);
}

function copySum() {
  var md = monthTxs();
  var inc = md.filter(function(t){return t.type==='income';}).reduce(function(s,t){return s+t.amount;},0);
  var exp = md.filter(function(t){return t.type==='expense';}).reduce(function(s,t){return s+t.amount;},0);
  var cashExp = md.filter(function(t){return t.type==='expense'&&t.pay_mode==='cash';}).reduce(function(s,t){return s+t.amount;},0);
  var text = '📊 SmartSpend — ' + NOW.toLocaleString('en-IN',{month:'long',year:'numeric'}) +
    '\n💰 Income: ' + cur(inc,2) + '\n📉 Expenses: ' + cur(exp,2) +
    '\n💵 Cash: ' + cur(cashExp,2) + ' | 💳 Digital: ' + cur(exp-cashExp,2) +
    '\n💎 Saved: ' + cur(inc-exp,2) +
    '\n👛 Cash Wallet: ' + cur(wallets.cash||0) + ' | Digital: ' + cur(wallets.digital||0);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function(){ toast('Copied!', 'success'); });
  } else {
    prompt('Copy:', text);
  }
}

function restoreData() {
  var inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json';
  inp.onchange = function(ev) {
    var r = new FileReader();
    r.onload = function(e) {
      try {
        var d = JSON.parse(e.target.result);
        txs = d.transactions || [];
        goals = d.goals || [];
        splits = d.splits || [];
        if (d.wallets) wallets = d.wallets;
        if (d.settings) { cfg.budgetLimit=d.settings.budgetLimit||cfg.budgetLimit; cfg.currency=d.settings.currency||cfg.currency; }
        updateDashboard(); renderGoals(); renderSplitHist();
        toast('Restored!', 'success');
      } catch(err) { toast('Restore failed', 'error'); }
    };
    r.readAsText(ev.target.files[0]);
  };
  inp.click();
}

function clearAll() {
  if (!confirm('Delete ALL data?')) return;
  if (!confirm('Final confirmation?')) return;
  txs=[]; goals=[]; splits=[]; wallets={cash:0,digital:0};
  updateDashboard(); renderGoals(); renderSplitHist();
  toast('Cleared', 'success');
}
