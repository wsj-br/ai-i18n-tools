/* global document, window */
/**
 * Navigates when a generated plain-HTML language <select data-lang-select> changes.
 * Option values are the locale page URLs. No inline handlers (CSP-friendly).
 */
(function () {
  "use strict";

  function bind(select) {
    if (select.hasAttribute("data-lang-select-bound")) return;
    select.setAttribute("data-lang-select-bound", "");
    select.addEventListener("change", function () {
      var value = select.value;
      if (value) window.location.assign(value);
    });
  }

  document.querySelectorAll("select[data-lang-select]").forEach(bind);
})();
