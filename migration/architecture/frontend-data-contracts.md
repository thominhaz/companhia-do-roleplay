# Contratos esperados pelo frontend

A implementação atual usa nomes de coluna em `snake_case` e espera objetos JSON sem conversão global. A nova API deve manter esse formato durante a transição.

## Convenções

- UUIDs como strings.
- Datas como ISO 8601 com fuso.
- Ausência de valor como `null`, não string vazia, quando a coluna aceita nulo.
- Listas PostgreSQL como arrays JSON.
- `jsonb` entregue como objeto/array JSON, sem dupla serialização.
- Erros de autorização retornam 401/403; validação 400/422; conflito 409.

## Contratos sensíveis

- `characters.skills` é objeto por perícia, não array.
- `characters.attributes`, `saving_throws`, `hit_dice`, `death_saves`, `spellcasting`, `builder_data` e `level_choices` preservam a estrutura JSON atual.
- `level_choices[].class_id` suporta multiclasse.
- Mensagens e combatentes precisam de eventos em tempo real após confirmação do banco.
- Uploads devolvem uma chave estável e URL de leitura; a URL não deve ser usada como identidade do objeto.

## Referências de tipos

Use `src/integrations/supabase/types.ts`, `src/types/index.ts`, `src/hooks/useCharacters.tsx` e os hooks `use*.tsx` como contratos executáveis. Ao criar DTOs, compare todos os campos, inclusive opcionais.
