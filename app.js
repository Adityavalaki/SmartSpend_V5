// SmartSpend v4.0 — app.js
// Fully self-contained, no CSS class dependency for tab switching

var API = 'api';
var TODAY = new Date().toISOString().split('T')[0];
var NOW = new Date();
var txs = [], goals = [], splits = [], wallets = {cash:0, digital:0};
var cfg = {budgetLimit:5000, alertThreshold:80, savingsTarget:1000, currency:'₹'};
var charts = {};

var MODES = [
  {k:'cash',       ico:'💵', lbl:'Cash',    tag:'CASH',    isCash:true},
  {k:'upi',        ico:'📱', lbl:'UPI',     tag:'DIGITAL', isCash:false},
  {k:'credit_card',ico:'💳', lbl:'Credit',  tag:'DIGITAL', isCash:false},
  {k:'debit_card', ico:'🏧', lbl:'Debit',   tag:'DIGITAL', isCash:false},
  {k:'net_banking',ico:'🌐', lbl:'NetBank', tag:'DIGITAL', isCash:false}
];
var MODE_LABEL = {cash:'💵 Cash',upi:'📱 UPI',credit_card:'💳 Credit',debit_card:'🏧 Debit',net_banking:'🌐 Net'};
var CATS = {
  expense:[
    {n:'Food & Dining',e:'🍔'},{n:'Transport',e:'🚌'},{n:'Accommodation',e:'🏠'},
    {n:'Entertainment',e:'🎮'},{n:'Subscriptions',e:'📱'},{n:'Utilities',e:'💡'},
    {n:'Study',e:'📚'},{n:'Clothing',e:'👕'},{n:'Health',e:'⚕️'},
    {n:'Gym',e:'💪'},{n:'Personal Care',e:'💄'},{n:'Tuition',e:'🎓'},
    {n:'Gifting',e:'🎁'},{n:'Events',e:'🎉'},{n:'Misc',e:'📌'}
  ],
  income:[
    {n:'Salary',e:'💼'},{n:'Freelance',e:'💻'},{n:'Part-time',e:'👨‍💼'},
    {n:'Allowance',e:'👨‍👩‍👧'},{n:'Gift',e:'🎁'},{n:'Investment',e:'📈'},
    {n:'Scholarship',e:'🏅'},{n:'Bonus',e:'🏆'},{n:'Other',e:'📌'}
  ]
};
var PAL = ['#00d4b8','#8b5cf6','#ff4f6d','#1de982','#ffb800','#4c8fff','#e040fb','#f48fb1','#80cbc4','#fff176','#a5d6a7','#ce93d8','#80deea','#ffcc80','#b0bec5'];
var ALL_TABS = ['dashboard','wallets','transactions','add','budget','goals','split','analytics','settings','feedback']

// ═══════════════════════════════
// TAB SYSTEM — pure JS, no CSS dependency
// ═══════════════════════════════
function goTab(name) {
  // Hide ALL tabs using inline style
  ALL_TABS.forEach(function(t) {
    var el = document.getElementById('tab-' + t);
    if (el) {
      el.style.cssText = 'display:none!important';
    }
  });

  if (name === 'feedback') { loadFeedback(); }
  // Show target tab
  var target = document.getElementById('tab-' + name);
  if (target) {
    target.style.cssText = 'display:block!important';
  }

  // Update nav button highlights
  var allBtns = document.querySelectorAll('.dn, .bn');
  for (var i = 0; i < allBtns.length; i++) {
    allBtns[i].classList.remove('on');
    if (allBtns[i].getAttribute('data-tab') === name) {
      allBtns[i].classList.add('on');
    }
  }

  // Tab-specific actions
  if (name === 'transactions') { loadAllTx(); buildFilterMonth(); }
  if (name === 'analytics') { setTimeout(buildAnalyticsCharts, 100); }
  if (name === 'dashboard') { updateDashboard(); }
  if (name === 'wallets') { renderTransferHist(); }

  window.scrollTo(0, 0);
}

// ═══════════════════════════════
// TOAST
// ═══════════════════════════════
function toast(msg, type, dur) {
  type = type || 'info';
  dur = dur || 3000;
  var c = document.getElementById('tc');
  if (!c) return;
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span>' + (type==='success'?'✅':type==='error'?'❌':'ℹ️') + '</span><span>' + msg + '</span>';
  c.appendChild(el);
  setTimeout(function() { if(el.parentNode) el.parentNode.removeChild(el); }, dur);
}

// ═══════════════════════════════
// THEME
// ═══════════════════════════════
function setTheme(v) {
  localStorage.setItem('ss-theme', v);
  var h = document.documentElement;
  h.removeAttribute('data-theme');
  if (v === 'dark' || v === 'light') h.setAttribute('data-theme', v);
  var btn = document.getElementById('theme-btn');
  var isDark = v==='dark' || (v==='auto' && window.matchMedia('(prefers-color-scheme:dark)').matches);
  if (btn) btn.textContent = isDark ? '🌙' : '☀️';
  var sel = document.getElementById('theme-sel');
  if (sel) sel.value = v;
  setTimeout(rebuildCharts, 100);
}
function toggleTheme() {
  var cur = localStorage.getItem('ss-theme') || 'auto';
  var isDark = cur==='dark' || (cur==='auto' && window.matchMedia('(prefers-color-scheme:dark)').matches);
  setTheme(isDark ? 'light' : 'dark');
}
function initTheme() {
  setTheme(localStorage.getItem('ss-theme') || 'auto');
}

// ═══════════════════════════════
// API HELPERS
// ═══════════════════════════════
// ═══════════════════════════════
// STATUS CHECK
// ═══════════════════════════════
function checkStatus() {
  _sb.from('ss_transactions').select('id').limit(1)
    .then(function(res) {
      var ok = !res.error;
      ['api-dot','php-dot','db-dot'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.className = ok ? 'dot' : 'dot off';
      });
      ['api-lbl','php-st','db-st'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = ok ? 'Live' : 'Offline';
      });
    });
}
// ═══════════════════════════════
// LOAD ALL DATA
// ═══════════════════════════════
var loadCount = 0;
function checkAllLoaded() {
  loadCount++;
  if (loadCount >= 5) {
    applySettings();
    updateDashboard();
    renderGoals();
    renderSplitHist();
    buildFilterMonth();
  }
}

function loadAll() {
  loadCount = 0;

  GET(API + '/settings.php', function(err, sr) {
    if (sr && sr.settings) {
      var s = sr.settings;
      if (s.budget_limit) cfg.budgetLimit = parseFloat(s.budget_limit);
      if (s.alert_threshold) cfg.alertThreshold = parseFloat(s.alert_threshold);
      if (s.savings_target) cfg.savingsTarget = parseFloat(s.savings_target);
      if (s.currency) cfg.currency = s.currency;
    }
    checkAllLoaded();
  });

  GET(API + '/transactions.php?limit=5000', function(err, tr) {
    if (tr && tr.transactions) {
      txs = tr.transactions.map(function(t) {
        t.amount = parseFloat(t.amount);
        t.recurring = !!parseInt(t.recurring);
        return t;
      });
    }
    checkAllLoaded();
  });

  GET(API + '/goals.php', function(err, gr) {
    if (gr && gr.goals) {
      goals = gr.goals.map(function(g) {
        g.target_amount = parseFloat(g.target_amount);
        g.saved_amount = parseFloat(g.saved_amount);
        return g;
      });
    }
    checkAllLoaded();
  });

  GET(API + '/splits.php', function(err, sr) {
    if (sr && sr.splits) {
      splits = sr.splits.map(function(s) {
        s.total_amount = parseFloat(s.total_amount);
        return s;
      });
    }
    checkAllLoaded();
  });

  GET(API + '/wallets.php', function(err, wr) {
    if (wr && wr.wallets) wallets = wr.wallets;
    checkAllLoaded();
  });
}

function applySettings() {
  var bl = document.getElementById('b-limit');
  var bt = document.getElementById('b-thresh');
  var bta = document.getElementById('b-target');
  var cs = document.getElementById('cur-sel');
  var hc = document.getElementById('hdr-cur');
  if (bl) bl.value = cfg.budgetLimit;
  if (bt) bt.value = cfg.alertThreshold;
  if (bta) bta.value = cfg.savingsTarget;
  if (cs) cs.value = cfg.currency;
  if (hc) hc.textContent = cfg.currency;
}

// ═══════════════════════════════
// HELPERS
// ═══════════════════════════════
function monthTxs(m, y) {
  m = (m === undefined) ? NOW.getMonth() : m;
  y = (y === undefined) ? NOW.getFullYear() : y;
  return txs.filter(function(t) {
    var d = new Date(t.tx_date);
    return d.getMonth() === m && d.getFullYear() === y;
  });
}
function catEmoji(c) {
  var all = CATS.expense.concat(CATS.income);
  for (var i = 0; i < all.length; i++) {
    if (all[i].n === c) return all[i].e;
  }
  return '💰';
}
function fmt(n, d) { return (parseFloat(n) || 0).toFixed(d || 0); }
function cur(n, d) { return cfg.currency + fmt(n, d || 0); }
function isDark() {
  var v = localStorage.getItem('ss-theme') || 'auto';
  return v === 'dark' || (v === 'auto' && window.matchMedia('(prefers-color-scheme:dark)').matches);
}
function chartColors() {
  return {
    color: isDark() ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.45)',
    grid:  isDark() ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)'
  };
}

// ═══════════════════════════════
// DASHBOARD
// ═══════════════════════════════
function updateDashboard() {
  var md = monthTxs();
  var inc = 0, exp = 0, cashExp = 0, digExp = 0, cashInc = 0, digInc = 0, todayExp = 0;

  md.forEach(function(t) {
    if (t.type === 'income') {
      inc += t.amount;
      if (t.pay_mode === 'cash') cashInc += t.amount;
      else digInc += t.amount;
    } else {
      exp += t.amount;
      if (t.pay_mode === 'cash') cashExp += t.amount;
      else digExp += t.amount;
      if (t.tx_date === TODAY) todayExp += t.amount;
    }
  });

  var bal = inc - exp;
  var bl = Math.max(0, cfg.budgetLimit - exp);

  var budSwitch = document.getElementById('bud-switch');
  var budActive = budSwitch && budSwitch.checked;
  var pBud = document.getElementById('p-bud');
  var budFormula = document.getElementById('bud-formula');
  if (pBud) {
    if (budActive && cfg.budgetLimit > 0) {
      pBud.textContent = cur(bl);
      pBud.style.color = bl === 0 ? 'var(--red)' : 'var(--cyan)';
      if (budFormula) budFormula.textContent = '(' + fmt(cfg.budgetLimit) + ' − ' + fmt(exp) + ')';
    } else {
      pBud.textContent = cfg.budgetLimit > 0 ? '—' : '—';
      pBud.style.color = 'var(--tx3)';
      if (budFormula) budFormula.textContent = cfg.budgetLimit > 0 ? '(limit − expense)' : '';
    }
  }

  function set(id, val) { var e = document.getElementById(id); if(e) e.textContent = val; }

  set('month-label', NOW.toLocaleString('en-IN', {month:'long', year:'numeric'}));
  set('bal-val', Math.abs(bal).toFixed(2));
  set('p-inc', cur(inc));
  set('p-exp', cur(exp));
  set('s-today', cur(todayExp));
  set('s-inc', cur(inc));
  set('s-cash', cur(cashExp));
  set('s-dig', cur(digExp));
  set('dash-cash-bal', cur(wallets.cash || 0));
  set('dash-dig-bal', cur(wallets.digital || 0));
  set('dash-cash-in', '+' + cur(cashInc));
  set('dash-cash-out', '-' + cur(cashExp));
  set('dash-dig-in', '+' + cur(digInc));
  set('dash-dig-out', '-' + cur(digExp));

  var beq = document.getElementById('bal-eq');
  if (beq) { beq.textContent = cur(bal); beq.className = bal >= 0 ? 'pos' : 'neg'; }

  updateBudgetUI(exp, cashExp, digExp);
  buildInsightsLocal(md, exp, inc);
  renderRecent(md);
  buildDashCharts(md);
}

function updateBudgetUI(exp, cashExp, digExp) {
  var rem = Math.max(0, cfg.budgetLimit - exp);
  var pct = cfg.budgetLimit > 0 ? Math.min(100, exp / cfg.budgetLimit * 100) : 0;
  function set(id, val) { var e = document.getElementById(id); if(e) e.textContent = val; }
  set('b-lim-d', fmt(cfg.budgetLimit));
  set('b-spent', fmt(exp));
  set('b-rem', fmt(rem));
  set('b-cash', fmt(cashExp));
  set('b-dig', fmt(digExp));
  set('b-pct', pct.toFixed(0) + '% used');
  var bar = document.getElementById('b-bar');
  if (bar) {
    bar.style.width = pct + '%';
    bar.className = 'pf ' + (pct > 90 ? 'r' : pct > 70 ? 'y' : 'c');
  }
}

function buildInsightsLocal(md, exp, inc) {
  var c = document.getElementById('ins-box');
  if (!c) return;
  var pct = cfg.budgetLimit > 0 ? (exp / cfg.budgetLimit * 100) : 0;
  var ins = [];
  if (pct >= 100) ins.push({type:'danger', icon:'🚨', title:'Budget Exceeded!', text:'Overspent by ' + cur(exp - cfg.budgetLimit)});
  else if (pct >= cfg.alertThreshold) ins.push({type:'warning', icon:'⚠️', title:'Budget Alert', text:pct.toFixed(0) + '% of monthly budget used'});
  else ins.push({type:'success', icon:'✅', title:'On Track', text:pct.toFixed(0) + '% used — ' + cur(cfg.budgetLimit - exp) + ' remaining'});
  if (inc > 0) {
    var rate = (inc - exp) / inc * 100;
    ins.push({type: rate >= 20 ? 'success' : 'info', icon:'💰', title:'Savings: ' + rate.toFixed(0) + '%', text: rate >= 20 ? 'Great! Saving ' + cur(inc - exp) + ' this month.' : 'Target 20%+.'});
  }
  var cashExp = md.filter(function(t){return t.type==='expense'&&t.pay_mode==='cash';}).reduce(function(s,t){return s+t.amount;},0);
  if (exp > 0) ins.push({type:'info', icon:'💳', title:'Payment Split', text:'Cash: ' + cur(cashExp) + ' · Digital: ' + cur(exp - cashExp)});
  c.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:18px">' + ins.map(insCard).join('') + '</div>';
}
function insCard(i) {
  return '<div class="ic ' + i.type + '"><div class="ic-ico">' + i.icon + '</div><div><div class="ic-t">' + i.title + '</div><div class="ic-b">' + i.text + '</div></div></div>';
}

// ═══════════════════════════════
// BUDGET
// ═══════════════════════════════
function saveBudget() {
  cfg.budgetLimit = parseFloat(document.getElementById('b-limit').value) || 5000;
  cfg.alertThreshold = parseFloat(document.getElementById('b-thresh').value) || 80;
  cfg.savingsTarget = parseFloat(document.getElementById('b-target').value) || 1000;
  POST(API + '/settings.php', {budget_limit:cfg.budgetLimit, alert_threshold:cfg.alertThreshold, savings_target:cfg.savingsTarget}, function(err, r) {
    toast(r ? 'Budget saved!' : 'Saved locally', r ? 'success' : 'info');
    updateDashboard();
  });
}

// Charts/data/export logic extracted to analytics.js and settings-data.js

// ═══════════════════════════════
// INIT
// ═══════════════════════════════
function init() {
  sbCheckSession();
  initTheme();

  _sb.auth.getUser().then(function(r) {
  if (r.data.user) {
    var name = r.data.user.user_metadata.name || r.data.user.email;
    var el = document.getElementById('user-name');
    var av = document.getElementById('user-av');
    if (el) el.textContent = name;
    if (av) av.textContent = name.charAt(0).toUpperCase();
  }
  });
  // Set dates
  var fd = document.getElementById('f-date');
  if (fd) fd.value = TODAY;
  var gd = new Date(); gd.setMonth(gd.getMonth()+3);
  var gdate = document.getElementById('g-date');
  if (gdate) gdate.value = gd.toISOString().split('T')[0];

  buildPmGrid();
  updateCats();
  addPerson();
  loadAll();
  checkStatus();
  setInterval(checkStatus, 30000);
}

// ═══════════════════════════════
// BOOT — runs when page is ready
// ═══════════════════════════════
// Inject tab CSS immediately — before DOM ready
(function(){
  var s = document.createElement('style');
  s.textContent = '.tab{display:none!important}';
  document.head.appendChild(s);
})();

document.addEventListener('DOMContentLoaded', function() {
   sbCheckSession(); // redirects to login.html if not logged in
  // Force hide all tabs
  var names = ['dashboard','wallets','transactions','add','budget','goals','split','analytics','settings'];
  names.forEach(function(name) {
    var el = document.getElementById('tab-' + name);
    if (el) {
      el.setAttribute('style', 'display:none!important');
    }
  });

  // Show dashboard
  var dash = document.getElementById('tab-dashboard');
  if (dash) dash.setAttribute('style', 'display:block!important');

  // Attach nav clicks
  var btns = document.querySelectorAll('.dn, .bn');
  for (var i = 0; i < btns.length; i++) {
    (function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var name = btn.getAttribute('data-tab');
        if (name) goTab(name);
      });
    })(btns[i]);
  }

  init();
});

function toggleBudgetLeft() {
  updateDashboard();
}
