# SignalIQ — Analisador de Apostas com IA

## Como subir na Vercel (passo a passo)

### 1. Criar repositório no GitHub
1. Acesse github.com e faça login
2. Clique em **"New repository"** (botão verde)
3. Nome: `signaliq`
4. Clique em **"Create repository"**
5. Na próxima tela, clique em **"uploading an existing file"**
6. Arraste TODOS os arquivos desta pasta para lá
7. Clique em **"Commit changes"**

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
- 🚫 Lay 2x2 (score mínimo: 82)
- 🦓 Lay Zebra (score mínimo: 85)
- ⚽ +1.5 Gols (score mínimo: 83)
- 🥅 +0.5 Gols (score mínimo: 88)
- 🎾 Vencedor Tênis (score mínimo: 84)
