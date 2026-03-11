/**
 * Module Settings Registration
 */

const MODULE_ID = "go20-sync";

export function registerSettings() {
  game.settings.register(MODULE_ID, "apiEndpoint", {
    name: "GO20.Settings.ApiEndpoint",
    hint: "GO20.Settings.ApiEndpointHint",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register(MODULE_ID, "apiKey", {
    name: "GO20.Settings.ApiKey",
    hint: "GO20.Settings.ApiKeyHint",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register(MODULE_ID, "pollInterval", {
    name: "GO20.Settings.PollInterval",
    hint: "GO20.Settings.PollIntervalHint",
    scope: "world",
    config: true,
    type: Number,
    default: 3,
    range: { min: 1, max: 10, step: 1 },
  });

  game.settings.register(MODULE_ID, "autoSyncHp", {
    name: "GO20.Settings.AutoSyncHp",
    hint: "GO20.Settings.AutoSyncHpHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, "autoSyncConditions", {
    name: "GO20.Settings.AutoSyncConditions",
    hint: "GO20.Settings.AutoSyncConditionsHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, "debugMode", {
    name: "GO20.Settings.DebugMode",
    hint: "GO20.Settings.DebugModeHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  // Internal: stores combatant ID mapping { foundryId: go20Id }
  game.settings.register(MODULE_ID, "combatantMap", {
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });
}

export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

export function setSetting(key, value) {
  return game.settings.set(MODULE_ID, key, value);
}
