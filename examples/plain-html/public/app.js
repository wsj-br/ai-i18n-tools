/* global document */
(function () {
  "use strict";

  function wireTabs() {
    const tabs = document.getElementById("tabs");
    if (!tabs) return;

    tabs.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-tab]");
      if (!btn) return;

      const tabId = btn.getAttribute("data-tab");
      tabs.querySelectorAll("button[data-tab]").forEach((el) => {
        el.classList.toggle("active", el === btn);
      });
      document.querySelectorAll(".panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === `panel-${tabId}`);
      });
    });
  }

  function wireFilterDemo() {
    const clearBtn = document.getElementById("btn-clear");
    const applyBtn = document.getElementById("btn-apply");
    const filename = document.getElementById("filter-filename");

    if (clearBtn && filename) {
      clearBtn.addEventListener("click", () => {
        filename.value = "";
        document.getElementById("filter-locale").value = "";
        document.getElementById("filter-status").value = "";
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        /* static demo — no backend */
      });
    }
  }

  wireTabs();
  wireFilterDemo();
})();
