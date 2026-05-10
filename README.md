[README.md](https://github.com/user-attachments/files/27561817/README.md)

# SignalIQ — Analisador de Apostas com IA

## Como subir na Vercel (passo a passo)

### 1. Criar repositório no GitHub
1. Acesse github.com e faça login
2. Clique em **"New repository"** (botão verde)
3. Nome: `signaliq`
4. Clique em **"Create repository"**
5. Na próxima tela, clique em **"uploading an existing file"**
6. Arraste TODOS os arquivos desta pasta para lá
7. Clique e.env
.env.local
node_modules
.next
m **"Commit changes"**

### 2. Subir na Vercel
1. Acesse vercel.com e faça login com o GitHub
2. Clique em **"Add New Project"**
3. Selecione o repositório `signaliq`
4. Clique em **"Deploy"**

### 3. Adicionar a chave da Anthropic
1. No painel da Vercel, vá em **Settings → Environment Variables**
2. Clique em **"Add"**
3. Name: `ANTHROPIC_API_KEY`
4. Value: cole sua chave (começa com `sk-ant-...`)
5. Clique em **"Save"**
6. Vá em **Deployments** e clique em **"Redeploy"**

### Pronto!
Seu site estará no ar em `signaliq.vercel.app` (ou similar).

---

## Mercados disponíveis
- 🚫 Lay 2x2 (sc[next.config.js](https://github.com/user-attachments/files/27561819/next.config.js)ore mínimo: 82)
- 🦓 Lay Zebra [package.json](https://github.com/user-attachments/files/27561818/package.json)(score mínimo: 85)
- ⚽ +1.5 Gols (score mínimo: 83)
- 🥅 +0.5 Gols (score mínimo: 88)
- 🎾 /** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
Vencedor Tênis (score mínimo: 84)
