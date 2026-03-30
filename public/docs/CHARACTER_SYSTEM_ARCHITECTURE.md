# Go20 — Character System Architecture

> Documento técnico para referência por IA. Descreve a arquitetura completa do sistema de personagem, wizard de criação e level up.

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND (React)                │
│                                                  │
│  CharacterWizard ──► useCreateCharacter ──┐      │
│  CharacterSheet  ──► useUpdateCharacter ──┤      │
│  LevelUpSheet    ──► useUpdateCharacter ──┤      │
│  EditStatsSheet  ──► useUpdateCharacter ──┘      │
│                                                  │
│  Dados SRD: src/data/srd.ts (JSONs)              │
│  Spell Slots: src/lib/spellSlotUtils.ts          │
│  Feat Effects: src/lib/featEffects.ts            │
│                                                  │
├──────────────────────────────────────────────────┤
│              SUPABASE (Lovable Cloud)            │
│  Tabela: characters (schema público)             │
│  Tabela: character_history (changelog)           │
│  Tabela: homebrew_content (raças/classes custom) │
└──────────────────────────────────────────────────┘
```

---

## 2. Modelo de Dados — `characters` (DB)

Interface TypeScript: `CharacterDB` em `src/hooks/useCharacters.tsx`.

| Campo | Tipo DB | Descrição |
|-------|---------|-----------|
| `id` | uuid PK | Auto-gerado |
| `user_id` | uuid FK→auth.users | Dono do personagem |
| `name` | text | Nome do personagem |
| `race` | text | Nome da raça (ex: "Elfo") |
| `subrace` | text? | Nome da sub-raça (ex: "Alto Elfo") |
| `class` | text | Nome da classe (ex: "Guerreiro") |
| `level` | int | 1-20 |
| `experience` | int | XP acumulado |
| `max_hp` | int | PV máximo |
| `current_hp` | int | PV atual |
| `temporary_hp` | int | PV temporário |
| `armor_class` | int | CA calculada |
| `initiative` | int | Modificador de iniciativa base (DEX mod) |
| `speed` | int | Deslocamento em metros |
| `proficiency_bonus` | int | Bônus de proficiência (2-6) |
| `attributes` | jsonb | `{strength, dexterity, constitution, intelligence, wisdom, charisma}` |
| `saving_throws` | jsonb | `{[attr]: {proficient: boolean}}` — definido pela classe |
| `skills` | jsonb | **Formato objeto**: `{[skillId]: {proficient: boolean, expertise?: boolean}}` |
| `hit_dice` | jsonb | `{total: number, current: number, diceType: "dN"}` |
| `death_saves` | jsonb | `{successes: number, failures: number}` |
| `equipment` | jsonb[] | Array de items equipados (armas, armaduras, escudos) |
| `inventory` | jsonb[] | Array de items no inventário `{id, name, quantity, description?}` |
| `currency` | jsonb | `{copper, silver, electrum, gold, platinum}` |
| `spellcasting` | jsonb? | `{cantrips?, knownSpells?, usedSlots: number[9], activeConcentration?, sorceryPoints?}` |
| `spells` | jsonb[] | Array de nomes de magias (strings) |
| `background` | text? | Nome do antecedente |
| `alignment` | text? | Alinhamento |
| `personality_traits, ideals, bonds, flaws` | text? | Traços de personalidade |
| `backstory` | text? | História do personagem |
| `features` | jsonb[] | Array de características/talentos (ver estrutura abaixo) |
| `proficiencies` | jsonb | `{armor: string[], weapons: string[], tools: string[]}` |
| `languages` | jsonb | `string[]` |
| `conditions` | text[] | Condições ativas (ex: ["Envenenado", "Cego"]) |
| `image_url` | text? | URL da imagem do personagem |
| `is_archived` | bool | Personagem arquivado |
| `age, height, weight, eyes, hair, skin` | text? | Aparência física |
| `distinctive_features, goals, allies_organizations` | text? | Detalhes adicionais |

### Estrutura de `features[]`

```typescript
{
  id?: string;                 // ID da feature (ex: "second_wind")
  name: string;                // Nome exibido (ex: "Estilo de Luta: Defesa")
  source: string;              // "Guerreiro" | "Subclasse" | "Talento"
  level: number;               // Nível em que foi adquirida
  description: string;         // Markdown da descrição
  mechanical?: Record<string, any>; // Efeitos mecânicos (ex: {ac_bonus: 1})
  // Para subclasses:
  subclass_id?: string;        // ID da subclasse
  subclass_name?: string;      // Nome da subclasse
  selected_option?: string;    // ID da opção escolhida (ex: estilo de luta)
}
```

### Estrutura de `skills` (formato objeto — padrão atual)

```typescript
{
  acrobatics: { proficient: true },
  insight: { proficient: true },
  // ... skills sem proficiência não precisam estar presentes
}
```

> **Atenção**: O código suporta AMBOS os formatos (array legado e objeto) para retrocompatibilidade. Novos personagens usam o formato objeto.

### Estrutura de `spellcasting`

```typescript
{
  cantrips?: string[];          // Truques conhecidos
  knownSpells?: string[];       // Magias conhecidas (para classes prepared-casters, pode não ser usado)
  usedSlots: number[];          // [0,0,0,0,0,0,0,0,0] — slots usados por nível 1-9
  activeConcentration?: {       // Concentração ativa
    spellName: string;
    castAt: string;             // ISO timestamp
  } | null;
  sorceryPoints?: {             // Apenas Feiticeiro
    max: number;
    current: number;
  };
}
```

---

## 3. Fontes de Dados SRD

### `src/data/srd.ts`

Módulo central que importa e exporta todos os dados do SRD 5.1:

- **`RACES: Race[]`** — 9 raças (Anão, Elfo, Halfling, Humano, Draconato, Gnomo, Meio-Elfo, Meio-Orc, Tiefling)
- **`CLASSES: CharacterClass[]`** — 12 classes com levels, features, subclasses, starting_equipment
- **`BACKGROUNDS`** — Acólito (SRD) + Custom
- **`ALL_SKILLS`** — 18 perícias com nome PT-BR e atributo associado
- **`ALL_LANGUAGES`** — 16 idiomas
- **`ALL_TOOLS`** — 25 ferramentas
- **`ALIGNMENTS`** — 9 alinhamentos

#### Funções utilitárias:
| Função | Retorno | Descrição |
|--------|---------|-----------|
| `getModifier(score)` | number | `Math.floor((score - 10) / 2)` |
| `getModifierString(score)` | string | "+2" ou "-1" |
| `calculateHP(hitDie, conMod, level)` | number | Nível 1: max die + CON. Demais: avg + CON |
| `getAttributeAbbr(attr)` | string | "FOR", "DES", etc. |
| `getAttributeName(attr)` | string | "Força", "Destreza", etc. |

### Estrutura dos JSONs de Classe (`src/data/classes/*.json`)

```typescript
{
  id: string;                    // "guerreiro"
  name: string;                  // "Guerreiro"
  hit_die: number;               // 10
  primary_abilities: Attribute[];
  saving_throw_proficiencies: Attribute[];
  proficiencies: { armor, weapons, tools, skills: {choose, from} };
  starting_equipment: {
    choices: [{choose: 1, from: [["longsword"], ["shield", "simple_weapon"]]}],
    granted: ["chain_mail"]
  };
  levels: ClassLevel[];          // 20 níveis com features[], cantrips_known, spell_slots, etc.
  features: ClassFeature[];      // Definições de cada feature com id, name, level, description_markdown
  subclasses: [{
    id, name, description,
    features: [{id, name, level, description_markdown, mechanical?, options?}]
  }];
}
```

### `src/lib/spellSlotUtils.ts`

Três tabelas de slots:
- **`FULL_CASTER_SLOTS`** — Mago, Feiticeiro, Bardo, Clérigo, Druida
- **`HALF_CASTER_SLOTS`** — Paladino, Patrulheiro (slots a partir do nível 2)
- **`WARLOCK_PACT_SLOTS`** — Bruxo (poucos slots, todos no mesmo nível, recuperam em descanso curto)

```typescript
getCasterType(className) → 'full' | 'half' | 'warlock' | 'none'
getSpellSlotsForClass(className, level) → number[9]  // max slots por nível 1-9
getSpellcastingAbility(className) → string  // atributo de conjuração
```

### `src/lib/featEffects.ts`

Mapa de efeitos mecânicos dos talentos SRD. Calcula bônus acumulados:

```typescript
calculateFeatBonuses(features, characterLevel) → {
  initiative, ac, speed,
  passive_perception, passive_investigation, passive_insight,
  hp_bonus
}
```

Talentos com efeitos mecânicos registrados:
- **Alerta**: +5 iniciativa
- **Combatente com Duas Armas**: +1 CA
- **Mobilidade**: +3m deslocamento
- **Observador**: +5 percepção/investigação passiva
- **Robusto**: +2 PV/nível
- **Ator**: +1 CAR
- **Durão**: +1 CON
- **Armadura Pesada**: +1 FOR

---

## 4. Wizard de Criação de Personagem

### Arquivo: `src/components/character/CharacterWizard.tsx` (921 linhas)

#### Estado do Wizard: `WizardData`

```typescript
type WizardData = {
  race: string;                  // ID da raça SRD ou UUID homebrew
  subrace: string | null;        // ID da sub-raça
  class: string;                 // ID da classe SRD
  subclass: string | null;       // ID da subclasse (obrigatório para Clérigo/Feiticeiro/Bruxo no nível 1)
  attributes: Record<Attribute, number>;  // Valores base (sem bônus raciais)
  abilityBonusChoices: string[]; // Para Meio-Elfo (escolhe 2 atributos +1)
  background: string;           // ID do antecedente
  alignment: string;            // ID do alinhamento
  name: string;
  personalityTraits, ideals, bonds, flaws: string;
  equipmentChoices: Record<number, number>;  // choiceIndex → optionIndex
  equipmentCategorySelections: Record<string, string>;  // Para escolhas dentro de categorias
  selectedSkills: string[];      // IDs das perícias escolhidas
  extraLanguages: string[];      // Idiomas extras
  customBackgroundSkills: string[];
  customBackgroundProficiencies: string[];
  customBackgroundName: string;
  customBackgroundFeature: string;
  // Backstory
  age, height, weight, eyes, hair, skin: string;
  distinctiveFeatures, backstory, goals, alliesOrganizations: string;
  // Magias
  selectedCantrips: string[];
  selectedSpells: string[];
  // Humano Variante
  variantHumanFeat: string;
  variantHumanSkill: string;
};
```

#### Passos (10 etapas)

| # | Step | Componente | Descrição |
|---|------|------------|-----------|
| 0 | Raça | `RaceStep` | Seleção de raça SRD ou homebrew. Suporte a sub-raças (SRD, homebrew inline, standalone homebrew). Humano Variante com talento e perícia extra. |
| 1 | Classe | `ClassStep` | Seleção de classe. Subclasse obrigatória no nível 1 para Clérigo, Feiticeiro, Bruxo. |
| 2 | Atributos | `AttributesStep` | Point Buy, Array Padrão ou Rolagem. Valores base sem bônus raciais. |
| 3 | Perícias | `SkillsStep` | Seleção de N perícias (definido pela classe). Baseado em `pericias.json`. |
| 4 | Idiomas | `LanguagesStep` | Idiomas extras além dos raciais. |
| 5 | Equipamento | `EquipmentStep` | Escolhas de equipamento inicial da classe. Suporte a categorias (ex: "arma marcial" → dropdown). |
| 6 | Magias | `SpellsStep` | Truques e magias de 1º nível para conjuradores. Filtra por classe. |
| 7 | História | `BackgroundStep` | Antecedente (Acólito SRD, Custom, ou Homebrew). Nome, alinhamento, traços. |
| 8 | Backstory | `BackstoryStep` | Aparência física, história, objetivos. |
| 9 | Revisão | `ReviewStep` | Resumo completo. Checklist de itens faltando. |

#### Navegação

- Stepper horizontal scrollável com ícones (framer-motion AnimatePresence para transições de slide)
- Botões "Próximo" / "Voltar" no header
- Clique direto em qualquer step (navegação livre)
- Indicador de itens faltando (popover com checklist)

#### Fluxo de Criação (`handleCreate`)

1. **Resolve raça**: SRD ou homebrew
2. **Aplica bônus raciais** aos atributos base:
   - Padrão: soma `race.ability_bonuses`
   - Humano Variante: pula bônus base, aplica +1 a 2 atributos escolhidos
   - Sub-raça: soma `subrace.ability_bonuses`
   - Meio-Elfo: aplica `abilityBonusChoices` (+1 a cada atributo escolhido)
3. **Calcula HP**: `hitDie + conModifier + raceHpBonus` (ex: Anão da Colina +1/nível)
4. **Coleta proficiências**:
   - Classe: armaduras, armas, ferramentas
   - Raça: proficiências de armas e perícias de traits mecânicos
   - Antecedente: perícias
   - Humano Variante: perícia extra
   - Merge sem duplicatas
5. **Coleta features nível 1**:
   - Features de classe para nível 1 (do JSON)
   - Features de subclasse para nível 1 (SRD ou homebrew)
   - Talento do Humano Variante
6. **Processa equipamento**:
   - Expande escolhas (`starting_equipment.choices`) e itens concedidos (`granted`)
   - Resolve nomes via JSONs de armas/armaduras
   - Pacotes iniciais são expandidos em itens individuais
   - Categorias (ex: "arma simples") resolvidas via `equipmentCategorySelections`
   - Classifica em `equipment[]` (equipado) vs `inventory[]` (inventário)
7. **Calcula CA**:
   - Base: 10 + DEX mod
   - Com armadura: aplica `armor_class.base`, `max_dex_bonus`, categoria
   - Monge: 10 + DEX + WIS
   - Bárbaro: 10 + DEX + CON
   - Escudo: +2
8. **Monta `spellcasting`**: cantrips, knownSpells, sorceryPoints (Feiticeiro)
9. **Insere no Supabase** via `useCreateCharacter`

---

## 5. Ficha de Personagem (CharacterSheet)

### Arquivo: `src/components/character/CharacterSheet.tsx` (~2530 linhas)

#### Abas Principais

- **Ficha** (padrão): Atributos, Combate, Magias
- **Inventário**: Equipamento visual, itens, moedas

#### Sub-abas da Ficha

| Sub-aba | Conteúdo |
|---------|----------|
| `geral` | Atributos (6 caixas), salvaguardas, perícias (18 skills com busca), proficiências, idiomas |
| `combate` | HP card com dano/cura, HP temporário, dados de vida, descansos, condições, salvaguardas contra morte |
| `magias` | Slots por nível (1-9) com uso, lista de magias do personagem, concentração ativa, casting dialog |

#### Funcionalidades Principais

##### HP e Dano
- Input numérico + botões Dano/Cura
- **Absorção por HP temporário**: dano absorvido primeiro por temp HP
- **Reset de death saves**: quando curado de 0 HP

##### Descanso Curto
- Escolhe quantos dados de vida gastar (0 ou mais)
- Rola `hitDiceType` + CON mod por dado
- Recupera PV e reduz dados de vida disponíveis
- `hitDiceToSpend = 0` permite descanso sem cura (apenas recursos)

##### Descanso Longo
- Recupera todos os PV
- Recupera metade dos dados de vida (mínimo 1)
- Zera HP temporário
- Reseta death saves
- Recupera todos os slots de magia (`usedSlots = [0,0,0,0,0,0,0,0,0]`)
- Remove concentração ativa

##### Sistema de Magias
- Carrega `magias.json` (banco unificado de magias SRD)
- Match por nome normalizado (PT-BR ou EN)
- Casting dialog (`SpellCastDialog`): escolhe nível do slot, marca concentração
- Consome slot (`usedSlots[level-1]++`)
- Integração com combat log (se em combate ativo)

##### Condições
- 14 condições D&D 5e com ícones emoji
- Toggle on/off
- Sincroniza com combatente se em combate ativo

##### Calculações Automáticas (cada render)
- **Modificadores de perícia**: `attrMod + (proficient ? profBonus : 0) + (expertise ? profBonus : 0)`
- **Percepção passiva**: `10 + WIS mod + perception prof + feat bonus`
- **Investigação passiva**: `10 + INT mod + investigation prof + feat bonus`
- **Intuição passiva**: `10 + WIS mod + insight prof + feat bonus`
- **Feat bonuses** via `calculateFeatBonuses()`: iniciativa, CA, velocidade, passivos
- **Spell slots** via `getSpellSlotsForClass()`

#### Sheets/Modais Acessíveis

| Sheet | Componente | Função |
|-------|------------|--------|
| Level Up | `LevelUpSheet` | Progressão de nível |
| Editar Stats | `EditStatsSheet` | Edição manual de atributos, HP, CA, etc. |
| Aparência | `EditAppearanceSheet` | Aparência e personalidade |
| Magias | `SpellsManagementSheet` | Adicionar/remover magias |
| Notas | `NotesSheet` | Anotações pessoais |
| Histórico | `CharacterHistorySheet` | Changelog (PRO) |
| Inventário | `InventoryManagementSheet` | Gestão detalhada |
| Documentos | `DocumentsSheet` | Documentos de campanha |
| Trocas | `InitiateTradeSheet` → `TradeOfferModal` | Comércio entre jogadores |
| PDF Export | `CharacterPDFExport` | Exportação para PDF |

---

## 6. Sistema de Level Up

### Arquivo: `src/components/character/LevelUpSheet.tsx` (~1224 linhas)

#### Dados de Referência

- **`CLASS_HIT_DICE`**: Mapa de classe → `{dice: "dN", avg: N}`
- **`FEAT_LEVELS`**: `[4, 8, 12, 16, 19]` — níveis que concedem ASI/Talento
- **`SUBCLASS_LEVELS`**: Mapa de classe → nível que desbloqueia subclasse
- **`STANDARD_FEATS`**: 28 talentos SRD com efeitos mecânicos
- **`advancementData`**: Tabela XP → nível → bônus de proficiência

#### Estado Interno

```typescript
hpRoll: number | null;           // Resultado do dado de HP
hasRolledHp: boolean;            // Se já rolou (impede re-roll)
useAverage: boolean;             // Se usou valor médio
selectedFeat: string | null;     // Nome do talento escolhido
improvementChoice: 'feat' | 'attributes';  // Tipo de melhoria
attributePoints: Record<string, number>;   // Distribuição de +2 pontos
pointsRemaining: number;         // Pontos restantes (max 2)
selectedFeatAttribute: string | null;      // Atributo para talentos com escolha
selectedSubclass: string | null; // Subclasse escolhida (se aplicável)
selectedFeatureOptions: Record<string, string>; // Opções de features (ex: estilo de luta)
selectedBonusSkills: string[];   // Perícias bônus da subclasse
```

#### Fluxo de Level Up (`handleLevelUp`)

##### Validações (bloqueiam o botão)
1. `hpRoll !== null` — HP deve ser definido
2. `showSubclassSelection → selectedSubclass` — Subclasse obrigatória se desbloqueada
3. `optionFeatures → selectedFeatureOptions` — Features com opções preenchidas
4. `subclassBonusProficiencies → selectedBonusSkills` — Perícias bônus selecionadas
5. `grantsFeat && 'feat' → selectedFeat` — Talento selecionado
6. `grantsFeat && 'feat' && requiresChoice → selectedFeatAttribute` — Atributo do talento
7. `grantsFeat && 'attributes' → pointsRemaining === 0` — Todos os pontos distribuídos

##### Cálculos e Mutações

1. **HP Gain**: `max(1, hpRoll + conMod + raceHpBonus + featHpBonus)`
   - `raceHpBonus`: De traits raciais (ex: Anão da Colina +1/nível)
   - `featHpBonus`: De talentos existentes (ex: Robusto +2/nível)
   
2. **Features atualizadas**:
   - Auto-features da classe para o nível (excluindo marcadores de subclasse e ASI)
   - Features com opção selecionada (ex: "Estilo de Luta: Defesa")
   - Features de subclasse (primeira seleção ou níveis superiores)
   - Talento selecionado (se ASI nível)

3. **Atributos atualizados**:
   - Se ASI com distribuição de pontos: `+attributePoints[attr]` (máx 20)
   - Se talento com bônus direto: `+effects[attr]` (ex: Ator +1 CAR)
   - Se talento com escolha: `+effects.attribute_bonus` ao atributo escolhido

4. **HP retroativo**:
   - **Robusto**: `+2 × currentLevel` (retroativo)
   - **CON aumentada**: `conModDiff × currentLevel` (retroativo)

5. **Skills atualizadas**:
   - Suporta ambos formatos (array e objeto)
   - Adiciona proficiências bônus da subclasse

6. **Atualização final** (`useUpdateCharacter`):
   ```typescript
   {
     level: nextLevel,
     max_hp: character.max_hp + totalHpGain + retroactiveHpFromCon,
     current_hp: character.current_hp + totalHpGain + retroactiveHpFromCon,
     proficiency_bonus: nextLevelData.proficiency_bonus,
     features: updatedFeatures,
     attributes: newAttributes,
     skills: updatedSkills,
     initiative: Math.floor((newAttributes.dexterity - 10) / 2),
     hit_dice: { total: nextLevel, current: current + 1 },
   }
   ```

#### Subclasses — Lógica de Descoberta

```
Nível de desbloqueio por classe:
  Nível 1: Clérigo, Feiticeiro, Bruxo
  Nível 2: Druida, Mago
  Nível 3: Bárbaro, Bardo, Guerreiro, Ladino, Monge, Paladino, Patrulheiro
```

- **SRD subclasses**: Vindas de `CLASSES[].subclasses[]`
- **Homebrew subclasses**: De `useHomebrew('subclass')`, filtradas por `parent_class`
- **Features de subclasse em níveis superiores**: Busca por `subclass_id` nas features existentes do personagem

#### Features com Opções (ex: Estilo de Luta)

Detectadas via `feature.options` no JSON da classe. O jogador seleciona uma opção e ela é salva com `selected_option` na feature. Exemplo:

```json
{
  "id": "fighting_style",
  "name": "Estilo de Luta",
  "options": [
    {"id": "defense", "name": "Defesa", "mechanical": {"ac_bonus": 1}},
    {"id": "dueling", "name": "Duelismo", "mechanical": {"damage_bonus": 2}}
  ]
}
```

#### Perícias Bônus de Subclasse

Definidas em homebrew subclasses via:
```json
{
  "bonus_proficiencies": [
    { "level": 3, "choose": 2, "from": ["insight", "medicine", "nature", "religion"] }
  ]
}
```

Filtra skills já possuídas pelo personagem antes de apresentar as opções.

---

## 7. Hooks de Dados

### `useCharacters.tsx`

| Hook | Função |
|------|--------|
| `useCharacters()` | Lista todos os personagens do usuário |
| `useCharacter(id)` | Busca um personagem (owner primeiro, depois como membro de campanha) |
| `useCreateCharacter()` | Insere novo personagem |
| `useUpdateCharacter()` | Atualiza personagem + loga mudanças em `character_history` |
| `useDeleteCharacter()` | Remove personagem |
| `useArchiveCharacter()` | Arquiva/restaura personagem |

### `useUpdateCharacter` — Changelog Automático

Ao atualizar um personagem, o hook:
1. Busca dados atuais do DB
2. Compara com os campos atualizados via `detectChanges()`
3. Insere registros em `character_history` com `field_name`, `old_value`, `new_value`
4. Changelog assíncrono (não bloqueia o update)

---

## 8. Integração com Homebrew

O sistema de homebrew (`useHomebrew()`) fornece conteúdos customizados que se integram em:

### Raças Homebrew
- Listadas junto com SRD no `RaceStep`
- Suportam `ability_bonuses`, `traits` (com `mechanical`), `speed`, `languages`
- Sub-raças podem ser inline (`subraces[]`) ou standalone (entrada separada com `parent_race_id`)
- Flag `replaces_base_bonuses` permite sub-raça substituir bônus da raça base

### Subclasses Homebrew
- Listadas junto com SRD no `ClassStep` e `LevelUpSheet`
- Filtradas por `parent_class` (match por nome ou ID)
- Suportam `features[]` com `level`, `description`, `mechanical`
- Suportam `bonus_proficiencies` para perícias extras

### Talentos Homebrew
- Listados junto com SRD no `LevelUpSheet`
- Badge "Homebrew" visual
- Efeitos mecânicos via `data.effects`

### Antecedentes Homebrew
- Listados junto com SRD no `BackgroundStep`
- Suportam `skill_proficiencies` personalizadas

---

## 9. Integração com Combate

A ficha se integra com o sistema de combate via:

- **`useCharacterActiveCombat(characterId)`**: Verifica se o personagem está em combate ativo
- **Sincronização de HP**: Ao mudar HP na ficha, atualiza o combatante via `useUpdateCombatant`
- **Sincronização de condições**: Toggle de condição na ficha sincroniza com combatante
- **Combat Logs**: Ações de magia e condições são logadas via `useAddCombatLog`

---

## 10. Bugs Conhecidos e Armadilhas

### Formato dual de `skills`
O campo `skills` pode ser objeto `{skillId: {proficient}}` (novo) ou array `[{name, proficient}]` (legado). Todo código que lê skills deve suportar ambos via type check.

### Formato de `proficiencies`
Pode ser array de strings (legado) ou objeto `{armor, weapons, tools}` (novo). A `CharacterSheet` faz fallback.

### Inconsistência de IDs de skills
- `srd.ts ALL_SKILLS` usa hifens: `"sleight-of-hand"`, `"animal-handling"`
- `CharacterSheet SKILLS` usa underscores: `"sleight_of_hand"`, `"animal_handling"`
- O wizard salva com o formato de `ALL_SKILLS` (hifens)
- A sheet lê com o formato de `SKILLS` (underscores)

### Features de subclasse marcadores
IDs como `martial_archetype`, `primal_path`, etc. são marcadores que indicam "aqui o jogador escolhe uma subclasse" e devem ser filtrados durante o level up (não são features reais).

---

## 11. Arquivos Chave

| Arquivo | Linhas | Função |
|---------|--------|--------|
| `src/components/character/CharacterWizard.tsx` | ~921 | Wizard de criação (10 steps) |
| `src/components/character/CharacterSheet.tsx` | ~2530 | Ficha completa |
| `src/components/character/LevelUpSheet.tsx` | ~1224 | Level up |
| `src/hooks/useCharacters.tsx` | ~279 | CRUD + changelog |
| `src/data/srd.ts` | ~300 | Dados SRD centrais |
| `src/lib/spellSlotUtils.ts` | ~147 | Tabelas de spell slots |
| `src/lib/featEffects.ts` | ~138 | Efeitos mecânicos de talentos |
| `src/data/rules/avanco-personagem.json` | ~109 | Tabela XP/nível/proficiency |
| `src/data/spells/magias.json` | grande | Banco de magias SRD |
| `src/data/classes/*.json` | 12 arquivos | Dados de cada classe |
| `src/data/races/*.json` | 9 arquivos | Dados de cada raça |
| `src/components/character/steps/*.tsx` | 10 arquivos | Steps individuais do wizard |

---

## 12. Diagrama de Fluxo Completo

```
[Tela de Personagens]
    │
    ├── [Criar Personagem] → CharacterWizard
    │       │
    │       ├── RaceStep → seleciona raça + sub-raça
    │       ├── ClassStep → seleciona classe + subclasse (se nível 1)
    │       ├── AttributesStep → distribui atributos (Point Buy / Array / Dados)
    │       ├── SkillsStep → seleciona N perícias da classe
    │       ├── LanguagesStep → idiomas extras
    │       ├── EquipmentStep → escolhas de equipamento inicial
    │       ├── SpellsStep → truques + magias (se conjurador)
    │       ├── BackgroundStep → antecedente + personalidade
    │       ├── BackstoryStep → aparência + história
    │       └── ReviewStep → checklist + criar
    │               │
    │               ▼
    │         handleCreate()
    │           ├── Aplica bônus raciais
    │           ├── Calcula HP nível 1
    │           ├── Coleta proficiências
    │           ├── Coleta features nível 1
    │           ├── Processa equipamento
    │           ├── Calcula CA
    │           └── INSERT characters → Supabase
    │
    └── [Abrir Personagem] → CharacterSheet
            │
            ├── Tab Ficha
            │   ├── Geral: atributos, saves, skills, proficiências
            │   ├── Combate: HP, descansos, condições, death saves
            │   └── Magias: slots, lista, concentração, casting
            │
            ├── Tab Inventário
            │   └── Equipamento visual, itens, moedas
            │
            ├── Menu → LevelUpSheet
            │       │
            │       ├── Rola ou usa média HP
            │       ├── Seleciona subclasse (se nível de desbloqueio)
            │       ├── Seleciona opções de features (ex: estilo de luta)
            │       ├── Seleciona perícias bônus
            │       ├── Escolhe talento OU +2 atributos (se ASI nível)
            │       └── handleLevelUp()
            │           ├── Calcula HP gain + retroativo
            │           ├── Adiciona features
            │           ├── Atualiza atributos
            │           ├── Atualiza skills
            │           └── UPDATE characters → Supabase
            │
            ├── Menu → EditStatsSheet (edição manual)
            ├── Menu → SpellsManagementSheet (gerenciar magias)
            ├── Menu → NotesSheet (notas)
            └── Menu → CharacterHistorySheet (changelog PRO)
```
