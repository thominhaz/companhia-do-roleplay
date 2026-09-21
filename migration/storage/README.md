# Migração de arquivos

## Áreas atuais

| Área | Pública | Tratamento |
|---|---:|---|
| `avatars` | sim | não migrar por padrão; imagens pessoais |
| `campaign-images` | sim | migrar após revisão; remapear URLs |
| `document-seals` | sim | migrar após revisar assinaturas/PII |
| `supporter-submissions` | sim | não migrar por padrão; submissões podem conter PII |

## Processo

1. Listar objetos por área com chave, tamanho, tipo, data e checksum.
2. Baixar por API autenticada para diretório criptografado temporário.
3. Rejeitar path traversal, symlinks e tipos inesperados.
4. Excluir avatares e submissões pessoais por padrão.
5. Enviar objetos aprovados a storage S3 compatível privado.
6. Atualizar referências do banco para chaves, não URLs absolutas.
7. Gerar URLs assinadas no servidor quando o objeto não for público.
8. Comparar quantidade, bytes e SHA-256.

Não copie tabelas internas de storage como substituto dos arquivos; elas contêm apenas metadados.
