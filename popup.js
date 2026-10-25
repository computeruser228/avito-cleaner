const enabled = document.getElementById("enabled");
const mode = document.getElementById("mode");
const hideCategories = document.getElementById("hideCategories");
const unblurOnHover = document.getElementById("unblurOnHover");
const save = document.getElementById("save");

chrome.storage.local.get(
  {
    enabled: true,
    mode: "hide",
    hideCategories: false,
    unblurOnHover: false
  },
  data => {
    enabled.checked = data.enabled;
    mode.value = data.mode;
    hideCategories.checked = data.hideCategories;
    unblurOnHover.checked = data.unblurOnHover;
  }
);

save.addEventListener("click", () => {
  chrome.storage.local.set({
    enabled: enabled.checked,
    mode: mode.value,
    hideCategories: hideCategories.checked,
    unblurOnHover: unblurOnHover.checked
  });
});