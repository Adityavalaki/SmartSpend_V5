// SmartSpend — lightweight UI polish (no command palette)
(function () {
  function setFooterYear() {
    var el = document.getElementById('footer-year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  document.addEventListener('DOMContentLoaded', function () {
    setFooterYear();
  });
})();
