

# Plano de Revisao e Teste da Ficha de Personagem

## Bugs e Problemas Identificados na Analise de Codigo

### 1. BUG VISUAL: "Pontos de Vida" duplicado
No `CharacterSheet.tsx` linhas 1274-1278, o titulo "Pontos de Vida" aparece duas vezes:
- Linha 1275: `<h3>` com icone Heart + "Pontos de Vida"
- Linha 1278: `<h3>` "Pontos de Vida" sem icone

### 2. BUG: Spell Slots usam tabela de conjurador completo para TODAS as classes
`SPELL_SLOTS_BY_LEVEL` em `SpellCastDialog.tsx` e `SpellsManagementSheet.tsx` usa a tabela padrao de conjurador completo (Mago, Clerigo, etc.). Porem:
- **Paladino e Patrulheiro** sao **meio-conjuradores** (metade dos slots)
- **Bruxo** usa **Pacto Magico** (slots diferentes, todos do mesmo nivel)

O sistema atribui slots completos a todas as classes, resultando em mais slots do que o correto para Paladinos, Patrulheiros e Bruxos.

### 3. BUG: Spellcasting Ability fallback incorreto
No `CharacterSheet.tsx` linhas 2053-2058, a logica de fallback para determinar o atributo de conjuracao usa `primary_abilities[0]`, mas isso pode nao corresponder ao atributo de conjuracao. Ex: Paladino tem FOR como primary_ability mas CAR como spellcasting_ability.

### 4. BUG POTENCIAL: Long Rest nao recupera slots de magia
`handleLongRest` (linhas 737-761) recupera HP e hit dice, mas **nao** chama `handleRecoverAllSlots`. Os slots de magia so sao recuperados manualmente pelo botao "Descanso" na secao de magias. Descanso longo deveria resetar slots automaticamente.

### 5. BUG: Death Saves nao resetam quando HP sobe de 0
Quando um personagem e curado de 0 HP, os testes contra morte deveriam resetar para 0/0. A funcao `handleHpChange` nao reseta `death_saves`.

### 6. BUG: LevelUp sheet - Robusto (Tough) retroativo calcula errado
Na linha 302-305 do `LevelUpSheet.tsx`, ao selecionar "Robusto" adiciona `2 * currentLevel` HP retroativo. Mas isso esta correto apenas se e a primeira vez que o talento e selecionado. Se o personagem ja tinha Robusto (edge case), duplicaria o bonus.

### 7. BUG: LevelUp sheet - CON retroativo nao atualiza current_hp igualmente
Linhas 308-315: `retroactiveHpFromCon` e adicionado a max_hp e current_hp. Correto. Mas se o personagem estava ferido (current_hp < max_hp), ganhar HP retroativo de CON deveria ajustar ambos proporcionalmente? Na verdade, as regras D&D dizem que o ganho retroativo afeta ambos igualmente, entao esta correto.

### 8. FALTA: Milestone toggle nao persiste
`useMilestone` (linha 297) e um `useState(false)` - perde o estado ao recarregar a pagina. Deveria ser salvo no personagem ou em localStorage.

### 9. BUG VISUAL: Spells section mostra apenas 10 magias
Linha 2086: `characterSpellsWithData.slice(0, 10)` limita a exibicao a 10 magias sem indicar que ha mais. Personagens de alto nivel podem ter 20+ magias.

### 10. BUG: Cantrip casting bypassa checagem de concentracao
Na funcao `handleCastSpell` (linha 324), cantrips sao corretamente identificados, mas se um truque tiver `concentration: true` (nenhum truque SRD tem, mas homebrews podem), a flag `isConcentration` e passada como `false` para cantrips na `SpellCastDialog.executeCast` (linha 163).

---

## Plano de Testes por Cenario

### Cenario 1: Guerreiro Nv1 - Mecanicas Basicas
- **HP**: Dano, cura, dano alem de 0 HP, temp HP absorvendo dano
- **Temp HP**: Nao acumula (usa o maior), removivel manualmente
- **Morte**: 0 HP mostra testes contra morte, curar reseta?
- **CA/Iniciativa/Velocidade**: Valores corretos baseados nos atributos
- **Pericias**: Proficiencias corretas, bonus calculados (mod + prof)
- **Salvaguardas**: FOR e CON proficientes para Guerreiro
- **Condicoes**: Adicionar/remover, sincronia com combate
- **Descanso Curto**: Gastar dados de vida, recuperar HP
- **Descanso Longo**: Recuperar todo HP, metade dos dados de vida

### Cenario 2: Mago Nv5 - Sistema de Magias Completo
- **Spell Slots**: Verificar 4/3/2 (correto para conjurador completo nv5)
- **Lançar Magia**: Consumir slot, upcast
- **Concentracao**: Ativar, conflito com segunda concentracao, encerrar
- **Descanso Longo**: Recupera TODOS os slots?
- **Gerenciar Magias**: Adicionar do compendio, preparar/despreparar, remover
- **CD e Ataque**: 8 + prof(+3) + INT mod = correto?

### Cenario 3: Paladino Nv5 - Meio-Conjurador (BUG ESPERADO)
- **Spell Slots**: Sistema atualmente mostra 4/3/2 (errado, deveria ser 4/2)
- **Features**: Lay on Hands, Divine Sense aparecem na aba Habilidades?
- **Salvaguardas**: SAB e CAR proficientes

### Cenario 4: Bruxo Nv5 - Pacto Magico (BUG ESPERADO)
- **Spell Slots**: Deveria ter 2 slots de 3o nivel (Pacto Magico), mas mostrara tabela padrao

### Cenario 5: Barbaro Nv4 - Level Up com Talento
- **Level Up**: Nv3 → Nv4, selecionar talento (Alerta: +5 iniciativa)
- **Feat Effects**: Iniciativa na ficha reflete +5?
- **Level Up com Atributos**: Alternativa, +2 FOR ou +1/+1
- **Cap 20**: Atributos nao passam de 20

### Cenario 6: Clerigo - Descanso Longo Completo
- **Descanso Longo**: HP recupera, dados de vida recuperam, slots recuperam?
- **Descanso Curto**: Gastar 0 dados (so recursos), gastar N dados

### Cenario 7: Ladino - 4 Pericias + Expertise
- **Pericias**: 4 proficientes, expertise aparece com calculo dobrado
- **Expertise visual**: Estilizacao dourada diferente de proficiencia

### Cenario 8: Inventario e Moedas
- **Moedas**: PL/PO/PE/PP/PC exibem corretamente
- **Itens equipados vs inventario**: Separacao visual
- **Gerenciar inventario**: Adicionar item, remover, equipar/desequipar
- **Troca**: So aparece se em campanha com outros jogadores

### Cenario 9: Aparencia e Backstory
- **Dados fisicos**: Idade, altura, peso, olhos, cabelo, pele
- **Personalidade**: Tracos, ideais, vinculos, defeitos
- **Historia**: Backstory, objetivos, aliados
- **Empty state**: Se nada preenchido, mensagem correta

### Cenario 10: Mobile vs Desktop
- **Mobile**: Menu dropdown funciona, tabs respondem
- **Desktop**: Sidebar com acoes, layout 3 colunas
- **Responsive**: Cards adaptam de 3 para 1 coluna

---

## Resumo de Bugs para Corrigir

| # | Bug | Severidade | Status |
|---|-----|-----------|--------|
| 1 | "Pontos de Vida" titulo duplicado | Baixa | ✅ CORRIGIDO |
| 2 | Spell slots incorretos para meio-conjuradores e Bruxo | Alta | ✅ CORRIGIDO - Criado spellSlotUtils.ts com tabelas separadas |
| 3 | Spellcasting ability fallback pode estar errado | Media | ✅ CORRIGIDO - Usando getSpellcastingAbility() |
| 4 | Descanso Longo nao recupera spell slots automaticamente | Media | ✅ CORRIGIDO - handleLongRest agora reseta slots e concentracao |
| 5 | Death saves nao resetam ao curar de 0 HP | Media | ✅ CORRIGIDO - handleHpChange reseta death_saves |
| 6 | Magias limitadas a 10 sem indicacao de mais | Baixa | ✅ CORRIGIDO - Removido .slice(0, 10) |
| 7 | Milestone toggle nao persiste entre sessoes | Baixa | ✅ CORRIGIDO - Usando localStorage |

## Abordagem de Execucao

1. Primeiro, testar no browser os cenarios acima para confirmar os bugs visualmente
2. Corrigir por prioridade: Alta (slots por classe) > Media (long rest slots, death saves, spellcasting ability) > Baixa (titulo duplicado, limite 10, milestone)
3. Para spell slots por classe, criar tabela separada para half-casters e Warlock Pact Magic
4. Re-testar cada cenario afetado apos correcao

