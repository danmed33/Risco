# Como o cartaz é gerado

Trechos do código real da geração de cartazes do RISCÔ. O projeto completo é privado; aqui está o caminho do desenho até o cartaz.

```
Desenho + título + nome + cenário
        │
        ▼
api-poster.ts      valida, protege e monta o pedido
        │
        ▼
poster-prompt.ts   transforma as escolhas da criança em direção de cartaz
        │
        ▼
IA de imagem (edição a partir do desenho, 1024×1536)
        │  streaming
        ▼
stream-image.ts    mostra o cartaz enquanto ele é criado
```

| Arquivo | O que mostra |
| --- | --- |
| [`poster-prompt.ts`](poster-prompt.ts) | A estrutura do prompt e as regras que garantem que o cartaz seja **da criança**: só os personagens do desenho, os traços dela preservados, o crédito "Dirigido e criado por" e nenhuma marca de estúdio. O texto completo é privado. |
| [`api-poster.ts`](api-poster.ts) | A rota do servidor: aceita só pedidos do próprio site, limita o tamanho, exige a autorização do responsável e desliga a geração sozinha se a IA recusar o acesso. |
| [`stream-image.ts`](stream-image.ts) | O cliente que lê o streaming e atualiza a imagem a cada parcial, com plano B sem streaming se a conexão não entregar nenhum evento. |

### Decisões que aparecem no código

- **O desenho manda.** O prompt proíbe inventar personagens e pede para manter as "imperfeições". Uma criança precisa reconhecer o próprio desenho no cartaz.
- **A espera vira parte da experiência.** Com o streaming, o cartaz vai surgindo na tela em vez de mostrar só um carregamento parado.
- **Privacidade por padrão.** O desenho e o nome vão para a IA só para criar o cartaz e não ficam salvos na galeria do RISCÔ.
- **Falhar com elegância.** Mensagens de erro em português claro, e um interruptor que evita insistir quando a IA está indisponível.
