# Checklist de rotação

- [ ] Criar credenciais novas no ambiente de destino.
- [ ] Cadastrar apenas no gerenciador de segredos do destino.
- [ ] Atualizar callback OAuth do Discord.
- [ ] Atualizar endpoints/webhooks de Stripe e Discord.
- [ ] Rotacionar chaves Foundry de cada campanha; armazenar hash quando possível.
- [ ] Validar e-mail remetente e domínio.
- [ ] Testar IA com limite de custo e timeout.
- [ ] Revogar credenciais antigas após o corte e janela de rollback.
- [ ] Confirmar que logs e histórico Git não contêm valores.
