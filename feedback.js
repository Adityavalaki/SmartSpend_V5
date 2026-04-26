// SmartSpend — Feedback module
var fbRating = 0;

function initFeedbackUI() {
  var stars = document.querySelectorAll('.star');
  for (var i = 0; i < stars.length; i++) {
    (function(star) {
      star.addEventListener('click', function() {
        fbRating = parseInt(star.getAttribute('data-v'));
        document.getElementById('fb-rating').value = fbRating;
        var allStars = document.querySelectorAll('.star');
        for (var j = 0; j < allStars.length; j++) {
          allStars[j].textContent = j < fbRating ? '★' : '☆';
          allStars[j].style.color = j < fbRating ? '#ffb800' : 'var(--tx3)';
        }
      });
    })(stars[i]);
  }
}

async function submitFeedback() {
  var rating  = parseInt(document.getElementById('fb-rating').value);
  var name    = document.getElementById('fb-name').value.trim();
  var message = document.getElementById('fb-msg').value.trim();

  if (rating === 0) { toast('Please select a star rating', 'error'); return; }
  if (!message)     { toast('Please write a message', 'error'); return; }

  var uid = await _uid();
  var res = await _sb.from('ss_feedback').insert({
    user_id: uid,
    name:    name || 'Anonymous',
    rating:  rating,
    message: message
  });

  if (res.error) { toast('Failed to submit. Try again.', 'error'); return; }

  document.getElementById('fb-thanks').style.display = 'flex';
  document.getElementById('fb-msg').value = '';
  document.getElementById('fb-name').value = '';
  fbRating = 0;
  document.querySelectorAll('.star').forEach(function(s) {
    s.textContent = '☆'; s.style.color = 'var(--tx3)';
  });
  document.getElementById('fb-rating').value = '0';
  loadFeedback();
  toast('Feedback submitted! 🎉', 'success');
}

function loadFeedback() {
  _sb.from('ss_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
    .then(function(res) {
      var c = document.getElementById('fb-list');
      if (!c) return;
      if (!res.data || !res.data.length) {
        c.innerHTML = '<div class="emp"><span class="emp-ico">💬</span><div class="emp-t">No feedback yet. Be the first!</div></div>';
        return;
      }
      c.innerHTML = res.data.map(function(f) {
        var stars = '';
        for (var i = 1; i <= 5; i++) {
          stars += '<span style="color:' + (i <= f.rating ? '#ffb800' : 'var(--tx3)') + '">' + (i <= f.rating ? '★' : '☆') + '</span>';
        }
        var date = new Date(f.created_at).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
        return '<div class="txi" style="flex-direction:column;align-items:flex-start;gap:6px">' +
          '<div style="display:flex;justify-content:space-between;width:100%;align-items:center">' +
            '<div style="font-weight:700;font-size:13px">👤 ' + (f.name || 'Anonymous') + '</div>' +
            '<div style="font-size:11px;color:var(--tx3);font-family:var(--fm)">' + date + '</div>' +
          '</div>' +
          '<div>' + stars + '</div>' +
          '<div style="font-size:13px;color:var(--tx2);line-height:1.5">' + f.message + '</div>' +
        '</div>';
      }).join('');
    });
}

document.addEventListener('DOMContentLoaded', function() {
  initFeedbackUI();
});
