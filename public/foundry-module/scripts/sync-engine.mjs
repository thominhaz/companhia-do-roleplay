/**
 * Go20 Sync Engine
 * 
 * Handles polling Go20 for combat state and pushing updates back.
 * Go20 is the source of truth — Foundry reflects its state.
 */

import { getSetting, setSetting } from "./settings.mjs";

export class Go20SyncEngine {
  constructor(endpoint, apiKey, statusUI) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.statusUI = statusUI;
    this.pollTimer = null;
    this.lastState = null;
    this.combatantMap = {}; // go20Id -> foundryTokenId
    this._pushing = false; // Prevent echo loops
  }

  _debug(...args) {
    if (getSetting("debugMode")) {
      console.log("Go20 Sync |", ...args);
    }
  }

  async _fetch(method, body = null) {
    const opts = {
      method,
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
    };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(this.endpoint, opts);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        this._debug("API error:", res.status, errData);
        return null;
      }
      return await res.json();
    } catch (e) {
      this._debug("Fetch error:", e.message);
      return null;
    }
  }

  // --- Connection test ---
  async ping() {
    const data = await this._fetch("POST", { action: "ping" });
    if (data?.success) {
      const msg = game.i18n.format("GO20.Notification.Connected", { campaign: data.campaign });
      ui.notifications.info(msg);
      this.statusUI.setStatus("connected", game.i18n.localize("GO20.Status.Connected"));
      return true;
    }
    return false;
  }

  // --- Polling: Go20 → Foundry ---
  startPolling() {
    const interval = (getSetting("pollInterval") || 3) * 1000;
    this._debug("Starting polling every", interval, "ms");

    this.pollTimer = setInterval(() => this._poll(), interval);
    this._poll(); // Immediate first poll
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async _poll() {
    const data = await this._fetch("GET");
    if (!data) {
      this.statusUI.setStatus("error", game.i18n.localize("GO20.Status.Error"));
      return;
    }

    if (!data.active) {
      this.statusUI.setStatus("connected", game.i18n.localize("GO20.Status.NoCombat"));
      this.lastState = null;
      return;
    }

    const count = data.combatants?.length || 0;
    this.statusUI.setStatus("syncing", game.i18n.localize("GO20.Status.Syncing"), count);

    // Detect new combat
    if (!this.lastState || this.lastState.encounter?.id !== data.encounter.id) {
      this._debug("New combat detected:", data.encounter.name);
      const msg = game.i18n.format("GO20.Notification.CombatDetected", { count });
      ui.notifications.info(msg);
      await this._matchCombatants(data.combatants);
    }

    // Apply updates from Go20 to Foundry tokens
    if (!this._pushing) {
      await this._applyGo20State(data);
    }

    this.lastState = data;
  }

  // --- Match Go20 combatants to Foundry actors/tokens by name ---
  async _matchCombatants(go20Combatants) {
    const map = {};
    const scene = canvas.scene;
    if (!scene) return;

    const tokens = scene.tokens.contents;

    for (const g of go20Combatants) {
      // Try exact name match first
      const nameNorm = g.name.toLowerCase().trim();
      let matched = tokens.find(t => t.name.toLowerCase().trim() === nameNorm);

      // Try partial match
      if (!matched) {
        matched = tokens.find(t => t.name.toLowerCase().includes(nameNorm) || nameNorm.includes(t.name.toLowerCase()));
      }

      if (matched) {
        map[g.id] = matched.id;
        this._debug(`Matched: ${g.name} → Token ${matched.name} (${matched.id})`);

        // Link foundry_id in Go20 for future lookups
        if (!g.foundry_id) {
          await this._fetch("POST", {
            action: "link_combatants",
            encounter_id: this.lastState?.encounter?.id || "",
            links: [{ combatant_id: g.id, foundry_id: matched.id }],
          });
        }
      } else {
        this._debug(`No match for: ${g.name}`);
        const msg = game.i18n.format("GO20.Notification.LinkError", { name: g.name });
        ui.notifications.warn(msg);
      }
    }

    this.combatantMap = map;
    await setSetting("combatantMap", map);
  }

  // --- Apply Go20 state to Foundry tokens ---
  async _applyGo20State(data) {
    const scene = canvas.scene;
    if (!scene) return;

    for (const g of data.combatants) {
      const tokenId = this.combatantMap[g.id];
      if (!tokenId) continue;

      const tokenDoc = scene.tokens.get(tokenId);
      if (!tokenDoc) continue;

      const actor = tokenDoc.actor;
      if (!actor) continue;

      // Get current Foundry values
      const fHP = actor.system?.attributes?.hp;
      if (!fHP) continue;

      const updates = {};
      
      // Sync HP: Go20 → Foundry (only if different)
      if (g.current_hp !== undefined && fHP.value !== g.current_hp) {
        updates["system.attributes.hp.value"] = g.current_hp;
        this._debug(`HP sync: ${g.name} ${fHP.value} → ${g.current_hp}`);
      }

      if (g.max_hp !== undefined && fHP.max !== g.max_hp) {
        updates["system.attributes.hp.max"] = g.max_hp;
      }

      // Sync AC
      if (g.armor_class !== undefined) {
        const fAC = actor.system?.attributes?.ac?.value;
        if (fAC !== undefined && fAC !== g.armor_class) {
          updates["system.attributes.ac.value"] = g.armor_class;
        }
      }

      if (Object.keys(updates).length > 0) {
        this._debug(`Updating token ${g.name}:`, updates);
        await actor.update(updates, { go20Sync: true });
      }

      // Sync conditions via ActiveEffects (D&D 5e)
      if (getSetting("autoSyncConditions") && g.conditions?.length >= 0) {
        await this._syncConditions(actor, g.conditions || []);
      }
    }
  }

  // --- Sync D&D 5e conditions ---
  async _syncConditions(actor, go20Conditions) {
    // Map Go20 condition names to Foundry status effect IDs
    const conditionMap = {
      "cego": "blind",
      "enfeitiçado": "charmed",
      "surdo": "deaf",
      "amedrontado": "frightened",
      "agarrado": "grappled",
      "incapacitado": "incapacitated",
      "invisível": "invisible",
      "paralisado": "paralyzed",
      "petrificado": "petrified",
      "envenenado": "poisoned",
      "caído": "prone",
      "contido": "restrained",
      "atordoado": "stunned",
      "inconsciente": "unconscious",
      // English fallbacks
      "blinded": "blind",
      "charmed": "charmed",
      "deafened": "deaf",
      "frightened": "frightened",
      "grappled": "grappled",
      "incapacitated": "incapacitated",
      "invisible": "invisible",
      "paralyzed": "paralyzed",
      "petrified": "petrified",
      "poisoned": "poisoned",
      "prone": "prone",
      "restrained": "restrained",
      "stunned": "stunned",
      "unconscious": "unconscious",
    };

    const desiredEffects = new Set();
    for (const c of go20Conditions) {
      const effectId = conditionMap[c.toLowerCase()] || c.toLowerCase();
      desiredEffects.add(effectId);
    }

    // Get current active effects that are status conditions
    const currentEffects = actor.effects.filter(e => e.statuses?.size > 0);
    const currentStatusIds = new Set();
    for (const e of currentEffects) {
      for (const s of e.statuses) currentStatusIds.add(s);
    }

    // Add missing conditions
    for (const effectId of desiredEffects) {
      if (!currentStatusIds.has(effectId)) {
        const effectData = CONFIG.statusEffects?.find(e => e.id === effectId);
        if (effectData) {
          await actor.toggleStatusEffect(effectId, { active: true });
          this._debug(`Added condition: ${effectId} to ${actor.name}`);
        }
      }
    }

    // Remove extra conditions
    for (const effectId of currentStatusIds) {
      if (!desiredEffects.has(effectId)) {
        await actor.toggleStatusEffect(effectId, { active: false });
        this._debug(`Removed condition: ${effectId} from ${actor.name}`);
      }
    }
  }

  // --- Push: Foundry → Go20 ---
  async pushHpUpdate(actor, tokenId, currentHp, maxHp, tempHp) {
    if (!getSetting("autoSyncHp")) return;

    this._pushing = true;

    // Find go20 combatant ID from map
    const go20Id = Object.entries(this.combatantMap).find(([, tid]) => tid === tokenId)?.[0];

    if (go20Id) {
      this._debug(`Pushing HP: ${actor.name} → ${currentHp}/${maxHp}`);
      await this._fetch("POST", {
        action: "update_combatant",
        combatant_id: go20Id,
        current_hp: currentHp,
        max_hp: maxHp,
      });
    } else {
      // Try by foundry_id
      await this._fetch("POST", {
        action: "foundry_hp_update",
        foundry_id: tokenId,
        current_hp: currentHp,
        max_hp: maxHp,
        temp_hp: tempHp,
      });
    }

    setTimeout(() => { this._pushing = false; }, 500);
  }

  async pushConditionUpdate(actor, tokenId, conditions) {
    if (!getSetting("autoSyncConditions")) return;
    
    this._pushing = true;

    const go20Id = Object.entries(this.combatantMap).find(([, tid]) => tid === tokenId)?.[0];

    if (go20Id) {
      this._debug(`Pushing conditions: ${actor.name} →`, conditions);
      await this._fetch("POST", {
        action: "update_combatant",
        combatant_id: go20Id,
        conditions,
      });
    }

    setTimeout(() => { this._pushing = false; }, 500);
  }
}
