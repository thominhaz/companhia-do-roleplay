# 📋 CHECKLIST DE TESTES - Go20 v1.0.0

> **Data de criação:** Dezembro 2024  
> **Última atualização:** —  
> **Testador:** —  
> **Status:** Pendente

---

## 📊 Resumo de Progresso

| Seção | Total | ✅ OK | ❌ Falha | ⏳ Pendente |
|-------|-------|-------|---------|-------------|
| Autenticação | 12 | | | |
| Wizard Personagem | 45 | | | |
| Ficha de Personagem | 55 | | | |
| Personagens | 10 | | | |
| Campanhas | 40 | | | |
| Combat Tracker | 18 | | | |
| A Forja (Homebrew) | 50 | | | |
| Ferramentas | 30 | | | |
| Assinatura | 25 | | | |
| Notificações | 15 | | | |
| Menu/Config | 18 | | | |
| Home | 10 | | | |
| Navegação | 8 | | | |
| Controle de Acesso | 15 | | | |
| Integrações | 4 | | | |
| Dados/Banco | 10 | | | |
| Edge Cases | 12 | | | |
| **TOTAL** | **~357** | | | |

---

## 🔐 1. AUTENTICAÇÃO

### 1.1 Registro
- [ ] Criar conta com email e senha
- [ ] Validação de campos obrigatórios
- [ ] Senha mínima/requisitos
- [ ] Email de confirmação (auto-confirm ativo)

### 1.2 Login
- [ ] Login com email/senha válidos
- [ ] Erro ao usar credenciais inválidas
- [ ] Redirecionamento após login
- [ ] Persistência de sessão (refresh da página)

### 1.3 Logout
- [ ] Logout funciona corretamente
- [ ] Sessão é limpa
- [ ] Redirecionamento para tela de auth

### 1.4 Reset de Senha
- [ ] Solicitar reset de senha
- [ ] Receber link por email
- [ ] Definir nova senha

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 👤 2. WIZARD DE CRIAÇÃO DE PERSONAGEM

### 2.1 Passo 1 - Raça
- [ ] Listar todas as raças SRD
- [ ] Selecionar raça
- [ ] Exibir bônus de atributos
- [ ] Exibir traços raciais
- [ ] Selecionar sub-raça (quando disponível)
- [ ] Botão "Próximo" ativo apenas com raça selecionada

### 2.2 Passo 2 - Classe
- [ ] Listar todas as classes SRD
- [ ] Selecionar classe
- [ ] Exibir dado de vida
- [ ] Exibir proficiências
- [ ] Exibir características de classe
- [ ] Selecionar subclasse (se disponível no nível 1)

### 2.3 Passo 3 - Atributos
- [ ] Exibir 6 atributos base (FOR, DES, CON, INT, SAB, CAR)
- [ ] Sistema de point buy funcionando
- [ ] Limite de pontos respeitado
- [ ] Cálculo de modificador correto
- [ ] Aplicação de bônus raciais visível

### 2.4 Passo 4 - Perícias
- [ ] Listar perícias disponíveis da classe
- [ ] Limite de seleção respeitado (ex: 2, 4 perícias)
- [ ] Tooltip de descrição funcionando (ícone info)
- [ ] Atributo relacionado exibido
- [ ] Botão próximo ativo só com quantidade correta

### 2.5 Passo 5 - Idiomas
- [ ] Exibir idiomas raciais automáticos
- [ ] Permitir escolher idiomas extras (se disponível)
- [ ] Lista de idiomas disponíveis

### 2.6 Passo 6 - Equipamento
- [ ] Selecionar pacote de equipamento
- [ ] Escolher arma primária
- [ ] Escolher arma secundária
- [ ] Escolher armadura

### 2.7 Passo 7 - Magias (se conjurador)
- [ ] Listar truques disponíveis
- [ ] Limite de truques respeitado
- [ ] Listar magias de 1º nível
- [ ] Limite de magias respeitado
- [ ] Filtro por escola de magia
- [ ] Busca por nome

### 2.8 Passo 8 - Antecedente (Background)
- [ ] Inserir nome do personagem
- [ ] Selecionar antecedente
- [ ] Selecionar alinhamento
- [ ] Campo de traços de personalidade
- [ ] Campo de ideais
- [ ] Campo de vínculos
- [ ] Campo de defeitos

### 2.9 Passo 9 - Backstory
- [ ] Campo de idade
- [ ] Campo de altura
- [ ] Campo de peso
- [ ] Campo de cor dos olhos
- [ ] Campo de cabelo
- [ ] Campo de pele
- [ ] Campo de características distintivas
- [ ] Campo de história (textarea)
- [ ] Campo de objetivos
- [ ] Campo de aliados/organizações

### 2.10 Passo 10 - Revisão
- [ ] Exibir resumo do personagem
- [ ] Nome, raça, classe, nível
- [ ] Atributos finais com bônus
- [ ] Perícias selecionadas
- [ ] Equipamento
- [ ] Magias (se houver)
- [ ] Botão "Criar" funciona
- [ ] Personagem salvo no banco

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 📜 3. FICHA DE PERSONAGEM

### 3.1 Visualização Geral
- [ ] Nome do personagem
- [ ] Raça e sub-raça
- [ ] Classe e nível
- [ ] Avatar/imagem
- [ ] Background

### 3.2 Atributos
- [ ] Exibir 6 atributos
- [ ] Modificadores calculados corretamente
- [ ] Valores finais (com bônus raciais)

### 3.3 Pontos de Vida (HP)
- [ ] Exibir HP atual / HP máximo
- [ ] Barra de progresso visual
- [ ] HP Temporário exibido
- [ ] Adicionar HP (cura)
- [ ] Remover HP (dano)
- [ ] Input numérico funciona
- [ ] Toast de confirmação

### 3.4 Dados de Vida
- [ ] Exibir dados disponíveis
- [ ] Exibir tipo de dado (d8, d10, etc)
- [ ] Dados atuais / total

### 3.5 Descanso Curto
- [ ] Abrir modal de descanso curto
- [ ] Selecionar quantidade de dados de vida
- [ ] Calcular cura (dado + mod CON)
- [ ] Atualizar HP
- [ ] Reduzir dados de vida disponíveis

### 3.6 Descanso Longo
- [ ] Abrir modal de descanso longo
- [ ] Recuperar HP total
- [ ] Recuperar metade dos dados de vida
- [ ] Limpar HP temporário
- [ ] Toast de confirmação

### 3.7 Combate
- [ ] Exibir CA (Classe de Armadura)
- [ ] Exibir Iniciativa
- [ ] Exibir Deslocamento

### 3.8 Perícias
- [ ] Listar todas as 18 perícias
- [ ] Indicador de proficiência
- [ ] Indicador de expertise
- [ ] Bônus calculado corretamente
- [ ] Busca/filtro de perícias
- [ ] Atributo relacionado exibido

### 3.9 Salvaguardas
- [ ] Exibir 6 salvaguardas
- [ ] Indicador de proficiência
- [ ] Bônus calculado corretamente

### 3.10 Percepção Passiva
- [ ] Exibir Percepção Passiva
- [ ] Exibir Investigação Passiva
- [ ] Exibir Intuição Passiva
- [ ] Cálculo correto (10 + mod + prof)

### 3.11 Equipamento
- [ ] Listar equipamentos
- [ ] Armas equipadas
- [ ] Armadura equipada
- [ ] Inventário geral

### 3.12 Magias (se conjurador)
- [ ] Botão "Gerenciar Magias"
- [ ] Lista de truques conhecidos
- [ ] Lista de magias conhecidas
- [ ] Slots de magia por nível
- [ ] Marcar/desmarcar slot usado

### 3.13 Proficiências
- [ ] Lista de proficiências em armaduras
- [ ] Lista de proficiências em armas
- [ ] Lista de proficiências em ferramentas
- [ ] Lista de idiomas

### 3.14 Notas
- [ ] Abrir sheet de notas
- [ ] Criar nota
- [ ] Editar nota
- [ ] Excluir nota

### 3.15 Histórico de Alterações (PRO)
- [ ] Verificar se usuário tem acesso (Herói/Mestre)
- [ ] Listar alterações do personagem
- [ ] Data/hora da alteração
- [ ] Campo alterado
- [ ] Valor antigo → valor novo
- [ ] Tipo de alteração

### 3.16 Editar Stats
- [ ] Abrir sheet de edição
- [ ] Editar HP máximo
- [ ] Editar CA
- [ ] Editar iniciativa
- [ ] Editar velocidade
- [ ] Editar atributos
- [ ] Salvar alterações
- [ ] Histórico registrado (se PRO)

### 3.17 Subir de Nível
- [ ] Abrir sheet de level up
- [ ] Incrementar nível
- [ ] Recalcular HP máximo
- [ ] Recalcular bônus de proficiência
- [ ] Novas características de classe

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 👥 4. PERSONAGENS

### 4.1 Lista
- [ ] Exibir todos os personagens do usuário
- [ ] Card com nome, raça, classe, nível
- [ ] Imagem/avatar
- [ ] HP atual
- [ ] Ordenação
- [ ] Estado vazio (sem personagens)

### 4.2 Criar
- [ ] Botão "Novo Personagem"
- [ ] Verificar limite do plano (3 aldeão, 20 herói, ∞ mestre)
- [ ] Mensagem de limite atingido
- [ ] Abrir wizard

### 4.3 Visualizar
- [ ] Clicar no card abre a ficha
- [ ] Navegação back funciona

### 4.4 Arquivar
- [ ] Opção de arquivar personagem
- [ ] Personagem não conta no limite quando arquivado

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 🏰 5. CAMPANHAS

### 5.1 Lista
- [ ] Exibir campanhas do usuário
- [ ] Campanhas como Mestre
- [ ] Campanhas como Jogador
- [ ] Card com nome, descrição
- [ ] Número de jogadores
- [ ] Estado vazio

### 5.2 Criar Campanha (só Mestre tier)
- [ ] Verificar se usuário é Mestre
- [ ] Mensagem de restrição para outros tiers
- [ ] Nome da campanha
- [ ] Descrição
- [ ] Gerar código de convite automático

### 5.3 Entrar em Campanha
- [ ] Input de código de convite
- [ ] Validar código
- [ ] Erro para código inválido
- [ ] Erro se já é membro
- [ ] Sucesso ao entrar
- [ ] Selecionar personagem (opcional)

### 5.4 Detalhes da Campanha
- [ ] Nome e descrição
- [ ] Indicador se é Mestre ou Jogador
- [ ] Número de jogadores
- [ ] Número de sessões
- [ ] Código de convite (só Mestre)
- [ ] Copiar código

### 5.5 Sessões
- [ ] Tab de sessões
- [ ] Próximas sessões
- [ ] Sessões passadas
- [ ] Data e hora formatadas
- [ ] Local (se houver)

### 5.6 Agendar Sessão (Mestre)
- [ ] Abrir sheet de criar sessão
- [ ] Título da sessão
- [ ] Data e hora
- [ ] Local (opcional)
- [ ] Notas (opcional)
- [ ] Salvar sessão

### 5.7 Jogadores
- [ ] Tab de jogadores
- [ ] Lista de jogadores
- [ ] Indicador Mestre/Jogador
- [ ] Nome do jogador
- [ ] Personagem vinculado (se houver)

### 5.8 Adicionar Jogador (Mestre)
- [ ] Abrir sheet de adicionar
- [ ] Mostrar código de convite
- [ ] Copiar código

### 5.9 Notas da Campanha
- [ ] Botão de notas
- [ ] Criar nota
- [ ] Nota pública vs privada
- [ ] Editar nota
- [ ] Excluir nota
- [ ] Visualizar notas de outros (se públicas)

### 5.10 Chat da Campanha
- [ ] Botão de chat
- [ ] Enviar mensagem
- [ ] Ver mensagens de outros
- [ ] Nome do autor
- [ ] Timestamp
- [ ] Scroll automático
- [ ] Realtime (mensagens aparecem sem refresh)

### 5.11 Compêndio Homebrew
- [ ] Botão de compêndio
- [ ] Ver itens homebrew compartilhados
- [ ] Filtrar por tipo

### 5.12 Combat Tracker (Mestre)
- [ ] Botão de combate
- [ ] Criar encontro
- [ ] Nome do encontro

### 5.13 Configurações (Mestre)
- [ ] Tab de config
- [ ] Ver nome da campanha
- [ ] Ver descrição
- [ ] Data de criação
- [ ] Discord Webhook (se Mestre tier)

### 5.14 Discord Webhook (Mestre tier)
- [ ] Input de webhook URL
- [ ] Salvar webhook
- [ ] Testar webhook (botão)
- [ ] Notificações enviadas para Discord

### 5.15 Excluir Campanha (Mestre)
- [ ] Botão de excluir
- [ ] Confirmação
- [ ] Campanha removida

**Notas de teste:**
```
[Espaço para anotações]
```

---

## ⚔️ 6. COMBAT TRACKER

### 6.1 Encontros
- [ ] Criar novo encontro
- [ ] Nome do encontro
- [ ] Listar encontros ativos
- [ ] Selecionar encontro

### 6.2 Combatentes
- [ ] Adicionar jogador (do grupo)
- [ ] Adicionar monstro/NPC
- [ ] Nome do combatente
- [ ] HP máximo
- [ ] CA
- [ ] Iniciativa

### 6.3 Ordem de Iniciativa
- [ ] Ordenar por iniciativa (maior primeiro)
- [ ] Indicador de turno atual
- [ ] Botão próximo turno
- [ ] Contador de rodada

### 6.4 Gerenciar HP
- [ ] Clicar em combatente
- [ ] Adicionar dano
- [ ] Adicionar cura
- [ ] HP atualizado em tempo real

### 6.5 Condições
- [ ] Adicionar condição
- [ ] Lista de condições D&D
- [ ] Indicador visual de condições
- [ ] Remover condição

### 6.6 Log de Combate
- [ ] Registrar ações
- [ ] Dano causado
- [ ] Cura recebida
- [ ] Condições aplicadas
- [ ] Timestamp

### 6.7 Finalizar Combate
- [ ] Encerrar encontro
- [ ] Encontro marcado como inativo

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 🔨 7. A FORJA (HOMEBREW)

### 7.1 Acesso
- [ ] Verificar tier (Herói ou Mestre)
- [ ] Mensagem de restrição para Aldeão
- [ ] Botão de upgrade

### 7.2 Tipos de Conteúdo
- [ ] Magias
- [ ] Itens
- [ ] Raças
- [ ] Classes
- [ ] Subclasses
- [ ] Monstros
- [ ] Antecedentes
- [ ] Talentos

### 7.3 Criar Magia
- [ ] Nome da magia
- [ ] Nível (0-9)
- [ ] Escola de magia
- [ ] Tempo de conjuração
- [ ] Alcance
- [ ] Componentes (V, S, M)
- [ ] Material (se houver)
- [ ] Duração
- [ ] Concentração
- [ ] Ritual
- [ ] Descrição
- [ ] Classes que podem usar
- [ ] Salvar magia

### 7.4 Criar Item
- [ ] Nome do item
- [ ] Tipo de item
- [ ] Raridade
- [ ] Requer sintonização
- [ ] Descrição
- [ ] Propriedades
- [ ] Salvar item

### 7.5 Criar Raça
- [ ] Nome da raça
- [ ] Descrição
- [ ] Bônus de atributos
- [ ] Velocidade
- [ ] Tamanho
- [ ] Idiomas
- [ ] Traços raciais
- [ ] Sub-raças

### 7.6 Criar Classe
- [ ] Nome da classe
- [ ] Descrição
- [ ] Dado de vida
- [ ] Proficiências
- [ ] Equipamento inicial
- [ ] Características por nível

### 7.7 Criar Subclasse
- [ ] Selecionar classe base
- [ ] Nome da subclasse
- [ ] Características por nível

### 7.8 Criar Monstro
- [ ] Nome
- [ ] Tipo de criatura
- [ ] Tamanho
- [ ] Alinhamento
- [ ] CA e HP
- [ ] Atributos
- [ ] Velocidades
- [ ] Resistências/Imunidades
- [ ] Habilidades
- [ ] Ações
- [ ] Nível de desafio

### 7.9 Criar Antecedente
- [ ] Nome
- [ ] Descrição
- [ ] Proficiências em perícias
- [ ] Proficiências em ferramentas/idiomas
- [ ] Equipamento inicial
- [ ] Característica

### 7.10 Criar Talento
- [ ] Nome
- [ ] Pré-requisitos
- [ ] Descrição
- [ ] Benefícios

### 7.11 Gerenciar Homebrew
- [ ] Listar itens criados
- [ ] Buscar por nome
- [ ] Filtrar por tipo
- [ ] Filtrar por nível (magias)
- [ ] Filtrar por escola (magias)
- [ ] Filtrar por raridade (itens)

### 7.12 Editar
- [ ] Botão de editar
- [ ] Carregar dados existentes
- [ ] Salvar alterações

### 7.13 Duplicar
- [ ] Botão de duplicar
- [ ] Cria cópia com "(Cópia)" no nome
- [ ] Abre editor com dados

### 7.14 Excluir
- [ ] Botão de excluir
- [ ] Confirmação
- [ ] Item removido

### 7.15 Compartilhar
- [ ] Botão de compartilhar
- [ ] Selecionar campanha
- [ ] Confirmar compartilhamento

### 7.16 Exportar
- [ ] Exportar item único (JSON)
- [ ] Exportar todos os itens do tipo

### 7.17 Importar
- [ ] Importar arquivo JSON
- [ ] Validar formato
- [ ] Criar item(s) importado(s)

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 🧰 8. FERRAMENTAS

### 8.1 Rolador de Dados
- [ ] Dados disponíveis: d4, d6, d8, d10, d12, d20
- [ ] Clicar no dado rola
- [ ] Resultado exibido
- [ ] Animação de rolagem
- [ ] Histórico de rolagens
- [ ] Múltiplos dados (ex: 2d6)
- [ ] Modificador (ex: +5)
- [ ] Vantagem/Desvantagem

### 8.2 Grimório de Magias
- [ ] Listar todas as magias SRD
- [ ] Buscar por nome
- [ ] Filtrar por nível
- [ ] Filtrar por escola
- [ ] Filtrar por classe
- [ ] Ver detalhes da magia
- [ ] Componentes
- [ ] Descrição completa

### 8.3 Itens Mágicos
- [ ] Listar itens mágicos SRD
- [ ] Buscar por nome
- [ ] Filtrar por raridade
- [ ] Ver detalhes do item

### 8.4 Condições
- [ ] Listar condições D&D
- [ ] Descrição de cada condição
- [ ] Efeitos mecânicos

### 8.5 Armas & Armaduras
- [ ] Lista de armas
- [ ] Propriedades das armas
- [ ] Dano e tipo
- [ ] Lista de armaduras
- [ ] CA base
- [ ] Modificador de DES
- [ ] Força mínima

### 8.6 Regras Básicas
- [ ] Regras fundamentais
- [ ] Testes de habilidade
- [ ] Vantagem/desvantagem
- [ ] Bônus de proficiência
- [ ] Cobertura

### 8.7 Cura & Descanso
- [ ] Regras de descanso curto
- [ ] Regras de descanso longo
- [ ] Recuperação de HP
- [ ] Recuperação de recursos

### 8.8 Notas Rápidas
- [ ] Criar nova nota
- [ ] Título e conteúdo
- [ ] Suporte a Markdown
- [ ] Cor da nota
- [ ] Tags
- [ ] Fixar nota
- [ ] Editar nota
- [ ] Excluir nota
- [ ] Buscar notas
- [ ] Filtrar por tag

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 💳 9. ASSINATURA

### 9.1 Exibição do Plano Atual
- [ ] Mostrar tier atual (Aldeão/Herói/Mestre)
- [ ] Mostrar contador de personagens (Aldeão)
- [ ] Badge de plano premium

### 9.2 Planos Disponíveis
- [ ] Aldeão (Gratuito)
- [ ] Herói (Player)
- [ ] Mestre (Master)
- [ ] Preços corretos exibidos

### 9.3 Períodos de Cobrança
- [ ] Mensal
- [ ] Trimestral (com desconto)
- [ ] Anual (melhor valor)
- [ ] Cálculo de economia

### 9.4 Checkout (Stripe)
- [ ] Botão "Assinar Herói"
- [ ] Botão "Assinar Mestre"
- [ ] Redirecionar para Stripe Checkout
- [ ] Retorno com sucesso
- [ ] Atualização do plano

### 9.5 Upgrade/Downgrade
- [ ] Preview do upgrade (Herói → Mestre)
- [ ] Cálculo de proration
- [ ] Confirmar upgrade
- [ ] Preview do downgrade (Mestre → Herói)
- [ ] Confirmar downgrade

### 9.6 Portal do Cliente
- [ ] Botão "Gerenciar Assinatura"
- [ ] Abrir portal Stripe
- [ ] Ver faturas
- [ ] Atualizar pagamento
- [ ] Cancelar assinatura

### 9.7 Código Promocional
- [ ] Input de código
- [ ] Validar código
- [ ] Erro para código inválido
- [ ] Erro para código expirado
- [ ] Erro para código já usado
- [ ] Sucesso ao resgatar
- [ ] Plano atualizado
- [ ] Data de expiração definida

### 9.8 Verificação Automática
- [ ] Sync com Stripe ao fazer login
- [ ] Atualização após checkout

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 🔔 10. NOTIFICAÇÕES

### 10.1 Sino de Notificações
- [ ] Ícone no header
- [ ] Badge com contagem de não lidas
- [ ] Abrir sheet ao clicar

### 10.2 Lista de Notificações
- [ ] Listar notificações recentes
- [ ] Indicador de lida/não lida
- [ ] Tipo de notificação
- [ ] Data/hora
- [ ] Mensagem

### 10.3 Tipos de Notificação
- [ ] Convite de campanha
- [ ] Lembrete de sessão
- [ ] Atualização de campanha
- [ ] Mensagem do chat

### 10.4 Ações
- [ ] Marcar como lida
- [ ] Marcar todas como lidas
- [ ] Excluir notificação

### 10.5 Configurações de Notificação
- [ ] Toggle para cada tipo
- [ ] Convites de campanha
- [ ] Lembretes de sessão
- [ ] Atualizações de campanha
- [ ] Mensagens de chat

**Notas de teste:**
```
[Espaço para anotações]
```

---

## ⚙️ 11. MENU / CONFIGURAÇÕES

### 11.1 Meu Perfil
- [ ] Exibir nome
- [ ] Exibir email
- [ ] Avatar/inicial
- [ ] Editar nome de exibição
- [ ] Salvar alterações

### 11.2 Assinatura
- [ ] Ver plano atual
- [ ] Acessar sheet de assinatura

### 11.3 Notificações
- [ ] Acessar configurações de notificação

### 11.4 Aparência
- [ ] Tema claro
- [ ] Tema escuro
- [ ] Tema do sistema
- [ ] Mudança aplicada imediatamente

### 11.5 Novidades (Changelog)
- [ ] Lista de atualizações
- [ ] Versão
- [ ] Data
- [ ] Descrição das mudanças

### 11.6 Ajuda & FAQ
- [ ] Lista de perguntas frequentes
- [ ] Respostas expandíveis

### 11.7 Privacidade
- [ ] Política de privacidade
- [ ] Termos de uso

### 11.8 Logout
- [ ] Botão de logout
- [ ] Confirmar saída
- [ ] Sessão encerrada

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 🏠 12. HOME

### 12.1 Hero Card
- [ ] Saudação personalizada (nome do usuário)
- [ ] Estatísticas rápidas

### 12.2 Quick Actions
- [ ] Novo Personagem
- [ ] Nova Campanha
- [ ] Abrir Notas
- [ ] Rolar Dados

### 12.3 Personagens Recentes
- [ ] Listar últimos personagens
- [ ] Card com info básica
- [ ] Clicar abre ficha

### 12.4 Campanhas Recentes
- [ ] Listar últimas campanhas
- [ ] Card com info básica
- [ ] Clicar abre detalhes

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 📱 13. NAVEGAÇÃO

### 13.1 Tab Bar
- [ ] Home
- [ ] Personagens
- [ ] Campanhas
- [ ] Ferramentas
- [ ] Menu
- [ ] Indicador de aba ativa
- [ ] Navegação funciona

### 13.2 Header
- [ ] Título da tela
- [ ] Subtítulo (quando houver)
- [ ] Notificações (sino)
- [ ] Botão voltar (quando aplicável)

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 🔒 14. CONTROLE DE ACESSO POR TIER

### 14.1 Aldeão (Gratuito)
- [ ] Limite de 3 personagens ✓
- [ ] Não pode criar campanhas ✓
- [ ] Não pode usar A Forja ✓
- [ ] Não tem histórico de alterações ✓
- [ ] Pode entrar em campanhas ✓
- [ ] Pode usar ferramentas ✓

### 14.2 Herói
- [ ] Limite de 20 personagens ✓
- [ ] Não pode criar campanhas ✓
- [ ] Pode usar A Forja ✓
- [ ] Tem histórico de alterações ✓
- [ ] Temas exclusivos ✓
- [ ] Suporte prioritário ✓

### 14.3 Mestre
- [ ] Personagens ilimitados ✓
- [ ] Pode criar campanhas ✓
- [ ] Pode usar A Forja ✓
- [ ] Tem Combat Tracker ✓
- [ ] Discord Integration ✓
- [ ] Todas as features ✓

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 🌐 15. INTEGRAÇÕES

### 15.1 Discord Webhook
- [ ] Configurar URL do webhook
- [ ] Salvar configuração
- [ ] Enviar notificação de teste
- [ ] Notificações automáticas (sessões, etc)

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 📊 16. DADOS (BANCO)

### 16.1 Persistência
- [ ] Personagens salvos corretamente
- [ ] Campanhas salvas corretamente
- [ ] Notas salvas corretamente
- [ ] Homebrew salvo corretamente
- [ ] Preferências salvas

### 16.2 Realtime
- [ ] Chat de campanha em tempo real
- [ ] Combat tracker sincronizado

### 16.3 RLS (Row Level Security)
- [ ] Usuário só vê seus personagens
- [ ] Usuário só vê campanhas que participa
- [ ] Mestre vê todos jogadores da campanha
- [ ] Notas privadas são privadas

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 🐛 17. EDGE CASES

### 17.1 Estados Vazios
- [ ] Sem personagens
- [ ] Sem campanhas
- [ ] Sem notas
- [ ] Sem homebrew
- [ ] Sem notificações

### 17.2 Erros
- [ ] Erro de rede tratado
- [ ] Toast de erro exibido
- [ ] Retry quando apropriado

### 17.3 Loading States
- [ ] Skeleton/spinner durante carregamento
- [ ] Botões desabilitados durante ação

### 17.4 Validação
- [ ] Campos obrigatórios
- [ ] Formatos corretos
- [ ] Limites respeitados

**Notas de teste:**
```
[Espaço para anotações]
```

---

## 📝 BUGS ENCONTRADOS

| # | Seção | Descrição | Severidade | Status |
|---|-------|-----------|------------|--------|
| 1 | | | 🔴 Alta / 🟡 Média / 🟢 Baixa | Aberto/Fechado |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

---

## ✅ ASSINATURA DE APROVAÇÃO

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| Testador QA | | | |
| Desenvolvedor | | | |
| Product Owner | | | |

---

**Versão do documento:** 1.0  
**Go20 v1.0.0** - Dezembro 2024
