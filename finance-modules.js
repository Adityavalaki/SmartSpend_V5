// SmartSpend — Wallets, Goals & Splits module

function setWallet(w) {
  var id = w === 'cash' ? 'set-cash' : 'set-dig';
  var bal = parseFloat(document.getElementById(id).value || 0);
  if (isNaN(bal) || bal < 0) { toast('Invalid balance', 'error'); return; }
  POST(API + '/wallets.php?action=set_balance', {wallet:w, balance:bal}, function(err, r) {
    if (r && r.status === 'updated') {
      wallets[w] = bal;
      updateWalletUI();
      toast((w==='cash'?'Cash':'Digital') + ' wallet updated!', 'success');
    } else {
      toast('Failed to update', 'error');
    }
  });
}

function doTransfer() {
  var from = document.getElementById('tr-from').value;
  var to = document.getElementById('tr-to').value;
  var amt = parseFloat(document.getElementById('tr-amt').value || 0);
  var note = document.getElementById('tr-note').value.trim();
  if (!amt || amt <= 0) { toast('Enter amount', 'error'); return; }
  if (from === to) { toast('Cannot transfer to same wallet', 'error'); return; }
  POST(API + '/wallets.php?action=transfer', {from:from, to:to, amount:amt, note:note}, function(err, r) {
    if (r && r.status === 'transferred') {
      wallets[from] = Math.max(0, (wallets[from]||0) - amt);
      wallets[to] = (wallets[to]||0) + amt;
      updateWalletUI();
      document.getElementById('tr-amt').value = '';
      document.getElementById('tr-note').value = '';
      renderTransferHist();
      toast('Transferred ' + cur(amt, 2) + '!', 'success');
    } else {
      toast((r && r.error) ? r.error : 'Transfer failed', 'error');
    }
  });
}

function updateWalletUI() {
  var ids = ['w-cash-bal','dash-cash-bal'];
  ids.forEach(function(id){ var e=document.getElementById(id); if(e) e.textContent=cur(wallets.cash||0); });
  var ids2 = ['w-dig-bal','dash-dig-bal'];
  ids2.forEach(function(id){ var e=document.getElementById(id); if(e) e.textContent=cur(wallets.digital||0); });
}

function renderTransferHist() {
  var c = document.getElementById('tr-hist');
  if (!c) return;
  GET(API + '/wallets.php?action=transfers', function(err, r) {
    if (!r || !r.transfers || !r.transfers.length) {
      c.innerHTML = '<div class="emp"><span class="emp-ico">⇌</span><div class="emp-t">No Transfers Yet</div></div>';
      return;
    }
    c.innerHTML = r.transfers.map(function(t) {
      return '<div class="txi">' +
        '<div class="tx-ico">' + (t.from_wallet==='cash'?'💵':'💳') + '→' + (t.to_wallet==='cash'?'💵':'💳') + '</div>' +
        '<div class="tx-det"><div class="tx-cat">' + t.from_wallet + ' → ' + t.to_wallet + '</div><div class="tx-dsc">' + (t.note||'Transfer') + ' · ' + t.tx_date + '</div></div>' +
        '<div class="tx-meta"><div class="tx-amt income">+' + cfg.currency + fmt(t.amount,2) + '</div></div>' +
      '</div>';
    }).join('');
  });
}

function saveGoal() {
  var name = document.getElementById('g-name').value.trim();
  var amt = parseFloat(document.getElementById('g-amount').value);
  var date = document.getElementById('g-date').value;
  var saved = parseFloat(document.getElementById('g-saved').value) || 0;
  if (!name) { toast('Enter goal name', 'error'); return; }
  if (!amt || amt <= 0) { toast('Enter target amount', 'error'); return; }
  if (!date) { toast('Pick target date', 'error'); return; }
  POST(API + '/goals.php', {name:name, target_amount:amt, saved_amount:saved, target_date:date}, function(err, r) {
    if (r && r.goal) {
      var g = r.goal;
      g.target_amount = parseFloat(g.target_amount);
      g.saved_amount = parseFloat(g.saved_amount);
      goals.unshift(g);
      toast('Goal created!', 'success');
    } else {
      goals.unshift({name:name, target_amount:amt, saved_amount:saved, target_date:date, id:Date.now()});
      toast('Saved locally', 'info');
    }
    document.getElementById('g-name').value = '';
    document.getElementById('g-amount').value = '';
    document.getElementById('g-saved').value = '0';
    renderGoals();
  });
}

function delGoal(id) {
  if (!confirm('Delete goal?')) return;
  DEL(API + '/goals.php?id=' + id, function() {
    goals = goals.filter(function(g){ return g.id != id; });
    renderGoals();
    toast('Deleted', 'success');
  });
}

function renderGoals() {
  var c = document.getElementById('goals-list');
  if (!c) return;
  if (!goals.length) {
    c.innerHTML = '<div class="card"><div class="emp"><span class="emp-ico">🎯</span><div class="emp-t">No Goals Yet</div></div></div>';
    return;
  }
  c.innerHTML = goals.map(function(g) {
    var days = Math.ceil((new Date(g.target_date) - new Date()) / 86400000);
    var pct = Math.min(100, ((g.saved_amount||0) / g.target_amount) * 100);
    return '<div class="gc">' +
      '<div class="gt"><div><div class="gn">🎯 ' + g.name + '</div></div>' +
      '<div style="display:flex;gap:8px;align-items:center"><div class="gv">' + cur(g.target_amount) + '</div>' +
      '<button class="btn btn-d btn-s" onclick="delGoal(' + g.id + ')">✕</button></div></div>' +
      '<div class="pt"><div class="pf ' + (pct>=80?'g':pct>=40?'c':'y') + '" style="width:' + pct + '%"></div></div>' +
      '<div class="gm"><span>' + cur(g.saved_amount||0) + ' saved</span><span>' + pct.toFixed(0) + '%</span><span>' + Math.max(0,days) + 'd left</span></div>' +
    '</div>';
  }).join('');
}

function addPerson() {
  var c = document.getElementById('sp-people');
  var d = document.createElement('div');
  d.className = 'spr';
  d.innerHTML = '<input type="text" class="fi sp-n" placeholder="Name"><input type="number" class="fi sp-a" placeholder="₹" step="0.01" min="0" style="max-width:110px" inputmode="decimal"><button class="btn btn-d btn-s" onclick="this.parentElement.remove()">✕</button>';
  c.appendChild(d);
}

function saveSplit() {
  var total = parseFloat(document.getElementById('sp-amt').value);
  var desc = document.getElementById('sp-desc').value.trim();
  if (!total || total <= 0) { toast('Enter total', 'error'); return; }
  if (!desc) { toast('Enter description', 'error'); return; }
  var people = [];
  var rows = document.querySelectorAll('.spr');
  for (var i = 0; i < rows.length; i++) {
    var n = rows[i].querySelector('.sp-n').value.trim();
    var a = parseFloat(rows[i].querySelector('.sp-a').value);
    if (n && a > 0) people.push({name:n, amount:a});
  }
  if (people.length < 2) { toast('Add at least 2 people', 'error'); return; }
  var sum = people.reduce(function(s,p){ return s+p.amount; }, 0);
  if (Math.abs(sum - total) > 0.01) { toast('Amounts (' + cur(sum,2) + ') ≠ total (' + cur(total,2) + ')', 'error'); return; }
  POST(API + '/splits.php', {description:desc, total_amount:total, people:people}, function(err, r) {
    if (r && r.status === 'created') {
      splits.unshift({description:desc, total_amount:total, people:people, id:r.id, split_date:TODAY});
      toast('Split recorded!', 'success');
    }
    document.getElementById('sp-amt').value = '';
    document.getElementById('sp-desc').value = '';
    document.getElementById('sp-people').innerHTML = '';
    addPerson();
    renderSplitHist();
  });
}

function delSplit(id) {
  if (!confirm('Delete?')) return;
  DEL(API + '/splits.php?id=' + id, function() {
    splits = splits.filter(function(s){ return s.id != id; });
    renderSplitHist();
    toast('Deleted', 'success');
  });
}

function renderSplitHist() {
  var c = document.getElementById('split-hist');
  if (!c) return;
  if (!splits.length) {
    c.innerHTML = '<div class="emp"><span class="emp-ico">🤝</span><div class="emp-t">No Splits Yet</div></div>';
    return;
  }
  c.innerHTML = splits.map(function(s) {
    var people = (s.people||[]).map(function(p){ return p.name+': '+cfg.currency+fmt(p.amount,0); }).join(' · ');
    return '<div class="txi">' +
      '<div class="tx-ico">💸</div>' +
      '<div class="tx-det"><div class="tx-cat">' + s.description + '</div><div class="tx-dsc">' + people + '</div></div>' +
      '<div class="tx-meta"><div class="tx-amt expense">' + cfg.currency + fmt(s.total_amount,2) + '</div>' +
      '<div class="tx-dt">' + (s.split_date||'—') + '</div>' +
      '<button class="btn btn-d btn-s" onclick="delSplit(' + s.id + ')">✕</button></div>' +
    '</div>';
  }).join('');
}
