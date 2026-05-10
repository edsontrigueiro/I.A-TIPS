"use client";
import { useState } from "react";
import * as XLSX from "xlsx";

const MARKETS = [
  { id: "lay_2x2", label: "Lay 2x2", icon: "🚫", color: "#f97316", minScore: 82,
    description: "Apostar contra placar 2x2",
    criteria: "Defesas solidas, media H2H abaixo de 2.8 gols, pelo menos um time com ataque fraco, odds lay acima de 1.05. Penalize times que marcaram 2+ gols em 3 jogos seguidos." },
  { id: "lay_zebra", label: "Lay Zebra", icon: "🦓", color: "#a855f7", minScore: 85,
    description: "Apostar contra vitória do azarão",
    criteria: "Favorito com 4+ jogos sem derrota, zebra com 3+ derrotas fora, odds favorito abaixo de 1.7 e zebra acima de 4.0, favorito em casa, H2H com 70%+ de vitorias do favorito." },
  { id: "mais_1_5", label: "+1.5 Gols", icon: "⚽", color: "#22c55e", minScore: 83,
    description: "Mais de 1.5 gols na partida",
    criteria: "Media combinada acima de 2.5 gols/jogo nos ultimos 5, H2H com 70%+ dos jogos com 2+ gols, pelo menos um time entre os top marcadores, odds acima de 1.25." },
  { id: "mais_0_5", label: "+0.5 Gols", icon: "🥅", color: "#06b6d4", minScore: 88,
    description: "Pelo menos 1 gol na partida",
    criteria: "Ambos times marcaram em 80%+ dos ultimos jogos, H2H com 95%+ dos jogos com gol, nenhum dos times entre os 3 piores ataques, sem historico de 0x0 nos ultimos 10 H2H." },
  { id: "tenis", label: "Vencedor Tênis", icon: "🎾", color: "#eab308", minScore: 84,
    description: "Vencedor da partida de tênis",
    criteria: "Favorito 20+ posicoes acima no ranking, H2H com 65%+ de vitorias, superficie favorece o escolhido, odds abaixo de 1.5. Penalize rival especialista na superficie." },
];

const scoreColor = (s) => s >= 85 ? "#22c55e" : s >= 75 ? "#eab308" : "#ef4444";
const getStatus = (score, min) => {
  if (score >= min) return { label: "APROVADO", icon: "✅", color: "#22c55e", bg: "rgba(34,197,94,0.08)" };
  if (score >= min - 8) return { label: "AGUARDAR", icon: "⏳", color: "#eab308", bg: "rgba(234,179,8,0.08)" };
  return { label: "REPROVADO", icon: "❌", color: "#ef4444", bg: "rgba(239,68,68,0.08)" };
};

export default function App() {
  const [mkt, setMkt] = useState(MARKETS[0]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [approved, setApproved] = useState([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("analyze");

  const analyze = async () => {
    if (!input.trim()) { setError("Informe o jogo."); return; }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jogo: input, mercado: mkt.label, criterios: mkt.criteria }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Garantir tipos corretos
      const flatten = (v) => {
        if (v === null || v === undefined) return "-";
        if (typeof v === "boolean") return v ? "SIM" : "NAO";
        if (typeof v === "number") return String(v);
        if (typeof v === "string") return v;
        if (Array.isArray(v)) return v.map(flatten).join(", ");
        if (typeof v === "object") return Object.entries(v).map(([k, val]) => `${k}: ${flatten(val)}`).join(" | ");
        return String(v);
      };

      ["evento","competicao","data","mercado","odds_estimada","resumo",
       "forma_time1","forma_time2","h2h","desfalques","contexto"].forEach(k => {
        if (data[k] !== undefined) data[k] = flatten(data[k]);
      });
      ["criterios_atendidos","criterios_nao_atendidos","alertas"].forEach(k => {
        if (!Array.isArray(data[k])) data[k] = [];
        else data[k] = data[k].map(flatten);
      });
      data.score = Number(data.score) || 0;
      data.probabilidade_real = Number(data.probabilidade_real) || 0;
      data.confianca_fonte = Number(data.confianca_fonte) || 0;
      data.value_bet = !!data.value_bet;
      data._mkt = mkt;
      data._id = Date.now();

      setResult(data);
      if (data.status === "APROVADO") setApproved(p => [data, ...p]);

    } catch (e) {
      setError("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportXLSX = () => {
    const rows = approved.map(s => ({
      Evento: s.evento || "", Competicao: s.competicao || "", Data: s.data || "",
      Mercado: s.mercado || "", Score: s.score, Status: s.status,
      Odds: s.odds_estimada || "", "Prob Real %": s.probabilidade_real,
      ValueBet: s.value_bet ? "SIM" : "NAO",
      "Forma Time1": s.forma_time1 || "", "Forma Time2": s.forma_time2 || "",
      H2H: s.h2h || "", Desfalques: s.desfalques || "", Contexto: s.contexto || "",
      Atendidos: (s.criterios_atendidos || []).join(" | "),
      NaoAtendidos: (s.criterios_nao_atendidos || []).join(" | "),
      Alertas: (s.alertas || []).join(" | "), Resumo: s.resumo || "",
      Confianca: s.confianca_fonte || "",
      Hora: new Date(s._id).toLocaleString("pt-BR"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sinais");
    XLSX.writeFile(wb, `sinais_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const st = result ? getStatus(result.score, mkt.minScore) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#07090f", color: "#e2e8f0", fontFamily: "monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Space+Mono&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Space Mono',monospace}
        textarea{background:#0d1117!important;border:1px solid #1e293b!important;color:#e2e8f0!important;border-radius:8px!important;padding:12px!important;font-family:'Space Mono',monospace!important;font-size:13px!important;outline:none!important;width:100%;resize:vertical;transition:border .2s}
        textarea:focus{border-color:#6366f1!important}
        @keyframes pu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.pu{animation:pu .3s ease}
        @keyframes bk{50%{opacity:.2}}.bk{animation:bk 1.2s infinite}
        @keyframes sp{to{transform:rotate(360deg)}}.sp{animation:sp .8s linear infinite;display:inline-block}
        @keyframes fw{from{width:0}to{width:var(--w)}}.fw{animation:fw 1s ease}
        .pill{cursor:pointer;border-radius:20px;padding:6px 14px;font-size:12px;border:1px solid;transition:all .15s;font-family:'Space Mono',monospace;background:none}
        .pill:hover{transform:translateY(-1px)}
        .ttab{background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;padding:10px 18px;color:#475569;font-family:'Space Mono',monospace;font-size:12px;transition:all .15s}
        .ttab.on{color:#e2e8f0;border-bottom-color:#6366f1}
        .btn{border:none;border-radius:8px;padding:12px 20px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;width:100%}
        .card{background:#0d1117;border:1px solid #1e293b;border-radius:10px;padding:14px}
        @media(max-width:768px){.grid2{grid-template-columns:1fr!important}}
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: -1 }}>
          ⚡ Signal<span style={{ color: "#6366f1" }}>IQ</span>
        </span>
        <span style={{ fontSize: 10, color: "#334155", letterSpacing: 2, textTransform: "uppercase" }}>Alta Assertividade · 85%+</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#6366f1" }}><span className="bk">●</span> IA Online</span>
      </div>

      {/* MERCADOS */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #1e293b", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {MARKETS.map(m => (
          <button key={m.id} className="pill"
            onClick={() => { setMkt(m); setResult(null); setError(""); }}
            style={{ borderColor: mkt.id === m.id ? m.color : "#1e293b", color: mkt.id === m.id ? m.color : "#475569", background: mkt.id === m.id ? m.color + "18" : "none" }}>
            {m.icon} {m.label} {mkt.id === m.id && <span style={{ opacity: .6, fontSize: 10 }}>min {m.minScore}</span>}
          </button>
        ))}
      </div>

      {/* TABS */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "0 24px", display: "flex" }}>
        <button className={`ttab ${tab === "analyze" ? "on" : ""}`} onClick={() => setTab("analyze")}>Analisar</button>
        <button className={`ttab ${tab === "approved" ? "on" : ""}`} onClick={() => setTab("approved")}>
          Aprovados {approved.length > 0 && `(${approved.length})`}
        </button>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: 24 }}>

        {tab === "analyze" && (
          <div className="grid2" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>

            {/* ESQUERDA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: mkt.color + "10", border: `1px solid ${mkt.color}30`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 28 }}>{mkt.icon}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: mkt.color, marginTop: 4 }}>{mkt.label}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{mkt.description}</div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 8 }}>Score mínimo: <b style={{ color: mkt.color }}>{mkt.minScore}/100</b></div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Jogo / Evento *</div>
                <textarea rows={4} value={input} onChange={e => setInput(e.target.value)}
                  placeholder={mkt.id === "tenis" ? "Ex: Alcaraz vs Sinner — Roland Garros, semifinal" : "Ex: Coritiba vs Internacional — Brasileirao Serie A rodada 15"} />
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#fca5a5" }}>
                  {error}
                </div>
              )}

              <button className="btn" onClick={analyze} disabled={loading}
                style={{ background: loading ? "#0d1117" : mkt.color, color: loading ? "#334155" : "#07090f", border: `1px solid ${loading ? "#1e293b" : mkt.color}`, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? <><span className="sp">◌</span> Analisando...</> : <>⚡ Analisar Sinal</>}
              </button>

              <div className="card">
                <div style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Critérios</div>
                <div style={{ fontSize: 11, color: "#334155", lineHeight: 1.7 }}>{mkt.criteria}</div>
              </div>
            </div>

            {/* DIREITA */}
            <div>
              {!result && !loading && (
                <div style={{ border: "1px dashed #1e293b", borderRadius: 12, height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#1e293b" }}>
                  <div style={{ fontSize: 44 }}>{mkt.icon}</div>
                  <div style={{ fontSize: 13 }}>Informe o jogo e clique em <span style={{ color: mkt.color }}>Analisar</span></div>
                </div>
              )}

              {loading && (
                <div style={{ border: "1px solid #1e293b", borderRadius: 12, height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                  <div style={{ fontSize: 32 }} className="bk">🤖</div>
                  <div style={{ fontSize: 13, color: "#6366f1" }}>Analisando com IA...</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>Avaliando forma, H2H e critérios</div>
                </div>
              )}

              {result && st && (
                <div className="pu" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ background: st.bg, border: `1px solid ${st.color}30`, borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Veredito</div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 26, color: st.color }}>{st.icon} {st.label}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{result.evento}</div>
                      <div style={{ fontSize: 10, color: "#334155" }}>{result.competicao} · {result.data}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 52, lineHeight: 1, color: scoreColor(result.score) }}>{result.score}</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>/ 100</div>
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                      <span>Assertividade</span><span>Mínimo {mkt.minScore}</span>
                    </div>
                    <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                      <div className="fw" style={{ "--w": `${result.score}%`, height: "100%", borderRadius: 3, background: scoreColor(result.score), width: `${result.score}%` }} />
                      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${mkt.minScore}%`, width: 1, background: "#ffffff30" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { l: "Prob. Real", v: `${result.probabilidade_real}%`, c: scoreColor(result.probabilidade_real) },
                      { l: "Value Bet", v: result.value_bet ? "SIM" : "NÃO", c: result.value_bet ? "#22c55e" : "#ef4444" },
                      { l: "Odds Est.", v: result.odds_estimada || "-", c: "#6366f1" },
                    ].map(x => (
                      <div key={x.l} className="card">
                        <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{x.l}</div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, color: x.c }}>{x.v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="card">
                    <div style={{ fontSize: 10, color: "#6366f1", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>📊 Dados</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {["forma_time1","forma_time2","h2h","desfalques","contexto"].map(k => (
                        result[k] && result[k] !== "-" ? (
                          <div key={k}>
                            <div style={{ fontSize: 9, color: "#334155", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{k.replace(/_/g," ")}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{result[k]}</div>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ background: "rgba(34,197,94,.04)", border: "1px solid rgba(34,197,94,.15)", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, color: "#22c55e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>✅ Atendidos</div>
                      {(result.criterios_atendidos || []).map((c, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#64748b", paddingLeft: 8, borderLeft: "2px solid #22c55e40", marginBottom: 5, lineHeight: 1.4 }}>{c}</div>
                      ))}
                    </div>
                    <div style={{ background: "rgba(239,68,68,.04)", border: "1px solid rgba(239,68,68,.15)", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, color: "#ef4444", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>❌ Não Atendidos</div>
                      {(result.criterios_nao_atendidos || []).map((c, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#64748b", paddingLeft: 8, borderLeft: "2px solid #ef444440", marginBottom: 5, lineHeight: 1.4 }}>{c}</div>
                      ))}
                    </div>
                  </div>

                  {result.alertas?.length > 0 && (
                    <div style={{ background: "rgba(234,179,8,.05)", border: "1px solid rgba(234,179,8,.2)", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, color: "#eab308", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>⚠️ Alertas</div>
                      {result.alertas.map((a, i) => <div key={i} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{a}</div>)}
                    </div>
                  )}

                  <div className="card">
                    <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Resumo</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{result.resumo}</div>
                    <div style={{ marginTop: 8, fontSize: 10, color: "#334155" }}>Confiança: <span style={{ color: scoreColor(result.confianca_fonte) }}>{result.confianca_fonte}%</span></div>
                  </div>

                  <div style={{ fontSize: 10, color: "#1e293b", textAlign: "center" }}>⚠️ Análise informativa. Aposte com responsabilidade.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "approved" && (
          <div className="pu">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, color: "#22c55e" }}>Sinais Aprovados</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{approved.length} sinal(is) nesta sessão</div>
              </div>
              {approved.length > 0 && (
                <button onClick={exportXLSX} style={{ background: "#22c55e", color: "#07090f", border: "none", borderRadius: 8, padding: "10px 20px", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  📊 Exportar XLSX
                </button>
              )}
            </div>
            {approved.length === 0 ? (
              <div style={{ border: "1px dashed #1e293b", borderRadius: 12, padding: "60px 24px", textAlign: "center", color: "#1e293b" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                Nenhum sinal aprovado ainda.
              </div>
            ) : approved.map(s => (
              <div key={s._id} style={{ background: "#0d1117", border: "1px solid rgba(34,197,94,.2)", borderRadius: 10, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr auto auto auto auto", alignItems: "center", gap: 16, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{s.evento}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{s.competicao} · {s.data}</div>
                </div>
                {[
                  { l: "Mercado", v: s.mercado, c: s._mkt?.color || "#22c55e" },
                  { l: "Score", v: s.score, c: scoreColor(s.score) },
                  { l: "Prob", v: s.probabilidade_real + "%", c: scoreColor(s.probabilidade_real) },
                  { l: "Odds", v: s.odds_estimada || "-", c: "#6366f1" },
                ].map(x => (
                  <div key={x.l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>{x.l}</div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: x.c }}>{x.v}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
