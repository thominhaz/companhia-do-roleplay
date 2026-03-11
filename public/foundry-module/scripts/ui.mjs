/**
 * Go20 Status UI — HUD indicator for sync status
 */

export class Go20StatusUI {
  constructor() {
    this.element = null;
    this.status = "disconnected";
    this.text = "Go20";
    this.badge = null;
  }

  render() {
    // Remove existing
    document.getElementById("go20-status-indicator")?.remove();

    const el = document.createElement("div");
    el.id = "go20-status-indicator";
    el.title = "Go20 Combat Sync";
    el.innerHTML = `
      <span class="go20-dot disconnected"></span>
      <span class="go20-text">Go20</span>
    `;

    el.addEventListener("click", () => {
      // Open module settings on click
      const app = game.settings.sheet;
      app.render(true);
      // Could also show a custom dialog with sync details
    });

    document.body.appendChild(el);
    this.element = el;
  }

  setStatus(status, text, badgeCount = null) {
    if (!this.element) return;

    this.status = status;
    this.text = text;

    const dot = this.element.querySelector(".go20-dot");
    dot.className = `go20-dot ${status}`;

    const textEl = this.element.querySelector(".go20-text");
    textEl.textContent = text;

    // Badge
    let badgeEl = this.element.querySelector(".go20-badge");
    if (badgeCount !== null && badgeCount > 0) {
      if (!badgeEl) {
        badgeEl = document.createElement("span");
        badgeEl.className = "go20-badge";
        this.element.appendChild(badgeEl);
      }
      badgeEl.textContent = `${badgeCount}`;
    } else if (badgeEl) {
      badgeEl.remove();
    }
  }
}
