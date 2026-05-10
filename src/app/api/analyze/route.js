import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { jogo, mercado, criterios } = await request.json();

    if (!jogo || !mercado) {
      return Response.json({ error: "Jogo e mercado são obrigatórios" }, { status: 400 });
    }

    const prompt =
      `Você é um analista profissional de apostas esportivas com foco em alta assertividade acima de 85%.\n\n` +
      `JOGO: ${jogo}\n` +
      `MERCADO: ${mercado}\n` +
      `CRITERIOS: ${criterios}\n\n` +
      `Analise este jogo com base no seu conhecimento sobre forma recente, H2H, contexto e estatísticas.\n\n` +
      `Retorne SOMENTE um JSON válido com estes campos:\n` +
      `evento, competicao, data, mercado, score (0-100), status (APROVADO/AGUARDAR/REPROVADO),\n` +
      `odds_estimada, probabilidade_real (0-100), value_bet (true/false), resumo,\n` +
      `forma_time1, forma_time2, h2h, desfalques, contexto,\n` +
      `criterios_atendidos (array de strings), criterios_nao_atendidos (array de strings),\n` +
      `alertas (array de strings), confianca_fonte (0-100)\n\n` +
      `RETORNE APENAS O JSON. SEM TEXTO ANTES OU DEPOIS.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].text;
    const cleaned = raw.replace(/```json/gi, "").replace(/```/gi, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) {
      return Response.json({ error: "IA não retornou JSON válido" }, { status: 500 });
    }

    const data = JSON.parse(match[0]);
    return Response.json(data);

  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message || "Erro interno" }, { status: 500 });
  }
}
