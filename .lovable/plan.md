

# Plano de Revisao Completa do Wizard de Criacao de Personagem

## Bugs e Problemas Identificados na Analise de Codigo

### 1. BUG CRITICO: Barbaro - Unarmored Defense usa ID errado
No `CharacterWizard.tsx` (linha 352) e `ReviewStep.tsx` (linha 63), o check para Barbaro usa:
```
selectedClass.id === 'barbarian' || selectedClass.id === 'barbaro'
```
Porem o JSON do barbaro define `"id": "barbarian"`. O `'barbaro'` e redundante mas inofensivo. O problema real e que o **Monge** usa `selectedClass.id === 'monk'` e o JSON define `"id": "monk"` -- esta correto.

**Veredicto**: IDs estao OK, sem bug aqui.

### 2. BUG: Paladino e Patrulheiro nao aparecem no SpellsStep como conjuradores
O `SPELLCASTING_CLASSES` no SpellsStep (linha 66-73) lista apenas: wizard, sorcerer, bard, cleric, druid, warlock. **Paladino e Patrulheiro estao ausentes**. Eles nao sao conjuradores no nivel 1 (ganham magias no nivel 2), entao tecnicamente esta correto para criacao de nivel 1. Porem, o step mostra "Sem Magias" com features de nivel 1 para eles -- precisa verificar se o Paladino e Ranger possuem `features` no JSON.

Paladino JSON: nivel 1 features = `["divine_sense", "lay_on_hands"]` -- mas isso e a lista de IDs, nao os objetos de feature. Preciso checar se `features` array com objetos existe.

### 3. BUG POTENCIAL: Patrulheiro JSON sem array `features`
O arquivo `patrulheiro.json` parece nao ter um array `features` detalhado (com `description_markdown`). Isso significa que no SpellsStep, quando Patrulheiro e selecionado, o `level1Features` sera `[]` e a tela mostrara apenas "Sem Magias" sem nenhuma habilidade. Mesmo problema potencial para Paladino.

### 4. BUG: Meio-Elfo - Versatilidade em Pericias nao implementada
O Meio-Elfo tem o traço "Versatilidade em Pericias" (`skill_proficiencies_choice: { count: 2 }`), que da 2 pericias extras de qualquer lista. **O wizard nao implementa essa selecao**. O SkillsStep so respeita as pericias da classe.

### 5. BUG: Anao - Escolha de ferramenta racial nao implementada
O Anao tem `tool_proficiencies_choice: { choose: 1, from: [...] }`, mas o wizard nao tem um passo para selecionar isso.

### 6. FALTA: Escudo nao calcula CA corretamente quando combinado com armadura
No EquipmentStep, "Escudo" aparece como opcao de arma secundaria para Guerreiro e Paladino. Porem, no calculo de CA (`CharacterWizard.tsx` linhas 330-355), se o usuario seleciona uma armadura E um escudo como arma secundaria, o bonus de escudo nao e adicionado. O campo `data.armor` guarda apenas 1 item. Se o escudo for selecionado como `secondaryWeapon`, ele nao afeta a CA.

### 7. BUG: Languages armazena IDs mas exibe nomes
No `LanguagesStep`, `handleToggleLanguage` usa `lang.id` (ex: "dwarvish"), mas `selectedRace.languages` usa nomes em portugues (ex: "Anao"). Na hora de salvar (`CharacterWizard.tsx` linha 428): `languages: [...selectedRace.languages, ...data.extraLanguages]` -- mistura nomes PT com IDs em ingles.

### 8. BUG: Feiticeiro ID errado
No `CharacterWizard.tsx` linha 366: `selectedClass.id === 'sorcerer'`, mas o JSON do feiticeiro precisa ser verificado.

---

## Plano de Testes por Cenario

### Cenario 1: Anao da Colina + Clerigo (Conjurador preparador)
- **Raça**: Verificar que sub-raca "Anao da Colina" aparece e seleciona
- **Atributos**: CON +2 (racial) e SAB +1 (sub-raca) exibidos corretamente
- **HP**: d8 + CON mod + 1 (Tenacidade Ana) = correto?
- **Pericias**: 2 escolhas de lista do Clerigo
- **Idiomas**: Comum + Anao, sem extra
- **Equipamento**: Cota de Malha, Brunea ou Couro; Maca ou Martelo de Guerra
- **Magias**: 3 truques, 0 magias iniciais (prepara lista completa)
- **CA**: Deve refletir armadura pesada (Cota de Malha = 16 fixo)
- **Ferramenta racial**: NAO implementada -- bug a reportar

### Cenario 2: Meio-Elfo + Bardo (Pericias livres + bonus de atributo a escolha)
- **Raça**: CAR +2 fixo, escolher 2 atributos para +1
- **Atributos**: Painel de escolha de bonus aparece (ability_bonuses_choice)
- **Pericias**: Bardo pode escolher "any" (qualquer pericia), 3 escolhas
- **Pericias raciais**: "Versatilidade em Pericias" (2 extras) -- **NAO IMPLEMENTADO, BUG**
- **Idiomas**: Comum + Elfico + 1 extra
- **Magias**: 2 truques + 4 de 1o nivel
- **CA**: Couro = 11 + DES

### Cenario 3: Humano + Guerreiro (Sem magia, todas as armas)
- **Raça**: +1 em todos os atributos
- **Pericias**: 2 de lista do Guerreiro
- **Idiomas**: Comum + 1 extra (trait "Idioma Extra")
- **Equipamento**: Armas marciais, armaduras pesadas, escudo
- **Magias**: Tela "Sem Magias" com features de nivel 1
- **CA**: Escudo como arma secundaria nao adiciona +2 -- **BUG**

### Cenario 4: Meio-Orc + Barbaro (Unarmored Defense)
- **Raça**: FOR +2, CON +1
- **Pericias raciais**: Intimidacao automatica -- verificar se e adicionada
- **CA**: Sem armadura = 10 + DES + CON (Unarmored Defense barbaro)
- **HP**: d12 + CON mod

### Cenario 5: Elfo + Mago (Conjurador com mais magias)
- **Raça**: Verificar sub-racas (Alto Elfo com truque extra?)
- **Magias**: 3 truques + 6 de 1o nivel
- **Equipamento**: Sem armadura, bordao/adaga

### Cenario 6: Halfling + Ladino (Tamanho Pequeno)
- **Raça**: Tamanho "Pequeno" exibido corretamente
- **Pericias**: 4 escolhas (Ladino)
- **Equipamento**: Couro, rapieira/espada curta

### Cenario 7: Draconato + Paladino (Sem magia no nv1)
- **Magias**: "Sem Magias" + features de nivel 1 (Divine Sense, Lay on Hands)
- **Verificar**: Features aparecem ou tela vazia?

### Cenario 8: Gnomo + Feiticeiro (Sorcery Points)
- **Magias**: 4 truques + 2 de 1o nivel
- **Verificar**: Sorcery points inicializados corretamente

### Cenario 9: Tiefling + Bruxo
- **Magias**: 2 truques + 2 de 1o nivel
- **Idiomas**: Comum + Infernal

### Cenario 10: Antecedente Customizado
- **Background**: Selecionar "Customizado", abrir sheet
- **Pericias**: 2 pericias customizadas
- **Proficiencias**: 2 idiomas/ferramentas

---

## Resumo de Bugs - Status

| # | Bug | Severidade | Status |
|---|-----|-----------|--------|
| 1 | Meio-Elfo: "Versatilidade em Pericias" (2 pericias extras) nao implementada | Alta | ✅ CORRIGIDO |
| 2 | Idiomas extra salvos como ID ingles, raciais como nome PT (inconsistencia) | Media | ✅ CORRIGIDO |
| 3 | Escudo como arma secundaria nao adiciona +2 CA | Media | ✅ CORRIGIDO (CharacterWizard + ReviewStep) |
| 4 | Anao: escolha de ferramenta racial ignorada | Baixa | ⏳ Pendente (menor prioridade) |
| 5 | Patrulheiro/Paladino: features de nv1 podem nao aparecer | Baixa | ✅ NAO ERA BUG (JSONs tem features array completo) |
| 6 | Feiticeiro: ID no JSON pode ser diferente de 'sorcerer' | Media | ✅ NAO ERA BUG (ID = "sorcerer" confirmado) |

