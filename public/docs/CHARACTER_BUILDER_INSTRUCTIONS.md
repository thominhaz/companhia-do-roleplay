# Go20 — Instrucoes: Refatoracao para Character Builder + Sheet

> Documento de instrucoes para IA. Descreve a arquitetura alvo, fases de implementacao e regras de negocio para transformar o sistema atual (Wizard descartavel + LevelUpSheet separado) em um Builder permanente revisitavel + Sheet de jogo rapido, inspirado no modelo do D&D Beyond.
>
> **Nota de arquitetura**: Todos os modelos de dados e estruturas deste documento foram projetados para suportar **multiclasse no futuro** (Fase 5). Os campos relevantes estao marcados com comentarios `// MULTICLASS-READY`. Durante as Fases 1-4, o sistema opera apenas com classe unica, mas a estrutura ja comporta a evolucao sem migracao de schema.

---

## 1. Objetivo Geral

Substituir o fluxo atual de tres componentes isolados (`CharacterWizard`, `CharacterSheet`, `LevelUpSheet`) por dois contextos bem definidos:

| Contexto | Componente | Responsabilidade |
|----------|------------|-----------------|
| **Builder** | `CharacterBuilder` | Todas as mudancas **estruturais** do personagem: criacao, edicao de raca/classe/atributos/pericias, level up, selecao de talentos, subclasses e magias conhecidas. E um wizard permanente, revisitavel a qualquer momento. |
| **Sheet** | `CharacterSheet` | Mudancas **rapidas durante o jogo**: equipar/desequipar itens, gastar/recuperar slots de magia, mudar magias preparadas, controlar HP/dano/cura, descansos, condicoes, death saves. Sem menus intermediarios — interacao direta nos elementos da ficha. |

**Regra de ouro**: Se a mudanca afeta a *construcao* do personagem (o que ele *e*), vai no Builder. Se afeta o *estado de jogo* (o que esta acontecendo *agora*), vai na Sheet.

---

## 2. Arquitetura Alvo

```
src/
  components/
    character/
      builder/
        CharacterBuilder.tsx        -- Componente principal (substitui CharacterWizard)
        BuilderSidebar.tsx          -- Navegacao lateral com steps + timeline de niveis
        BuilderContext.tsx           -- Context API com estado completo do builder
        steps/
          RaceStep.tsx              -- Refatorado para carregar dados existentes
          ClassStep.tsx             -- Refatorado para carregar dados existentes
          AttributesStep.tsx        -- Refatorado para carregar dados existentes
          SkillsStep.tsx            -- Refatorado para carregar dados existentes
          LanguagesStep.tsx         -- Refatorado para carregar dados existentes
          EquipmentStep.tsx         -- Refatorado para carregar dados existentes
          SpellsStep.tsx            -- Refatorado para carregar dados existentes
          BackgroundStep.tsx        -- Refatorado para carregar dados existentes
          BackstoryStep.tsx         -- Refatorado para carregar dados existentes
          ReviewStep.tsx            -- Refatorado para suportar criacao E atualizacao
          LevelUpStep.tsx           -- NOVO: absorve logica do LevelUpSheet
      sheet/
        CharacterSheet.tsx          -- Refatorado: apenas interacoes de jogo
        (sub-componentes de combate, magias, inventario permanecem)
  lib/
    multiclassUtils.ts              -- FUTURO (Fase 5): utilitarios de multiclasse
```

---

## 3. Modelo de Dados — Mudancas Necessarias

### 3.1 Nova coluna: `level_choices` (jsonb)

Armazena as escolhas feitas em **cada nivel** para permitir edicao retroativa. Adicionar na tabela `characters`:

```sql
ALTER TABLE characters ADD COLUMN level_choices jsonb DEFAULT '[]';
```

Estrutura:

```typescript
type LevelChoice = {
  level: number;                          // 1-20
  class_id: string;                       // MULTICLASS-READY: classe escolhida NESTE nivel
                                          // Fases 1-4: sempre igual a builderData.class_id
                                          // Fase 5: pode ser diferente da classe inicial
  hp_roll: number;                        // Resultado do dado de HP (nivel 1 = max do dado)
  used_average: boolean;                  // Se usou media ao inves de rolar
  subclass_id?: string;                   // Subclasse escolhida (no nivel de desbloqueio)
  selected_skills?: string[];             // Pericias escolhidas (nivel 1 ou bonus de subclasse)
  selected_feat?: string;                 // Nome do talento (em niveis ASI: 4, 8, 12, 16, 19)
  feat_attribute?: string;                // Atributo escolhido para talentos com opcao
  attribute_improvements?: Record<string, number>; // Distribuicao de +2 pontos (em niveis ASI)
  improvement_choice?: 'feat' | 'attributes';      // Tipo de melhoria no ASI
  feature_options?: Record<string, string>;         // Opcoes de features (ex: estilo de luta)
  extra_languages?: string[];             // Idiomas extras escolhidos
  extra_cantrips?: string[];              // Truques extras ganhos neste nivel
  extra_spells?: string[];                // Magias extras ganhas neste nivel
  multiclass_proficiencies?: string[];    // MULTICLASS-READY: proficiencias ganhas ao multiclassar
                                          // Fases 1-4: sempre undefined
};
```

### 3.2 Nova coluna: `builder_data` (jsonb)

Armazena as escolhas originais do builder que nao mudam por nivel (raca, metodo de atributos, equipamento inicial, etc.):

```typescript
type BuilderData = {
  race_id: string;                        // ID da raca (SRD ou homebrew UUID)
  subrace_id?: string;                    // ID da sub-raca
  class_id: string;                       // ID da classe INICIAL (primeira classe escolhida)
  attribute_method: 'point_buy' | 'standard_array' | 'rolled'; // Metodo usado
  base_attributes: Record<string, number>; // Atributos BASE (sem bonus raciais)
  ability_bonus_choices?: string[];        // Escolhas de bonus (Meio-Elfo)
  background_id: string;                  // ID do antecedente
  alignment: string;
  equipment_choices: Record<number, number>;          // Escolhas de equipamento
  equipment_category_selections: Record<string, string>;
  variant_human_feat?: string;            // Talento do Humano Variante
  variant_human_skill?: string;           // Pericia extra do Humano Variante
  custom_background?: {                   // Se antecedente customizado
    name: string;
    skills: string[];
    proficiencies: string[];
    feature: string;
  };
};
```

### 3.3 Coluna existente `class` — Preparacao para multiclasse

A coluna `class` (text) continua existindo e armazenando a classe principal para exibicao e retrocompatibilidade. No futuro (Fase 5), uma nova coluna `classes` (jsonb) sera adicionada:

```typescript
// FUTURO (Fase 5) — NAO implementar agora
// Apenas documentado para referencia arquitetural
type CharacterClass = {
  class_id: string;       // ID da classe
  class_name: string;     // Nome da classe (para exibicao)
  level: number;          // Nivel NESTA classe (nao o nivel total)
  subclass_id?: string;   // Subclasse desta classe
  subclass_name?: string; // Nome da subclasse
  is_primary: boolean;    // Se e a classe inicial (true para a primeira)
};

// A coluna `class` passa a ser derivada: nome da classe com maior nivel
// ou a classe primaria em caso de empate
```

**Nas Fases 1-4**: Usar `builderData.class_id` como unica classe. Toda logica que precisa saber a classe do personagem deve ler de `builderData.class_id` (Builder) ou `character.class` (Sheet). Isso facilita a migracao futura pois o ponto de leitura ja esta isolado.

### 3.4 SQL de migracao

```sql
ALTER TABLE characters ADD COLUMN builder_data jsonb DEFAULT '{}';
ALTER TABLE characters ADD COLUMN level_choices jsonb DEFAULT '[]';
-- FUTURO (Fase 5): ALTER TABLE characters ADD COLUMN classes jsonb DEFAULT '[]';
```

### 3.5 Colunas existentes mantidas

Todos os campos derivados (`max_hp`, `attributes`, `skills`, `features`, `proficiencies`, etc.) continuam existindo e sendo recalculados pelo Builder ao salvar. A Sheet le apenas esses campos derivados. O `builder_data` e `level_choices` sao a **fonte de verdade** para o Builder reconstruir o estado.

---

## 4. Fase 1 — Builder Revisitavel (Prioridade Alta)

### 4.1 BuilderContext

Criar um Context API que gerencie o estado completo do Builder:

```typescript
type BuilderMode = 'create' | 'edit';

type BuilderState = {
  mode: BuilderMode;
  characterId?: string;                   // Presente apenas no modo 'edit'
  currentStep: number;
  builderData: BuilderData;               // Escolhas base
  levelChoices: LevelChoice[];            // Escolhas por nivel
  currentLevel: number;                   // Nivel total do personagem
  // Campos de backstory/personalidade (nao afetam mecanica)
  name: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  age: string;
  height: string;
  weight: string;
  eyes: string;
  hair: string;
  skin: string;
  distinctiveFeatures: string;
  goals: string;
  alliesOrganizations: string;
  imageUrl?: string;
};
```

Funcoes do context:

```typescript
type BuilderActions = {
  // Navegacao
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  // Dados
  updateBuilderData: (partial: Partial<BuilderData>) => void;
  updateLevelChoice: (level: number, partial: Partial<LevelChoice>) => void;
  // Derivados (recalculados automaticamente)
  getComputedAttributes: () => Record<string, number>;  // base + raciais + ASI + talentos
  getComputedHP: () => number;                           // soma de todos os niveis + retroativo
  getComputedFeatures: () => Feature[];                  // features de todos os niveis
  getComputedProficiencies: () => Proficiencies;         // merge de todas as fontes
  getComputedSkills: () => Record<string, {proficient: boolean, expertise?: boolean}>;
  getComputedSpellcasting: () => Spellcasting | null;
  getComputedAC: () => number;
  // MULTICLASS-READY: Estas funcoes ja recebem class_id de cada LevelChoice
  // Fases 1-4: ignoram o campo e usam builderData.class_id
  // Fase 5: usam o class_id de cada nivel individualmente
  getClassLevels: () => Record<string, number>;          // MULTICLASS-READY: {class_id: nivel_nesta_classe}
                                                          // Fases 1-4: retorna {[builderData.class_id]: currentLevel}
  // Persistencia
  save: () => Promise<void>;              // INSERT (create) ou UPDATE (edit)
  loadFromCharacter: (character: CharacterDB) => void;   // Popula estado a partir do DB
};
```

### 4.2 Inicializacao do Builder

**Modo criacao** (`mode: 'create'`):
- Estado vazio, identico ao wizard atual
- Ao final, executa INSERT no Supabase
- Salva `builder_data` e `level_choices[0]` junto com os campos derivados
- `level_choices[0].class_id` = `builderData.class_id` (MULTICLASS-READY)

**Modo edicao** (`mode: 'edit'`):
- Recebe `characterId`
- Busca o personagem do DB
- Chama `loadFromCharacter()` que popula o estado a partir de `builder_data` e `level_choices`
- **Fallback para personagens antigos**: Se `builder_data` estiver vazio (personagem criado antes da migracao), inferir os dados a partir dos campos derivados existentes:
  - `race_id` ← `character.race` (buscar ID correspondente no SRD)
  - `class_id` ← `character.class` (buscar ID correspondente no SRD)
  - `base_attributes` ← `character.attributes` menos bonus raciais conhecidos
  - `attribute_method` ← `'standard_array'` (default seguro, nao e possivel inferir)
  - `level_choices` ← gerar um unico registro de nivel com os dados atuais, `class_id` = classe do personagem
- Cada step carrega os dados do contexto e permite edicao
- Ao salvar, executa UPDATE recalculando TODOS os campos derivados

### 4.3 Refatoracao dos Steps

Cada step existente precisa de duas mudancas:

1. **Inicializacao condicional**: Ao montar, verificar se `builderData` ja tem valores. Se sim, usar como estado inicial. Se nao, inicializar vazio.

2. **Sincronizacao bidirecional**: Ao alterar qualquer campo, chamar `updateBuilderData()` ou `updateLevelChoice()` para manter o contexto atualizado.

**Exemplo para RaceStep:**

```typescript
// ANTES (wizard atual): estado local isolado
const [selectedRace, setSelectedRace] = useState('');

// DEPOIS (builder): inicializa do contexto
const { builderData, updateBuilderData } = useBuilderContext();
const [selectedRace, setSelectedRace] = useState(builderData.race_id || '');

// Ao mudar raca:
const handleRaceChange = (raceId: string) => {
  setSelectedRace(raceId);
  updateBuilderData({ race_id: raceId, subrace_id: undefined });
};
```

Aplicar essa mesma logica para **todos os 10 steps**.

### 4.4 Recalculo em Cascata

Quando o usuario muda algo no Builder, os campos derivados devem ser recalculados. A ordem de dependencia e:

```
1. race + subrace                   --> racial_bonuses, speed, languages, racial_features
2. class (por nivel via class_id)   --> hit_die, saving_throws, class_proficiencies, spell_type
3. base_attributes + bonuses        --> final_attributes, modifiers
4. modifiers + class                --> HP (por nivel), AC, initiative, spell_DC
5. class + level                    --> features, spell_slots, proficiency_bonus
6. features (talentos)              --> feat_bonuses (initiative, AC, speed, HP, passives)
7. tudo acima                       --> campos derivados finais para o DB
```

**MULTICLASS-READY**: O passo 2 ja le `class_id` de cada `LevelChoice`. Nas Fases 1-4 todos terao o mesmo valor, mas a estrutura do loop ja percorre nivel a nivel.

**Implementar como funcoes puras** no `BuilderContext` que sao recalculadas a cada mudanca de estado. NAO fazer chamadas ao DB durante o recalculo — apenas ao salvar.

### 4.5 Sidebar de Navegacao

Substituir o stepper horizontal por uma **sidebar lateral** (estilo D&D Beyond) com:

```
[Raca]              <- step 0
[Classe]            <- step 1
[Atributos]         <- step 2
[Pericias]          <- step 3
[Idiomas]           <- step 4
[Equipamento]       <- step 5
[Magias]            <- step 6  (oculto se classe nao e conjuradora)
[Historia]          <- step 7
[Backstory]         <- step 8
-----------------
[Nivel 1 — Guerreiro]   <- level_choices[0]  (exibe nome da classe do nivel)
[Nivel 2 — Guerreiro]   <- level_choices[1]
[Nivel 3 — Guerreiro]   <- level_choices[2]  (subclasse?)
...
-----------------
[Resumo]            <- step final
```

- Cada item mostra um indicador visual (completo/incompleto/com erro)
- Clicar em qualquer item navega diretamente
- A secao de niveis so aparece no modo edicao (ou apos criacao)
- O nivel mais alto tem destaque visual
- **MULTICLASS-READY**: O label de cada nivel ja exibe o nome da classe daquele nivel (`level_choices[n].class_id`). Nas Fases 1-4 sera sempre a mesma classe, mas a sidebar ja renderiza a partir do `class_id` do nivel.

---

## 5. Fase 2 — Level Up Integrado ao Builder (Prioridade Alta)

### 5.1 LevelUpStep

Criar um novo step `LevelUpStep.tsx` que substitui o `LevelUpSheet.tsx`. Este step e acessado pela sidebar ao clicar em um nivel especifico.

**Props:**

```typescript
type LevelUpStepProps = {
  targetLevel: number;    // Qual nivel total esta sendo editado
};
```

**Conteudo do step (varia por nivel):**

1. **Classe deste nivel** (MULTICLASS-READY):
   - Fases 1-4: Exibe a classe atual como informacao (nao editavel). O campo `class_id` e preenchido automaticamente com `builderData.class_id`.
   - Fase 5: Dropdown para escolher em qual classe subir neste nivel (com validacao de pre-requisitos).

2. **HP**: Rolar dado ou usar media. O dado de vida usado vem da classe deste nivel (`level_choices[n].class_id`). Exibir: `dado + CON mod + bonus raciais + bonus de talentos = total`.

3. **Subclasse** (se nivel de desbloqueio NA CLASSE DESTE NIVEL): Selecao de subclasse SRD ou homebrew. O nivel de desbloqueio e contado pelo **nivel na classe**, nao o nivel total do personagem:
   - Nivel 1 na classe: Clerigo, Feiticeiro, Bruxo
   - Nivel 2 na classe: Druida, Mago
   - Nivel 3 na classe: Barbaro, Bardo, Guerreiro, Ladino, Monge, Paladino, Patrulheiro

4. **Features com opcoes** (ex: Estilo de Luta): Dropdown com as opcoes disponiveis.

5. **ASI / Talento**: Os niveis de ASI sao por **nivel na classe** (4, 8, 12, 16, 19). Escolher entre +2 atributos ou um talento. Lista de talentos SRD + homebrew.

6. **Pericias bonus** (se subclasse concede): Selecao das pericias extras.

7. **Magias novas** (se conjurador): Truques e magias extras ganhos neste nivel, conforme a tabela de `cantrips_known` e `spells_known` da classe.

**Resumo automatico**: Apos preencher, exibir um card resumo do nivel com tudo que foi ganho (HP, features, melhorias, magias).

### 5.2 Funcao auxiliar: `getClassLevel()`

Criar uma funcao utilitaria que calcula o nivel em uma classe especifica a partir do `level_choices[]`:

```typescript
// Conta quantos niveis o personagem tem em uma classe especifica
function getClassLevel(levelChoices: LevelChoice[], classId: string, upToLevel?: number): number {
  const choices = upToLevel
    ? levelChoices.filter(lc => lc.level <= upToLevel)
    : levelChoices;
  return choices.filter(lc => lc.class_id === classId).length;
}
```

**Fases 1-4**: Esta funcao sempre retorna o nivel total (pois todos os `class_id` sao iguais). Mas usar esta funcao em TODA logica que depende de "nivel na classe" garante que multiclasse funcione sem alteracoes no futuro.

**Pontos onde usar `getClassLevel()` em vez de `character.level`:**
- Desbloqueio de subclasse
- Niveis de ASI (4, 8, 12, 16, 19 na classe)
- Features de classe (indexadas por nivel na classe)
- Features de subclasse (indexadas por nivel na classe)
- Magias conhecidas e truques (tabela por nivel na classe)
- Extra Attack e similares (verificar nivel na classe)

**Pontos onde continuar usando nivel total (`character.level`):**
- Proficiency bonus (sempre pelo nivel total)
- Cantrip damage scaling (sempre pelo nivel total)
- XP e progressao geral

### 5.3 Botao "Subir de Nivel"

Na sidebar, abaixo do ultimo nivel existente, exibir um botao **"+ Subir para Nivel X"** que:

1. Cria uma nova entrada vazia em `level_choices[]`
2. Preenche `class_id` automaticamente com `builderData.class_id` (Fases 1-4)
3. Navega automaticamente para o `LevelUpStep` desse nivel
4. O botao so aparece se `currentLevel < 20`

### 5.4 Edicao Retroativa de Niveis

O usuario pode clicar em qualquer nivel anterior na sidebar e editar suas escolhas. Ao editar um nivel anterior:

1. **Recalcular todos os niveis subsequentes** (efeito cascata)
2. **Alertar o usuario** se a mudanca invalida escolhas futuras (ex: remover uma subclasse que concedeu features em niveis superiores)
3. **Nao permitir reduzir o nivel** — apenas editar escolhas dentro do nivel

### 5.5 Migracao da Logica do LevelUpSheet

Mover para o `LevelUpStep`:

- `CLASS_HIT_DICE` — mapa de classe para dado de vida e media
- `FEAT_LEVELS` — `[4, 8, 12, 16, 19]`
- `SUBCLASS_LEVELS` — mapa de classe para nivel de desbloqueio
- `STANDARD_FEATS` — 28 talentos SRD
- Logica de calculo de HP gain com retroatividade
- Logica de features automaticas vs opcoes
- Logica de pericias bonus de subclasse
- Validacoes (todas as escolhas obrigatorias preenchidas)

O `LevelUpSheet.tsx` pode ser **removido** apos a migracao estar completa.

---

## 6. Fase 3 — Sheet como Painel de Jogo (Prioridade Media)

### 6.1 O que PERMANECE na Sheet

| Funcionalidade | Interacao |
|----------------|-----------|
| HP / Dano / Cura | Input numerico + botoes, identico ao atual |
| HP Temporario | Input numerico direto |
| Descanso Curto | Dialog para escolher dados de vida |
| Descanso Longo | Botao com confirmacao |
| Death Saves | Clique nos circulos de sucesso/falha |
| Condicoes | Toggle on/off nas condicoes |
| Slots de Magia | Clique no slot para gastar/recuperar |
| Concentracao | Ativar/desativar concentracao ativa |
| Equipar/Desequipar | Drag ou toggle no inventario |
| Magias Preparadas | Toggle nas magias da lista (para prepared casters) |
| Inventario | Adicionar/remover itens, moedas |
| Notas | Edicao livre |

### 6.2 O que MIGRA para o Builder

| Funcionalidade | Antes (Sheet) | Depois (Builder) |
|----------------|---------------|------------------|
| Editar atributos | `EditStatsSheet` | `AttributesStep` no Builder |
| Editar HP max | `EditStatsSheet` | Recalculado pelo Builder |
| Editar CA | `EditStatsSheet` | Recalculado pelo Builder |
| Editar proficiencias | `EditStatsSheet` | `SkillsStep` / `ClassStep` no Builder |
| Level Up | `LevelUpSheet` (menu) | `LevelUpStep` no Builder |
| Adicionar/remover magias conhecidas | `SpellsManagementSheet` | `SpellsStep` no Builder |
| Editar aparencia | `EditAppearanceSheet` | `BackstoryStep` no Builder |

### 6.3 Botao "Abrir Builder" na Sheet

Adicionar um botao visivel na Sheet (no header ou menu) que abre o Builder no modo edicao para aquele personagem. O Builder abre como uma **pagina separada** (rota `/characters/:id/builder`), nao como modal/sheet.

### 6.4 Interacoes Rapidas na Sheet

Para melhorar a experiencia de jogo, implementar:

- **Clique em slot de magia**: Alterna entre usado/disponivel
- **Clique em item do inventario**: Abre opcoes rapidas (equipar, usar, remover)
- **Clique em condicao**: Toggle imediato
- **Input de HP**: Campo sempre visivel, sem precisar abrir dialog
- **Magias preparadas**: Checkbox ao lado de cada magia (para Clerigos, Druidas, Paladinos, Magos)

---

## 7. Fase 4 — Migracao de Personagens Existentes (Prioridade Media)

Personagens criados antes desta refatoracao nao terao `builder_data` nem `level_choices`. O Builder deve:

1. **Detectar ausencia** de `builder_data` (null ou `{}`)
2. **Inferir dados** a partir dos campos derivados:
   - `race_id`: buscar no SRD pelo nome em `character.race`
   - `subrace_id`: buscar pelo nome em `character.subrace`
   - `class_id`: buscar no SRD pelo nome em `character.class`
   - `base_attributes`: `character.attributes` menos bonus raciais da raca encontrada
   - `attribute_method`: default `'standard_array'` (impossivel saber qual foi usado)
   - `background_id`: buscar pelo nome em `character.background`
   - `alignment`: usar `character.alignment` direto
3. **Gerar `level_choices`** com uma unica entrada para o nivel atual, contendo:
   - `class_id`: ID da classe do personagem (MULTICLASS-READY)
   - `hp_roll`: `(character.max_hp - CON_mod * level) / level` (estimativa)
   - `used_average`: `true` (default seguro)
   - Demais campos inferidos das `features` existentes
4. **Salvar `builder_data` e `level_choices`** no primeiro acesso ao Builder (migracao lazy)

**Importante**: A migracao NAO deve alterar os campos derivados existentes. Apenas popular `builder_data` e `level_choices` para que o Builder funcione.

---

## 8. Fase 5 — Multiclasse (Futura, NAO Implementar Agora)

> Esta secao documenta os requisitos, regras de negocio e mudancas necessarias para quando multiclasse for implementada. O objetivo e servir como referencia completa para que a implementacao futura nao exija redesign do que foi construido nas Fases 1-4.

### 8.1 Pre-requisitos do SRD 5.1

Para multiclassar, o personagem deve atender aos requisitos de atributo minimo **tanto na classe atual quanto na nova classe**:

| Classe | Atributo Minimo para Entrar/Sair |
|--------|----------------------------------|
| Barbaro | Forca 13 |
| Bardo | Carisma 13 |
| Clerigo | Sabedoria 13 |
| Druida | Sabedoria 13 |
| Guerreiro | Forca 13 ou Destreza 13 |
| Ladino | Destreza 13 |
| Mago | Inteligencia 13 |
| Monge | Destreza 13 e Sabedoria 13 |
| Paladino | Forca 13 e Carisma 13 |
| Patrulheiro | Destreza 13 e Sabedoria 13 |
| Feiticeiro | Carisma 13 |
| Bruxo | Carisma 13 |

A validacao deve ser feita com os **atributos finais** (base + raciais + ASI + talentos) no momento do level up.

### 8.2 Proficiencias de Multiclasse

Ao multiclassar, o personagem NAO ganha todas as proficiencias da nova classe. Ganha apenas as proficiencias listadas na tabela de multiclasse do SRD:

| Classe (ao entrar via multiclasse) | Proficiencias Ganhas |
|------------------------------------|---------------------|
| Barbaro | Escudos, armas simples, armas marciais |
| Bardo | Armaduras leves, 1 pericia a escolha |
| Clerigo | Armaduras leves, armaduras medias, escudos |
| Druida | Armaduras leves, armaduras medias, escudos |
| Guerreiro | Armaduras leves, armaduras medias, escudos, armas simples, armas marciais |
| Ladino | Armaduras leves, 1 pericia (da lista do Ladino), ferramentas de ladrao |
| Mago | Nenhuma |
| Monge | Armas simples, espadas curtas |
| Paladino | Armaduras leves, armaduras medias, escudos, armas simples, armas marciais |
| Patrulheiro | Armaduras leves, armaduras medias, escudos, armas simples, armas marciais, 1 pericia (da lista) |
| Feiticeiro | Nenhuma |
| Bruxo | Armaduras leves, armas simples |

Essas proficiencias devem ser salvas em `level_choices[n].multiclass_proficiencies` no nivel em que o personagem multiclassou.

### 8.3 Spell Slots de Multiclasse

Este e o ponto mais complexo. O SRD define uma tabela unificada de slots para multiclasse:

**Calculo do "Caster Level" combinado:**

```typescript
function getMulticlassCasterLevel(levelChoices: LevelChoice[]): number {
  let casterLevel = 0;

  // Contar niveis por classe
  const classLevels: Record<string, number> = {};
  for (const lc of levelChoices) {
    classLevels[lc.class_id] = (classLevels[lc.class_id] || 0) + 1;
  }

  for (const [classId, level] of Object.entries(classLevels)) {
    const casterType = getCasterType(classId);
    if (casterType === 'full') {
      casterLevel += level;              // Mago, Clerigo, Druida, Bardo, Feiticeiro
    } else if (casterType === 'half') {
      casterLevel += Math.floor(level / 2); // Paladino, Patrulheiro
    }
    // Bruxo NAO contribui para o caster level combinado
  }

  return casterLevel;
}
```

**Tabela de Spell Slots de Multiclasse (SRD):**

| Caster Level | 1o | 2o | 3o | 4o | 5o | 6o | 7o | 8o | 9o |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | - | - | - | - | - | - | - | - |
| 2 | 3 | - | - | - | - | - | - | - | - |
| 3 | 4 | 2 | - | - | - | - | - | - | - |
| 4 | 4 | 3 | - | - | - | - | - | - | - |
| 5 | 4 | 3 | 2 | - | - | - | - | - | - |
| 6 | 4 | 3 | 3 | - | - | - | - | - | - |
| 7 | 4 | 3 | 3 | 1 | - | - | - | - | - |
| 8 | 4 | 3 | 3 | 2 | - | - | - | - | - |
| 9 | 4 | 3 | 3 | 3 | 1 | - | - | - | - |
| 10 | 4 | 3 | 3 | 3 | 2 | - | - | - | - |
| 11 | 4 | 3 | 3 | 3 | 2 | 1 | - | - | - |
| 12 | 4 | 3 | 3 | 3 | 2 | 1 | - | - | - |
| 13 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | - | - |
| 14 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | - | - |
| 15 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | - |
| 16 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | - |
| 17 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | 1 |
| 18 | 4 | 3 | 3 | 3 | 3 | 1 | 1 | 1 | 1 |
| 19 | 4 | 3 | 3 | 3 | 3 | 2 | 1 | 1 | 1 |
| 20 | 4 | 3 | 3 | 3 | 3 | 2 | 2 | 1 | 1 |

**Bruxo — Pact Magic separada:**

O Bruxo usa seus proprios Pact Slots, que NAO se combinam com os slots das outras classes. Os Pact Slots recuperam em descanso curto, enquanto os slots normais recuperam em descanso longo. O sistema precisa rastrear ambos separadamente:

```typescript
type MulticlassSpellcasting = {
  // Slots normais (combinados de todas as classes exceto Bruxo)
  maxSlots: number[];         // [9] - slots por nivel 1-9
  usedSlots: number[];        // [9] - slots usados por nivel 1-9
  // Pact Slots (apenas se tem niveis de Bruxo)
  pactSlots?: {
    max: number;              // Quantidade de Pact Slots
    used: number;             // Pact Slots usados
    slotLevel: number;        // Nivel dos Pact Slots (1-5)
  };
};
```

### 8.4 Magias Conhecidas em Multiclasse

Cada classe mantem sua **propria lista de magias** e seu **proprio atributo de conjuracao**:

```typescript
type ClassSpellcasting = {
  class_id: string;
  casting_ability: string;      // 'intelligence' | 'wisdom' | 'charisma'
  spell_dc: number;             // 8 + proficiency + ability_mod
  spell_attack: number;         // proficiency + ability_mod
  cantrips: string[];           // Truques desta classe
  known_spells: string[];       // Magias conhecidas/preparadas desta classe
  max_prepared?: number;        // Para prepared casters: ability_mod + nivel_na_classe (min 1)
};
```

**Regra critica**: Um Clerigo 5/Mago 3 pode **conhecer** magias de Clerigo ate nivel 3 (Clerigo nivel 5 acessa ate 3o nivel) e magias de Mago ate nivel 2 (Mago nivel 3 acessa ate 2o nivel). Porem, ele pode **usar slots** de qualquer nivel para lancar qualquer magia que conheca, desde que o slot seja igual ou superior ao nivel da magia.

O nivel maximo de magia que uma classe pode aprender:

```typescript
function getMaxSpellLevel(classLevel: number, casterType: string): number {
  if (casterType === 'full') return Math.ceil(classLevel / 2);   // nivel 1->1, 3->2, 5->3, etc.
  if (casterType === 'half') return Math.ceil(classLevel / 4);   // nivel 2->1, 5->2, 9->3, etc.
  if (casterType === 'warlock') return Math.ceil(classLevel / 2); // segue tabela propria
  return 0;
}
```

### 8.5 HP em Multiclasse

O calculo de HP por nivel usa o **dado de vida da classe escolhida naquele nivel**:

```
Nivel 1 (classe inicial):  max(hit_die_da_classe_inicial) + CON_mod
Nivel N (qualquer classe):  max(1, hit_die_da_classe_deste_nivel_roll_ou_media + CON_mod)
```

Como cada `LevelChoice` ja tem `class_id`, a funcao `getComputedHP()` do Builder ja pode resolver isso iterando `level_choices[]` e buscando o `hit_die` de cada `class_id`.

### 8.6 Hit Dice em Multiclasse

O personagem acumula dados de vida de cada classe separadamente. Um Guerreiro 5/Mago 3 tem 5d10 + 3d6 dados de vida. A estrutura `hit_dice` precisa ser expandida:

```typescript
// Formato atual (classe unica)
type HitDice = { total: number; current: number; diceType: string; };

// FUTURO (multiclasse)
type HitDiceMulticlass = {
  pools: {
    class_id: string;
    dice_type: string;     // "d6", "d8", "d10", "d12"
    total: number;         // Niveis nesta classe
    current: number;       // Dados disponiveis
  }[];
};
```

No descanso curto, o jogador escolhe quais dados de vida gastar (de qual pool).

### 8.7 Saving Throws em Multiclasse

O personagem ganha proficiencia em saving throws apenas da **classe inicial**. Multiclassar NAO concede novos saving throws. O campo `saving_throws` continua sendo definido por `builderData.class_id`.

### 8.8 Features e Restricoes

**Extra Attack NAO acumula**: Se um Guerreiro 5 multiclassar para Paladino e chegar ao nivel 5 de Paladino, ele continua tendo apenas um Extra Attack (nao dois). A excecao e o Guerreiro nivel 11+ que ganha versoes superiores.

**Unarmored Defense NAO acumula**: Se o personagem ja tem Defesa sem Armadura do Barbaro e ganha niveis de Monge, ele deve escolher uma das duas formulas — nao pode somar ambas.

**Channel Divinity**: Se multiclassar em duas classes que concedem Channel Divinity (Clerigo + Paladino), ganha as opcoes de ambas, mas o numero de usos NAO acumula.

### 8.9 Mudancas no Builder para Multiclasse

Quando a Fase 5 for implementada:

1. **LevelUpStep**: Adicionar dropdown de selecao de classe no topo do step. O dropdown lista todas as classes disponiveis, com um cadeado nas que o personagem nao atende o pre-requisito de atributo. A classe atual e pre-selecionada.

2. **Sidebar**: Cada nivel mostra o nome da classe (ja preparado no label).

3. **SpellsStep**: Separar magias por classe. Cada classe conjuradora tem sua propria secao com seus truques e magias, sua CD, e seu atributo de conjuracao.

4. **Sheet**: A secao de magias exibe slots unificados + Pact Slots separados. As magias sao agrupadas por classe de origem. Cada grupo mostra a CD e atributo daquela classe.

5. **ReviewStep**: Exibir resumo com niveis por classe (ex: "Guerreiro 5 / Mago 3").

6. **Novo arquivo `src/lib/multiclassUtils.ts`**: Centralizar toda logica de multiclasse:
   - `getMulticlassCasterLevel()`
   - `getMulticlassSpellSlots()`
   - `getMaxSpellLevel()`
   - `getMulticlassProficiencies()`
   - `validateMulticlassPrerequisites()`
   - `canMulticlassInto(classId, attributes)`

7. **Novo arquivo de dados `src/data/multiclass-proficiencies.json`**: Tabela de proficiencias ganhas ao multiclassar (conforme secao 8.2).

### 8.10 Mudancas no Schema para Multiclasse

```sql
-- Adicionar coluna de classes (array de objetos)
ALTER TABLE characters ADD COLUMN classes jsonb DEFAULT '[]';

-- A coluna 'class' (text) continua existindo como campo derivado
-- para retrocompatibilidade e exibicao rapida.
-- Valor: nome da classe com mais niveis (ou classe primaria em empate)
```

A coluna `classes` e populada pelo Builder ao salvar, derivada de `level_choices[]`:

```typescript
function deriveClasses(levelChoices: LevelChoice[], builderData: BuilderData): CharacterClass[] {
  const classMap: Record<string, CharacterClass> = {};

  for (const lc of levelChoices) {
    if (!classMap[lc.class_id]) {
      classMap[lc.class_id] = {
        class_id: lc.class_id,
        class_name: getClassName(lc.class_id),
        level: 0,
        is_primary: lc.class_id === builderData.class_id,
      };
    }
    classMap[lc.class_id].level++;

    // Capturar subclasse quando escolhida
    if (lc.subclass_id) {
      classMap[lc.class_id].subclass_id = lc.subclass_id;
      classMap[lc.class_id].subclass_name = getSubclassName(lc.subclass_id);
    }
  }

  return Object.values(classMap);
}
```

### 8.11 Impacto em `spellSlotUtils.ts`

Adicionar uma nova funcao (NAO alterar as existentes):

```typescript
// Nova funcao para multiclasse
function getMulticlassSpellSlots(levelChoices: LevelChoice[]): number[] {
  const casterLevel = getMulticlassCasterLevel(levelChoices);
  return MULTICLASS_SPELL_SLOTS[casterLevel] || [0,0,0,0,0,0,0,0,0];
}

// Funcao decisora: usa single-class ou multiclass conforme necessario
function getEffectiveSpellSlots(levelChoices: LevelChoice[], builderData: BuilderData): number[] {
  const uniqueClasses = new Set(levelChoices.map(lc => lc.class_id));
  if (uniqueClasses.size === 1) {
    // Classe unica: usar tabela normal
    return getSpellSlotsForClass(builderData.class_id, levelChoices.length);
  } else {
    // Multiclasse: usar tabela combinada
    return getMulticlassSpellSlots(levelChoices);
  }
}
```

---

## 9. Rotas

```typescript
// Rota de criacao
/characters/new          --> CharacterBuilder (mode: 'create')

// Rota de edicao/builder
/characters/:id/builder  --> CharacterBuilder (mode: 'edit')

// Rota da ficha de jogo
/characters/:id          --> CharacterSheet (somente leitura estrutural + edicao de jogo)
```

---

## 10. Regras de Negocio Criticas (Fases 1-4)

### 10.1 Calculo de HP

```
Nivel 1: max(hit_die) + CON_mod + racial_hp_bonus
Nivel N: max(1, hp_roll_or_avg + CON_mod + racial_hp_bonus + feat_hp_bonus)
Total:   soma de todos os niveis + retroativo_CON + retroativo_talento
```

- **Retroativo CON**: Se CON muda (via ASI ou talento), recalcular `(novo_CON_mod - antigo_CON_mod) * nivel_atual` e aplicar ao total.
- **Retroativo Robusto**: Se o talento "Robusto" e adquirido, aplicar `+2 * nivel_atual` retroativamente.
- **MULTICLASS-READY**: O `hit_die` de cada nivel vem de `level_choices[n].class_id`. Nas Fases 1-4 sera sempre o mesmo dado.

### 10.2 Calculo de CA

```
Sem armadura:                  10 + DEX_mod
Com armadura leve:             armor.base + DEX_mod
Com armadura media:            armor.base + min(DEX_mod, 2)
Com armadura pesada:           armor.base
Monge (sem armadura):          10 + DEX_mod + WIS_mod
Barbaro (sem armadura):        10 + DEX_mod + CON_mod
Escudo equipado:               + 2
Estilo de Luta Defesa:         + 1 (se usando armadura)
Talento Combatente Duas Armas: + 1
```

### 10.3 Proficiency Bonus

Derivado da tabela `avanco-personagem.json`, sempre pelo **nivel total**:

```
Niveis 1-4:   +2
Niveis 5-8:   +3
Niveis 9-12:  +4
Niveis 13-16: +5
Niveis 17-20: +6
```

### 10.4 Spell Slots

Usar as tabelas existentes em `spellSlotUtils.ts`:
- `FULL_CASTER_SLOTS` para Mago, Feiticeiro, Bardo, Clerigo, Druida
- `HALF_CASTER_SLOTS` para Paladino, Patrulheiro (slots a partir do nivel 2)
- `WARLOCK_PACT_SLOTS` para Bruxo

**MULTICLASS-READY**: Quando multiclasse for implementada, usar `getEffectiveSpellSlots()` descrita na secao 8.11. Esta funcao verifica automaticamente se ha mais de uma classe e usa a tabela correta.

### 10.5 Formato de Skills

O Builder deve salvar skills **sempre no formato objeto** (novo padrao):

```typescript
{
  acrobatics: { proficient: true },
  insight: { proficient: true, expertise: true },
}
```

A Sheet deve continuar suportando leitura de ambos os formatos (objeto e array legado) para retrocompatibilidade.

### 10.6 IDs de Skills

Padronizar no Builder para usar **hifens** (formato do `ALL_SKILLS` no `srd.ts`):
- `sleight-of-hand` (correto)
- `animal-handling` (correto)

A Sheet deve normalizar IDs com underscore para hifens ao ler.

---

## 11. Ordem de Implementacao Recomendada

```
FASE 1A - Infraestrutura
  1. Criar colunas no DB: builder_data, level_choices
  2. Criar BuilderContext com estado, funcoes derivadas e getClassLevel()
  3. Criar BuilderSidebar com navegacao (labels com class_id por nivel)
  4. Criar CharacterBuilder.tsx como shell com rotas

FASE 1B - Steps Refatorados
  5. Refatorar RaceStep (inicializacao condicional + sync com contexto)
  6. Refatorar ClassStep
  7. Refatorar AttributesStep
  8. Refatorar SkillsStep
  9. Refatorar LanguagesStep
  10. Refatorar EquipmentStep
  11. Refatorar SpellsStep
  12. Refatorar BackgroundStep
  13. Refatorar BackstoryStep
  14. Refatorar ReviewStep (suportar INSERT e UPDATE)

FASE 2 - Level Up
  15. Criar LevelUpStep com toda a logica migrada do LevelUpSheet
      - Usar getClassLevel() para desbloqueio de subclasse e ASI
      - Campo class_id preenchido automaticamente (Fases 1-4)
  16. Integrar LevelUpStep na sidebar (timeline de niveis com nome da classe)
  17. Implementar botao "Subir de Nivel"
  18. Implementar edicao retroativa com recalculo em cascata
  19. Remover LevelUpSheet.tsx

FASE 3 - Sheet Refatorada
  20. Remover EditStatsSheet da Sheet (migrar para Builder)
  21. Remover SpellsManagementSheet da Sheet (migrar para Builder)
  22. Remover EditAppearanceSheet da Sheet (migrar para Builder)
  23. Adicionar botao "Abrir Builder" na Sheet
  24. Implementar interacoes rapidas (clique em slots, toggle em condicoes, etc.)

FASE 4 - Migracao
  25. Implementar logica de inferencia para personagens antigos
  26. Testar migracao com personagens existentes
  27. Popular builder_data/level_choices no primeiro acesso ao Builder

FASE 5 - Multiclasse (FUTURA - NAO IMPLEMENTAR AGORA)
  28. Criar src/data/multiclass-proficiencies.json
  29. Criar src/lib/multiclassUtils.ts com funcoes de validacao e calculo
  30. Adicionar coluna 'classes' (jsonb) na tabela characters
  31. Habilitar dropdown de classe no LevelUpStep com validacao de pre-requisitos
  32. Refatorar SpellsStep para separar magias por classe
  33. Adicionar tabela MULTICLASS_SPELL_SLOTS em spellSlotUtils.ts
  34. Implementar getEffectiveSpellSlots() e getMulticlassCasterLevel()
  35. Refatorar Sheet para exibir Pact Slots separados e magias agrupadas por classe
  36. Refatorar hit_dice para suportar multiplos pools de dados de vida
  37. Atualizar ReviewStep para exibir resumo multi-classe
  38. Testes completos de combinacoes de classes
```

---

## 12. Componentes a Remover Apos Conclusao (Fases 1-4)

| Componente | Motivo |
|------------|--------|
| `CharacterWizard.tsx` | Substituido por `CharacterBuilder.tsx` |
| `LevelUpSheet.tsx` | Absorvido pelo `LevelUpStep.tsx` no Builder |
| `EditStatsSheet.tsx` | Funcionalidade movida para steps do Builder |
| `EditAppearanceSheet.tsx` | Funcionalidade movida para `BackstoryStep` no Builder |
| `SpellsManagementSheet.tsx` | Funcionalidade movida para `SpellsStep` no Builder |

---

## 13. Arquivos de Referencia (Nao Alterar)

Estes arquivos contem dados e utilitarios que o Builder deve consumir, mas NAO precisam ser modificados nas Fases 1-4:

| Arquivo | Funcao |
|---------|--------|
| `src/data/srd.ts` | Dados SRD centrais (racas, classes, pericias, idiomas) |
| `src/data/classes/*.json` | Dados de cada classe (features, subclasses, equipment) |
| `src/data/races/*.json` | Dados de cada raca (bonus, traits, sub-racas) |
| `src/data/spells/magias.json` | Banco de magias SRD |
| `src/data/rules/avanco-personagem.json` | Tabela XP, nivel, proficiency bonus |
| `src/lib/spellSlotUtils.ts` | Tabelas e funcoes de spell slots (Fase 5 adiciona funcoes, nao altera existentes) |
| `src/lib/featEffects.ts` | Efeitos mecanicos de talentos |
| `src/hooks/useCharacters.tsx` | CRUD + changelog (usar como esta) |
| `src/hooks/useHomebrew.ts` | Conteudo homebrew (usar como esta) |

---

## 14. Notas de UX

- O Builder deve ter **auto-save** ou pelo menos um indicador claro de "alteracoes nao salvas"
- Ao editar um nivel anterior que causa cascata, mostrar um **alerta antes de aplicar** listando o que sera afetado
- A sidebar deve mostrar **badges visuais** indicando itens incompletos ou com erro
- O botao "Subir de Nivel" deve ser o CTA principal quando o personagem tem XP suficiente
- A transicao entre Builder e Sheet deve ser fluida (mesma sessao, sem perder estado de jogo)
- Manter animacoes com `framer-motion` para transicoes de step, consistente com o UX atual
- **MULTICLASS-READY (Fase 5)**: O dropdown de selecao de classe no level up deve exibir um icone de cadeado nas classes cujo pre-requisito de atributo nao e atendido, com tooltip explicando o que falta
