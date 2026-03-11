/**
 * Foundry VTT Hooks for pushing changes to Go20
 * 
 * Listens for HP, condition, and combat state changes in Foundry
 * and pushes them to Go20 via the sync engine.
 */

export function registerCombatHooks(syncEngine) {

  // --- Actor HP changes → Push to Go20 ---
  Hooks.on("updateActor", (actor, changes, options) => {
    // Skip updates that came FROM Go20 sync (prevent echo)
    if (options?.go20Sync) return;

    const hp = changes?.system?.attributes?.hp;
    if (!hp) return;

    // Find token for this actor in the current scene
    const token = canvas.scene?.tokens.find(t => t.actorId === actor.id);
    if (!token) return;

    const currentHp = hp.value ?? actor.system.attributes.hp.value;
    const maxHp = hp.max ?? actor.system.attributes.hp.max;
    const tempHp = hp.temp ?? actor.system.attributes.hp.temp ?? 0;

    syncEngine.pushHpUpdate(actor, token.id, currentHp, maxHp, tempHp);
  });

  // --- Token HP changes (unlinked tokens) → Push to Go20 ---
  Hooks.on("updateToken", (tokenDoc, changes, options) => {
    if (options?.go20Sync) return;

    const hp = changes?.actorData?.system?.attributes?.hp ?? changes?.delta?.system?.attributes?.hp;
    if (!hp) return;

    const actor = tokenDoc.actor;
    if (!actor) return;

    const currentHp = hp.value ?? actor.system.attributes.hp.value;
    const maxHp = hp.max ?? actor.system.attributes.hp.max;
    const tempHp = hp.temp ?? actor.system.attributes.hp.temp ?? 0;

    syncEngine.pushHpUpdate(actor, tokenDoc.id, currentHp, maxHp, tempHp);
  });

  // --- Active Effect changes (conditions) → Push to Go20 ---
  Hooks.on("createActiveEffect", (effect, options) => {
    if (options?.go20Sync) return;
    _pushConditionsForActor(effect.parent, syncEngine);
  });

  Hooks.on("deleteActiveEffect", (effect, options) => {
    if (options?.go20Sync) return;
    _pushConditionsForActor(effect.parent, syncEngine);
  });

  syncEngine._debug("Combat hooks registered");
}

function _pushConditionsForActor(actor, syncEngine) {
  if (!actor) return;

  const token = canvas.scene?.tokens.find(t => t.actorId === actor.id);
  if (!token) return;

  // Collect all active status effect IDs
  const conditions = [];
  for (const effect of actor.effects) {
    if (effect.statuses?.size > 0) {
      for (const s of effect.statuses) {
        conditions.push(s);
      }
    }
  }

  // Map Foundry status IDs back to Go20 Portuguese names
  const reverseMap = {
    "blind": "Cego",
    "charmed": "Enfeitiçado",
    "deaf": "Surdo",
    "frightened": "Amedrontado",
    "grappled": "Agarrado",
    "incapacitated": "Incapacitado",
    "invisible": "Invisível",
    "paralyzed": "Paralisado",
    "petrified": "Petrificado",
    "poisoned": "Envenenado",
    "prone": "Caído",
    "restrained": "Contido",
    "stunned": "Atordoado",
    "unconscious": "Inconsciente",
  };

  const go20Conditions = conditions.map(c => reverseMap[c] || c);
  syncEngine.pushConditionUpdate(actor, token.id, go20Conditions);
}
