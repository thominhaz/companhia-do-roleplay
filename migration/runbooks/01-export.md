# 01 — Exportar a origem

1. Congele alterações ou registre o horário de corte.
2. Em **Cloud → Advanced settings → Export data**, solicite o export oficial.
3. Baixe para volume local criptografado; não envie ao Git ou chat.
4. Registre SHA-256, tamanho, data e versão do código.
5. Restaure em instância temporária sem acesso público.
6. Exporte separadamente apenas os dados do schema público; não transporte `auth`, sessões, identidades ou storage interno.
7. Liste os arquivos por API administrativa em manifesto separado.

Acesso ao dump bruto deve ser limitado ao operador da migração.
