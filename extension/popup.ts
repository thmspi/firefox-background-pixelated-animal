const button = document.querySelector<HTMLButtonElement>("#open-settings")!;
button.addEventListener("click", () => {
  browser.runtime.openOptionsPage().then(() => window.close()).catch(() => {
    button.textContent = "Could not open settings";
  });
});
