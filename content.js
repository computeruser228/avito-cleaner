let settings = { enabled: true, mode: "hide" };
let timer;
let observer;

function isReserved(card) {
  return /забронировано/i.test(card.innerText || "");
}

function findCards() {
  const result = new Set();

  document.querySelectorAll("span, div").forEach(node => {
    if (node.children.length > 1) return;
    if (!/^забронировано$/i.test(node.textContent.trim())) return;

    let el = node;

    for (let i = 0; i < 8 && el.parentElement; i++) {
      el = el.parentElement;

      const hasImage = el.querySelector("img");
      const hasLink = el.querySelector('a[href*="/"]');
      const text = el.innerText || "";

      if (
        hasImage &&
        hasLink &&
        /₽/.test(text) &&
        text.length < 1200
      ) {
        result.add(el);
        break;
      }
    }
  });

  return [...result].filter(card =>
    ![...result].some(other =>
      other !== card && other.contains(card)
    )
  );
}


function processAds() {
  if (!settings.enabled) return;

  const cards = findCards();

  cards.forEach(card => {
    if (!isReserved(card)) return;

    let target = card;

    if (settings.mode === "hide") {
      for (let i = 0; i < 6; i++) {
        const parent = target.parentElement;
        if (!parent) break;

        const siblings = [...parent.children].filter(el =>
          el.querySelector?.("img") &&
          el.querySelector?.('a[href*="/"]')
        );

        if (siblings.length >= 2) break;

        target = parent;
      }

      target.style.setProperty("display", "none", "important");
    } else {
      card.dataset.blurredByExtension = "true";

      if (!hoveredCards.has(card)) {
        card.style.setProperty("filter", "blur(6px)", "important");
        card.style.setProperty("opacity", "0.55", "important");
      }
    }
  });
}

function startObserver() {
  if (observer) observer.disconnect();

  observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(processAds, 300);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function loadSettings() {
  chrome.storage.local.get(
    { enabled: true, mode: "hide" },
    data => {
      settings = data;
      processAds();
      startObserver();
    }
  );
}

loadSettings();

chrome.storage.onChanged.addListener(loadSettings);

function updateCategories() {
  chrome.storage.local.get(
    { hideCategories: false },
    data => {
      const selectors = [
        '[data-marker="visual-rubricator"]',
        '[data-marker="side-block"]'
      ];

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.style.setProperty(
            "display",
            data.hideCategories ? "none" : "",
            "important"
          );
        });
      });
    }
  );
}

updateCategories();

chrome.storage.onChanged.addListener(changes => {
  if (changes.hideCategories) {
    updateCategories();
  }
});

new MutationObserver(() => {
  updateCategories();
}).observe(document.documentElement, {
  childList: true,
  subtree: true
});

let unblurOnHover = false;

function loadUnblurSetting() {
  chrome.storage.local.get(
    { unblurOnHover: false },
    data => {
      unblurOnHover = data.unblurOnHover;
    }
  );
}

loadUnblurSetting();

chrome.storage.onChanged.addListener(changes => {
  if (changes.unblurOnHover) {
    unblurOnHover = changes.unblurOnHover.newValue;
  }
});

const hoveredCards = new WeakSet();

document.addEventListener("mouseover", event => {
  if (!unblurOnHover) return;

  const card = event.target.closest(
    '[data-blurred-by-extension="true"]'
  );

  if (!card || card.contains(event.relatedTarget)) return;

  hoveredCards.add(card);
  card.style.setProperty("filter", "none", "important");
  card.style.setProperty("opacity", "1", "important");
});

document.addEventListener("mouseout", event => {
  if (!unblurOnHover) return;

  const card = event.target.closest(
    '[data-blurred-by-extension="true"]'
  );

  if (!card || card.contains(event.relatedTarget)) return;

  hoveredCards.delete(card);
  card.style.setProperty("filter", "blur(6px)", "important");
  card.style.setProperty("opacity", "0.55", "important");
});