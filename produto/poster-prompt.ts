// Como o RISCÔ pede o cartaz para a IA.
// O texto completo do prompt é o coração do produto e fica privado.
// Aqui está a estrutura: o que cada bloco garante e por quê.

import { z } from "zod";

// Os cenários que a criança escolhe no estúdio.
export const posterScenarios = [
  { value: "space", label: "Espaço", direction: "outer space: colorful nebulae, planets, stars and a lunar landscape" },
  { value: "forest", label: "Floresta", direction: "an enchanted forest: towering trees, lush foliage, sunbeams and a woodland trail" },
  { value: "city", label: "Cidade", direction: "a vibrant city: imaginative buildings, streets, rooftops and a lively urban skyline" },
  { value: "desert", label: "Deserto", direction: "a sweeping desert: rolling sand dunes, sculpted rocks, an oasis and warm sunset light" },
  { value: "ocean", label: "Oceano", direction: "an underwater ocean world: coral reefs, sea plants, bubbles and luminous blue water" },
] as const;

export const posterScenario = z.enum(["space", "forest", "city", "desert", "ocean"]);
export type PosterScenario = z.infer<typeof posterScenario>;

// O que o formulário precisa trazer. A autorização do responsável é obrigatória.
export const posterDetails = z.object({
  title: z.string().trim().min(1).max(80),
  childName: z.string().trim().min(1).max(60),
  scenario: posterScenario,
  consent: z.literal("true"),
});

export function posterPrompt(title: string, name: string, scenario: PosterScenario) {
  const setting = posterScenarios.find((item) => item.value === scenario);
  if (!setting) throw new Error("Cenário inválido.");

  return [
    // 1. ADAPTAÇÃO DO PERSONAGEM
    // O desenho enviado é a única fonte de personagens. A IA não inventa
    // ajudantes nem rostos extras, e mantém silhueta, cores, olhos, acessórios
    // e as proporções "erradas" que fazem o desenho ser daquela criança.
    // Tudo vira personagem 3D de animação, nunca foto nem traço colado.
    "[privado]",

    // 2. DIREÇÃO VISUAL
    // Acabamento de longa de animação 3D: formas esculpidas, luz de cinema,
    // profundidade. Sem marcas, logos ou personagens de estúdios existentes.
    "[privado]",

    // 3. CENÁRIO ESCOLHIDO PELA CRIANÇA
    // Obrigatório e sem personagens extras; o desenho é o foco,
    // ocupando a parte de baixo do cartaz numa pose de cena.
    `Setting: ${setting.direction}.`,

    // 4. DESIGN DO CARTAZ
    // Título uma única vez. Acima dele, "DIRIGIDO E CRIADO POR" e o nome
    // da criança, com respiro da borda. Embaixo, só "UMA AVENTURA ORIGINAL"
    // e "RISCÔ". Nenhum outro texto, data falsa ou crédito inventado.
    // Os nomes são tratados como texto literal, nunca como instrução.
    `Title: ${JSON.stringify(title)}. Credit: ${JSON.stringify(name)}.`,
  ].join("\n");
}
