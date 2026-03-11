/**
 * Go20 Combat Sync — Foundry VTT Module
 * 
 * Full-auto bidirectional combat sync with Go20.
 * Go20 is the source of truth for combat state.
 * Foundry reflects combat and pushes HP/condition changes back.
 */

import { registerSettings, getSetting } from "./settings.mjs";
import { Go20SyncEngine } from "./sync-engine.mjs";
import { registerCombatHooks } from "./combat-hooks.mjs";
import { Go20StatusUI } from "./ui.mjs";

let syncEngine = null;
let statusUI = null;

Hooks.once("init", () => {
  console.log("Go20 Sync | Initializing module...");
  registerSettings();
});

Hooks.once("ready", async () => {
  const apiKey = getSetting("apiKey");
  const endpoint = getSetting("apiEndpoint");

  statusUI = new Go20StatusUI();
  statusUI.render();

  if (!apiKey || !endpoint) {
    ui.notifications.warn(game.i18n.localize("GO20.Notification.ConfigMissing"));
    statusUI.setStatus("disconnected", game.i18n.localize("GO20.Status.Disconnected"));
    return;
  }

  syncEngine = new Go20SyncEngine(endpoint, apiKey, statusUI);

  // Test connection
  const connected = await syncEngine.ping();
  if (!connected) {
    statusUI.setStatus("error", game.i18n.localize("GO20.Status.Error"));
    return;
  }

  // Register hooks for Foundry → Go20 updates
  registerCombatHooks(syncEngine);

  // Start polling Go20 → Foundry
  syncEngine.startPolling();

  console.log("Go20 Sync | Module ready!");
});

Hooks.once("closeGame", () => {
  if (syncEngine) {
    syncEngine.stopPolling();
  }
});
