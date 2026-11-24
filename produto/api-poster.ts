// Rota do servidor que recebe o desenho e devolve o cartaz em streaming.
// Versão de vitrine: a montagem do prompt está em poster-prompt.ts
// e a conexão com a IA (editImage) é a padrão da plataforma.

import { createFileRoute } from "@tanstack/react-router";
import { posterDetails, posterPrompt } from "./poster-prompt";

const MAX_BYTES = 10 * 1024 * 1024;
const fail = (message: string, status: number) => Response.json({ message }, { status });

export const Route = createFileRoute("/api/poster")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Só aceita pedidos vindos do próprio site.
        const origin = request.headers.get("origin");
        if (!origin || origin !== new URL(request.url).origin) return fail("Solicitação não autorizada.", 403);

        // Corta envios grandes antes mesmo de ler o corpo.
        if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES + 1024 * 1024)
          return fail("O desenho deve ter até 10 MB.", 413);

        // A chave fica só no servidor, nunca no código nem no navegador.
        const apiKey = process.env["IMAGE_API_KEY"];
        if (!apiKey) return fail("A geração ainda não está configurada.", 503);

        let form: FormData;
        try { form = await request.formData(); } catch { return fail("Não foi possível ler o desenho.", 400); }

        // Valida nomes, cenário e a autorização do responsável.
        const parsed = posterDetails.safeParse({
          title: form.get("title"),
          childName: form.get("childName"),
          scenario: form.get("scenario"),
          consent: form.get("consent"),
        });
        const image = form.get("image");
        const validImage =
          image instanceof File &&
          ["image/png", "image/jpeg", "image/webp"].includes(image.type) &&
          image.size > 0 && image.size <= MAX_BYTES;
        if (!parsed.success || !validImage)
          return fail("Envie um PNG, JPG ou WebP de até 10 MB, preencha os nomes e confirme a autorização.", 400);

        // Interruptor: se a IA já recusou o acesso antes, responde na hora
        // em vez de gastar uma chamada que vai falhar de novo.
        const blocked = await getAccessBlock();
        if (blocked) return fail(blocked.message, blocked.status);

        // Monta o pedido de edição: o desenho + o prompt, em formato de cartaz 2:3.
        const edit = new FormData();
        edit.append("image[]", image);
        edit.set("prompt", posterPrompt(parsed.data.title, parsed.data.childName, parsed.data.scenario));
        edit.set("size", "1024x1536");
        edit.set("quality", "high");
        edit.set("stream", form.get("stream") === "false" ? "false" : "true");

        const upstream = await editImage(apiKey, edit);

        if (!upstream.ok) {
          const message = await readableError(upstream);
          // Acesso negado liga o interruptor para os próximos pedidos.
          if (upstream.status === 403) await setAccessBlock(403, message);
          return fail(message, upstream.status);
        }

        // Repassa o streaming direto: o cartaz aparece enquanto é criado.
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
            "Cache-Control": "no-store, no-transform",
          },
        });
      },
    },
  },
});

// Implementados no projeto privado.
declare function getAccessBlock(): Promise<{ status: number; message: string } | null>;
declare function setAccessBlock(status: number, message: string): Promise<void>;
declare function editImage(apiKey: string, form: FormData): Promise<Response>;
declare function readableError(response: Response): Promise<string>;
