// SmartSpend — Transactions module

function txCard(t, showDel) {
  var isCash = t.pay_mode === 'cash';
  var mTag = '<span class="tag ' + (isCash ? 'tag-cash' : 'tag-dig') + '">' + (MODE_LABEL[t.pay_mode] || t.pay_mode) + '</span>';
  var delBtn = showDel ? '<button class="btn btn-d btn-s" onclick="delTx(' + t.id + ')">✕</button>' : '';
  var sign = t.type === 'expense' ? '−' : '+';
  var date = new Date(t.tx_date).toLocaleDateString('en-IN', {day:'2-digit', month:'short'});
  return '<div class="txi">' +
    '<div class="tx-ico">' + catEmoji(t.category) + '</div>' +
    '<div class="tx-det">' +
      '<div class="tx-cat">' + t.category + (t.recurring ? '<span class="tag tag-r">REC</span>' : '') + '</div>' +
      '<div class="tx-dsc">' + mTag + ' ' + (t.description || '—') + '</div>' +
    '</div>' +
    '<div class="tx-meta">' +
      '<div class="tx-amt ' + t.type + '">' + sign + cfg.currency + fmt(t.amount, 2) + '</div>' +
      '<div class="tx-dt">' + date + '</div>' +
      delBtn +
    '</div>' +
  '</div>';
}

function renderRecent(md) {
  var sorted = md.slice().sort(function(a,b){ return new Date(b.tx_date) - new Date(a.tx_date); }).slice(0, 10);
  var c = document.getElementById('recent-list');
  if (!c) return;
  c.innerHTML = sorted.length ? sorted.map(function(t){ return txCard(t, false); }).join('') :
    '<div class="emp"><span class="emp-ico">📭</span><div class="emp-t">No Transactions Yet</div></div>';
}

function loadAllTx() {
  var typeEl = document.getElementById('f-type');
  var modeEl = document.getElementById('f-mode');
  var searchEl = document.getElementById('search');
  var monthEl = document.getElementById('f-month');
  var type = typeEl ? typeEl.value : '';
  var mode = modeEl ? modeEl.value : '';
  var search = searchEl ? searchEl.value.toLowerCase() : '';
  var mf = monthEl ? monthEl.value : '';

  var f = txs.slice().sort(function(a,b){ return new Date(b.tx_date) - new Date(a.tx_date); });
  if (type) f = f.filter(function(t){ return t.type === type; });
  if (mode) f = f.filter(function(t){ return t.pay_mode === mode; });
  if (mf) {
    var parts = mf.split('-');
    f = f.filter(function(t) {
      var d = new Date(t.tx_date);
      return d.getFullYear() == parts[0] && (d.getMonth()+1) == parts[1];
    });
  }
  if (search) f = f.filter(function(t){
    return (t.category + ' ' + (t.description||'') + ' ' + t.amount + ' ' + t.pay_mode).toLowerCase().indexOf(search) > -1;
  });

  var badge = document.getElementById('tx-badge');
  if (badge) badge.textContent = f.length + ' RECORDS';
  var c = document.getElementById('all-tx');
  if (c) c.innerHTML = f.length ? f.map(function(t){ return txCard(t, true); }).join('') :
    '<div class="emp"><span class="emp-ico">📭</span><div class="emp-t">No Results</div></div>';
}

function filterTx() { loadAllTx(); }

function buildFilterMonth() {
  var months = {};
  txs.forEach(function(t) {
    var d = new Date(t.tx_date);
    months[d.getFullYear() + '-' + (d.getMonth()+1)] = true;
  });
  var sel = document.getElementById('f-month');
  if (!sel) return;
  sel.innerHTML = '<option value="">All Months</option>';
  Object.keys(months).sort().reverse().forEach(function(m) {
    var parts = m.split('-');
    var lbl = new Date(parts[0], parts[1]-1, 1).toLocaleString('en-IN', {month:'long', year:'numeric'});
    sel.innerHTML += '<option value="' + m + '">' + lbl + '</option>';
  });
}

function syncWalletBalances() {
  GET(API + '/wallets.php', function(err, wr) {
    if (wr && wr.wallets) {
      wallets = wr.wallets;
      if (typeof updateWalletUI === 'function') updateWalletUI();
      updateDashboard();
    }
  });
}

function delTx(id) {
  if (!confirm('Delete?')) return;
  DEL(API + '/transactions.php?id=' + id, function(err, r) {
    txs = txs.filter(function(t){ return t.id != id; });
    syncWalletBalances();
    loadAllTx(); buildFilterMonth();
    toast('Deleted', 'success');
  });
}

function buildPmGrid() {
  var c = document.getElementById('pm-grid');
  if (!c) return;
  c.innerHTML = MODES.map(function(m) {
    return '<div class="pm-opt" onclick="selMode(this,\'' + m.k + '\')" data-mode="' + m.k + '">' +
      '<span class="pm-ico">' + m.ico + '</span>' +
      '<div class="pm-lbl">' + m.lbl + '</div>' +
      '<span class="pm-tag ' + (m.isCash?'c':'d') + '">' + m.tag + '</span>' +
    '</div>';
  }).join('');
  var first = c.querySelector('.pm-opt');
  if (first) selMode(first, 'cash');
}

function selMode(el, key) {
  var all = document.querySelectorAll('.pm-opt');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('sel', 'cash-mode', 'dig-mode');
  el.classList.add('sel');
  el.classList.add(key === 'cash' ? 'cash-mode' : 'dig-mode');
  document.getElementById('f-mode2').value = key;
}

function updateCats() {
  var typeEl = document.getElementById('f-type2');
  var type = typeEl ? typeEl.value : 'expense';
  var c = document.getElementById('f-cats');
  if (!c) return;
  c.innerHTML = CATS[type].map(function(cat) {
    return '<div class="ci" onclick="selCat(this,\'' + cat.n.replace(/'/g,"\\'") + '\')">' +
      '<span class="ce">' + cat.e + '</span><span class="cn">' + cat.n + '</span></div>';
  }).join('');
  document.getElementById('f-cat').value = '';
}

function selCat(el, name) {
  var all = document.querySelectorAll('.ci');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('sel');
  el.classList.add('sel');
  document.getElementById('f-cat').value = name;
}

function onTypeChange() {
  updateCats();
  var badge = document.getElementById('add-badge');
  var type = document.getElementById('f-type2');
  if (badge && type) badge.textContent = type.value.toUpperCase();
}

function saveTx() {
  var amount = parseFloat(document.getElementById('f-amount').value);
  var cat = document.getElementById('f-cat').value;
  var type = document.getElementById('f-type2').value;
  var date = document.getElementById('f-date').value;
  var pm = document.getElementById('f-mode2').value || 'cash';
  var desc = document.getElementById('f-desc').value.trim();
  var rec = document.getElementById('recur-tog').classList.contains('on');

  if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
  if (!cat) { toast('Select a category', 'error'); return; }
  if (!date) { toast('Select a date', 'error'); return; }

  POST(API + '/transactions.php', {amount:amount, category:cat, type:type, pay_mode:pm, date:date, description:desc, recurring:rec}, function(err, r) {
    if (r && r.transaction) {
      var t = r.transaction;
      t.amount = parseFloat(t.amount);
      t.recurring = !!parseInt(t.recurring);
      txs.unshift(t);
      var walletKey = pm === 'cash' ? 'cash' : 'digital';
      wallets[walletKey] = (wallets[walletKey] || 0) + (type === 'income' ? amount : -amount);
      if (typeof updateWalletUI === 'function') updateWalletUI();
      toast('Saved! ' + (MODE_LABEL[pm] || pm), 'success');
    } else {
      txs.unshift({amount:amount, category:cat, type:type, pay_mode:pm, tx_date:date, description:desc, recurring:rec, id:Date.now()});
      toast('Saved locally', 'info');
    }
    clearForm();
    updateDashboard();
    buildFilterMonth();
    syncWalletBalances();
  });
}

function clearForm() {
  document.getElementById('f-amount').value = '';
  document.getElementById('f-desc').value = '';
  document.getElementById('f-date').value = TODAY;
  document.getElementById('f-cat').value = '';
  document.getElementById('recur-tog').classList.remove('on');
  var all = document.querySelectorAll('.ci, .pm-opt');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('sel','cash-mode','dig-mode');
  buildPmGrid();
}
