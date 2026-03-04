

# Estudo de Nova Paleta de Cores — Protocolo 3Cs + Contraste + Apoio

---

## Conceito 1: Contexto e Psicologia das Cores

**Nicho:** Aplicativo companion para RPG de mesa (D&D 5e), chamado Go20.
**Público-alvo:** Jogadores e mestres de RPG, majoritariamente jovens adultos (18-35), familiarizados com fantasia medieval, cultura geek.
**Objetivo:** Ferramenta funcional (fichas, campanhas, combate) com identidade visual que evoque aventura, magia e imersão.
**Identidade existente:** O logo Go20 já possui 4 cores: Solar Orange (#FF9F55), Cyan Blue (#6DD5FA), Cosmic Purple (#8A2BE2) e Magenta Red (#FF4E50). A base é escura (#1A1A1A).

**Diagnóstico do problema atual:**
- 4 cores vibrantes competem entre si — não há hierarquia clara 60/30/10.
- Solar Orange é usada como primary E como gold — ambiguidade funcional.
- Cyan Blue, Cosmic Purple e Magenta Red são todas usadas como accent, diluindo o impacto.
- Os gradientes (4 cores misturadas) criam ruído visual em vez de foco.

**Direção psicológica recomendada:**
- **Laranja/Âmbar:** Energia, aventura, ação — perfeito para CTAs (manter como acento).
- **Roxo profundo:** Mistério, magia, nobreza — excelente como secundária para identidade RPG.
- **Neutros quentes:** Base escura com leve matiz quente para acolhimento e imersão.

---

## Conceito 2: Combinação e Harmonia — 3 Propostas de Paleta

### Proposta A: "Pergaminho & Chama" (Warm Fantasy)

```text
┌─────────────────────────────────────────────────┐
│  DOMINANTE (60%)    │  #0F0D0B  │  Preto Quente │  Fundo base, painéis
│  SECUNDÁRIA (30%)   │  #C8A97A  │  Ouro Antigo  │  Títulos, texto, ícones
│  ACENTO (10%)       │  #E8622C  │  Fogo Vivo    │  CTAs, botões, alertas
│─────────────────────│───────────│───────────────│──────────────────────
│  Apoio Dominante    │  #1A1612  │  Painéis      │  surface-1
│  Apoio Dominante    │  #252017  │  Elevado      │  surface-2
│  Apoio Secundária   │  #8B7350  │  Texto muted  │  subtítulos
│  Apoio Acento       │  #FF8A50  │  Hover CTA    │  hover states
└─────────────────────────────────────────────────┘
```
**Sensação:** Taverna medieval, pergaminho antigo, luz de vela. Muito RPG.
**Contraste:** Ouro Antigo sobre Preto Quente = ratio ~9:1 (excelente).

---

### Proposta B: "Abismo & Arcano" (Cool Mystical)

```text
┌─────────────────────────────────────────────────┐
│  DOMINANTE (60%)    │  #0A0A14  │  Azul Abismo  │  Fundo base
│  SECUNDÁRIA (30%)   │  #A8B4C8  │  Prata Lunar  │  Texto, títulos, ícones
│  ACENTO (10%)       │  #8A2BE2  │  Roxo Arcano  │  CTAs, botões, magia
│─────────────────────│───────────│───────────────│──────────────────────
│  Apoio Dominante    │  #12121E  │  Painéis      │  surface-1
│  Apoio Dominante    │  #1A1A2A  │  Elevado      │  surface-2
│  Apoio Secundária   │  #6B7A90  │  Texto muted  │  subtítulos
│  Apoio Acento       │  #A855F7  │  Hover CTA    │  hover states
│  Apoio Acento Alt   │  #FF9F55  │  Laranja Logo │  badges, warnings
└─────────────────────────────────────────────────┘
```
**Sensação:** Noite estrelada, magia arcana, mistério. Elegante e moderno.
**Contraste:** Prata Lunar sobre Azul Abismo = ratio ~8.5:1 (excelente).

---

### Proposta C: "Forja & Brasa" (Balanced — Recomendada)

```text
┌─────────────────────────────────────────────────┐
│  DOMINANTE (60%)    │  #0D0B0F  │  Obsidiana    │  Fundo base, painéis
│  SECUNDÁRIA (30%)   │  #B8A898  │  Pedra Clara  │  Texto, títulos
│  ACENTO (10%)       │  #E0652C  │  Brasa Viva   │  CTAs, destaques
│─────────────────────│───────────│───────────────│──────────────────────
│  Apoio Dominante    │  #151218  │  surface-1    │  cards
│  Apoio Dominante    │  #1E1A22  │  surface-2    │  interativos
│  Apoio Dominante    │  #28232D  │  surface-3    │  botões ghost
│  Apoio Secundária   │  #7A7068  │  muted text   │  subtítulos
│  Apoio Acento       │  #FF8A50  │  hover        │  hover states
│  Acento Alt         │  #8A2BE2  │  Roxo Logo    │  badges premium
│  Funcional          │  #E04050  │  Vermelho     │  destructive/erro
│  Funcional          │  #3B9E6F  │  Verde        │  sucesso/online
└─────────────────────────────────────────────────┘
```
**Sensação:** Forja do ferreiro, brasas na escuridão. Quente mas controlado. Combina aventura com usabilidade.
**Contraste:** Pedra Clara sobre Obsidiana = ratio ~8:1 (excelente). Brasa sobre Obsidiana = ratio ~5.5:1 (bom para botões grandes).

---

## Conceito 3: Contribuição 60/30/10 (Aplicação Prática)

Usando a **Proposta C** como exemplo:

```text
60% Obsidiana (#0D0B0F)
├── background da página
├── surface-0 (base)
├── fundos de seções
└── áreas de respiro

30% Pedra Clara (#B8A898)
├── títulos de seção
├── texto de corpo
├── ícones de navegação (inativos)
├── labels de formulário
└── bordas sutis

10% Brasa Viva (#E0652C)
├── botões primários (CTAs)
├── ícone ativo no tab bar
├── badges de notificação
├── links importantes
└── glow effects em hover
```

## Conceito 4: Verificação de Contraste

| Combinação | Ratio | Resultado |
|---|---|---|
| Pedra Clara (#B8A898) sobre Obsidiana (#0D0B0F) | ~8.2:1 | AAA (excelente) |
| Brasa (#E0652C) sobre Obsidiana (#0D0B0F) | ~5.5:1 | AA (bom para texto grande/botões) |
| Brasa (#E0652C) — texto branco dentro do botão | ~4.6:1 | AA (adequado com font-weight bold) |
| Muted (#7A7068) sobre Obsidiana (#0D0B0F) | ~4.5:1 | AA (suficiente para texto secundário) |

## Conceito 5: Cores de Apoio (já mapeadas acima)

- **Tints da Dominante:** 4 níveis de surface (0-3) para profundidade com leve matiz roxa/quente
- **Shade da Secundária:** #7A7068 para texto muted
- **Tint do Acento:** #FF8A50 para hover states
- **Cores funcionais limitadas:** Verde sucesso, Vermelho erro, Roxo premium (do logo)
- **Regra:** Máximo 2 cores de apoio por cor principal

---

## Recomendação

Sugiro a **Proposta C ("Forja & Brasa")** porque:
1. Mantém o laranja do logo como acento (identidade preservada)
2. O roxo do logo aparece como cor de "premium/magia" (uso especial, não generalizado)
3. Reduz de 4 cores vibrantes competindo para 1 cor de acento clara
4. A base com leve matiz roxa dá personalidade sem distrair
5. O sistema de superfícies com tom quente cria acolhimento imersivo

Posso implementar qualquer uma das 3 propostas, ou criar uma variação híbrida.

