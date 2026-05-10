export const metadata = {
  title: "SignalIQ — Analisador de Apostas com IA",
  description: "Analisador de sinais de apostas com alta assertividade",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, background: "#07090f" }}>{children}</body>
    </html>
  );
}
