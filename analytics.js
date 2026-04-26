// SmartSpend — analytics & charting module

function buildDashCharts(md) {
  var cc = chartColors();
  var cats = {};
  md.filter(function(t){ return t.type==='expense'; }).forEach(function(t){
    cats[t.category] = (cats[t.category]||0) + t.amount;
  });
  if (charts.cat) { charts.cat.destroy(); charts.cat = null; }
  var c1 = document.getElementById('catChart');
  var keys = Object.keys(cats);
  if (c1 && keys.length) {
    charts.cat = new Chart(c1, {
      type:'doughnut',
      data:{labels:keys, datasets:[{data:keys.map(function(k){return cats[k];}), backgroundColor:PAL, borderColor:'transparent', borderWidth:0, hoverOffset:6}]},
      options:{responsive:true, maintainAspectRatio:false, cutout:'64%', plugins:{legend:{position:'bottom', labels:{color:cc.color, font:{size:10}, padding:9, boxWidth:8}}}}
    });
  }
  var cashExp = md.filter(function(t){return t.type==='expense'&&t.pay_mode==='cash';}).reduce(function(s,t){return s+t.amount;},0);
  var digExp = md.filter(function(t){return t.type==='expense'&&t.pay_mode!=='cash';}).reduce(function(s,t){return s+t.amount;},0);
  if (charts.mode) { charts.mode.destroy(); charts.mode = null; }
  var c2 = document.getElementById('modeChart');
  if (c2 && (cashExp || digExp)) {
    charts.mode = new Chart(c2, {
      type:'doughnut',
      data:{labels:['💵 Cash','💳 Digital'], datasets:[{data:[cashExp,digExp], backgroundColor:['rgba(245,158,11,.7)','rgba(59,130,246,.7)'], borderColor:['#f59e0b','#3b82f6'], borderWidth:2, hoverOffset:6}]},
      options:{responsive:true, maintainAspectRatio:false, cutout:'64%', plugins:{legend:{position:'bottom', labels:{color:cc.color, font:{size:11, weight:'600'}, padding:12, boxWidth:10}}}}
    });
  }
}

function buildAnalyticsCharts() {
  var md = monthTxs();
  var cc = chartColors();
  var modes = {};
  md.filter(function(t){return t.type==='expense';}).forEach(function(t){
    modes[t.pay_mode] = (modes[t.pay_mode]||0) + t.amount;
  });
  if (charts.pm) { charts.pm.destroy(); charts.pm = null; }
  var c1 = document.getElementById('pmChart');
  var mkeys = Object.keys(modes);
  if (c1 && mkeys.length) {
    charts.pm = new Chart(c1, {
      type:'doughnut',
      data:{labels:mkeys.map(function(k){return MODE_LABEL[k]||k;}), datasets:[{data:mkeys.map(function(k){return modes[k];}), backgroundColor:PAL, borderColor:'transparent', borderWidth:0}]},
      options:{responsive:true, maintainAspectRatio:false, cutout:'60%', plugins:{legend:{position:'bottom', labels:{color:cc.color, font:{size:10}, padding:8, boxWidth:8}}}}
    });
  }
  var cashExp = md.filter(function(t){return t.type==='expense'&&t.pay_mode==='cash';}).reduce(function(s,t){return s+t.amount;},0);
  var digExp  = md.filter(function(t){return t.type==='expense'&&t.pay_mode!=='cash';}).reduce(function(s,t){return s+t.amount;},0);
  var cashInc = md.filter(function(t){return t.type==='income'&&t.pay_mode==='cash';}).reduce(function(s,t){return s+t.amount;},0);
  var digInc  = md.filter(function(t){return t.type==='income'&&t.pay_mode!=='cash';}).reduce(function(s,t){return s+t.amount;},0);
  if (charts.cd) { charts.cd.destroy(); charts.cd = null; }
  var c2 = document.getElementById('cdChart');
  if (c2) {
    charts.cd = new Chart(c2, {
      type:'bar',
      data:{labels:['Cash In','Cash Out','Digital In','Digital Out'], datasets:[{data:[cashInc,cashExp,digInc,digExp], backgroundColor:['rgba(29,233,130,.55)','rgba(245,158,11,.55)','rgba(76,143,255,.55)','rgba(255,79,109,.55)'], borderColor:['#1de982','#f59e0b','#4c8fff','#ff4f6d'], borderWidth:1.5, borderRadius:8}]},
      options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{color:cc.grid}, ticks:{color:cc.color, font:{size:10}}}, y:{grid:{color:cc.grid}, ticks:{color:cc.color, font:{size:10}}}}}
    });
  }
  GET(API + '/analytics.php?action=monthly_report&month=' + (NOW.getMonth()+1) + '&year=' + NOW.getFullYear(), function(err, mr) {
    if (charts.mo) { charts.mo.destroy(); charts.mo = null; }
    var c3 = document.getElementById('moChart');
    if (c3 && mr && mr.months) {
      charts.mo = new Chart(c3, {
        type:'bar',
        data:{labels:mr.months.map(function(m){return m.label;}), datasets:[
          {label:'Income', data:mr.months.map(function(m){return m.income;}), backgroundColor:'rgba(29,233,130,.4)', borderColor:'#1de982', borderWidth:1.5, borderRadius:5},
          {label:'Expense', data:mr.months.map(function(m){return m.expense;}), backgroundColor:'rgba(255,79,109,.4)', borderColor:'#ff4f6d', borderWidth:1.5, borderRadius:5}
        ]},
        options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:cc.color, font:{size:10}}}}, scales:{x:{grid:{color:cc.grid}, ticks:{color:cc.color, font:{size:10}}}, y:{grid:{color:cc.grid}, ticks:{color:cc.color, font:{size:10}}}}}
      });
    }
  });
  var cats = {};
  md.filter(function(t){return t.type==='expense';}).forEach(function(t){ cats[t.category]=(cats[t.category]||0)+t.amount; });
  var sorted = Object.keys(cats).map(function(c){return [c,cats[c]];}).sort(function(a,b){return b[1]-a[1];});
  var total = sorted.reduce(function(s,c){return s+c[1];},0) || 1;
  var cr = document.getElementById('cat-rank');
  if (cr) cr.innerHTML = sorted.map(function(item, i) {
    var pct = (item[1]/total*100).toFixed(1);
    return '<div style="margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
        '<span style="font-size:12px;font-weight:600">' + catEmoji(item[0]) + ' ' + item[0] + '</span>' +
        '<span style="font-family:var(--fm);font-size:11px;color:var(--cyan)">' + cur(item[1],0) + ' · ' + pct + '%</span>' +
      '</div>' +
      '<div class="pt"><div class="pf" style="width:' + pct + '%;background:' + PAL[i%PAL.length] + '"></div></div>' +
    '</div>';
  }).join('');
}

function rebuildCharts() {
  var md = monthTxs();
  setTimeout(function() {
    buildDashCharts(md);
    var ana = document.getElementById('tab-analytics');
    if (ana && ana.style.display !== 'none') buildAnalyticsCharts();
  }, 100);
}
