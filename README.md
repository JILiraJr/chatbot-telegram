# Chatbot de Clima no Telegram (n8n)

## Descrição do projeto

Este projeto implementa um **chatbot de clima no Telegram** utilizando **n8n**. O usuário envia o nome de uma cidade brasileira e o bot responde com a **temperatura atual** em graus Celsius.

O fluxo consulta a API gratuita do [OpenWeather](https://openweathermap.org/api), valida se a cidade existe no estado informado e devolve uma mensagem curta e amigável. Em caso de cidade inexistente ou UF incorreto, o bot informa o formato esperado de entrada.

**Tecnologias utilizadas:**

- **n8n** — automação do workflow (Telegram Trigger, HTTP Request, IF, Set, Telegram Send)
- **OpenWeather** — geocodificação e dados meteorológicos
- **Telegram Bot API** — recebimento e envio de mensagens
- **Docker Compose** — ambiente local com n8n, Postgres, Redis e ngrok

**Formato de entrada:** `Cidade,UF` (ex.: `Belo Horizonte,MG`). O sufixo `,BR` é acrescentado automaticamente pelo workflow.

---

## Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose
- Conta gratuita no [OpenWeather](https://openweathermap.org/api) (para obter `OPENWEATHER_API_KEY`)
- Bot criado no [@BotFather](https://t.me/BotFather) do Telegram (para obter `TELEGRAM_BOT_TOKEN`)
- Conta no [ngrok](https://ngrok.com/) (túnel público necessário para o Telegram Trigger)

---

## Início rápido

```bash
git clone https://github.com/JILiraJr/chatbot-telegram.git
cd chatbot-telegram
cp .env.example .env
# Edite .env com suas chaves
docker compose up -d
```

Depois importe o workflow no n8n e configure as credenciais (seções abaixo).

---

## Configuração do ambiente

### 1. Variáveis de ambiente

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `OPENWEATHER_API_KEY` | Chave da API OpenWeather | [openweathermap.org/api](https://openweathermap.org/api) |
| `TELEGRAM_BOT_TOKEN` | Token do bot Telegram | [@BotFather](https://t.me/BotFather) → `/newbot` |
| `NGROK_AUTHTOKEN` | Token do ngrok | [dashboard.ngrok.com](https://dashboard.ngrok.com/) |
| `WEBHOOK_URL` | URL pública do túnel ngrok | Ver passo 3 abaixo |

> **Importante:** nunca commite o arquivo `.env`. Ele está no `.gitignore`.

### 2. Subir os containers

```bash
docker compose up -d
```

O n8n ficará disponível em [http://localhost:5678](http://localhost:5678).

### 3. Configurar o WEBHOOK_URL

O Telegram precisa de uma URL pública para enviar mensagens ao n8n:

```bash
curl -s http://localhost:4040/api/tunnels | python3 -c \
  "import sys,json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])"
```

Copie a URL para `WEBHOOK_URL` no `.env` (sem barra no final) e reinicie o n8n:

```bash
docker compose up -d n8n-editor n8n-worker
```

---

## Como importar o workflow no n8n

1. Acesse [http://localhost:5678](http://localhost:5678).
2. No menu lateral, clique em **Workflows**.
3. Clique em **Import from File** (menu **⋯**).
4. Selecione [`workflow-telegram-chatbot.json`](workflow-telegram-chatbot.json).
5. O workflow **Clima no Telegram** abrirá no editor.
6. Configure as credenciais (próxima seção) antes de ativar.

---

## Como configurar credenciais no n8n

Os tokens **não** ficam no JSON do workflow — configure-os separadamente.

### Telegram (`TELEGRAM_BOT_TOKEN`)

Necessária nos nós **Telegram Trigger**, **Enviar Mensagem Sucesso** e **Enviar Mensagem Erro**.

1. Vá em **Credentials** → **Add Credential** → **Telegram API**.
2. Preencha:
   - **Credential Name:** ex. `Telegram Bot Clima`
   - **Access Token:** valor de `TELEGRAM_BOT_TOKEN` do `.env`
3. Salve e associe a credencial aos três nós Telegram do workflow.

### OpenWeather (`OPENWEATHER_API_KEY`)

Não usa credencial do n8n. A chave é lida via `$env.OPENWEATHER_API_KEY` nos nós **Geocodificar Cidade** e **Consultar OpenWeather**.

1. Defina `OPENWEATHER_API_KEY` no `.env`.
2. Confirme no `docker-compose.yml`:

```yaml
- OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
- N8N_BLOCK_ENV_ACCESS_IN_NODE=false
```

3. Reinicie os containers:

```bash
docker compose up -d n8n-editor n8n-worker
```

> Sem `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`, o n8n 2.x bloqueia `$env` nos nós (*"access to env vars denied"*).

---

## Como executar o chatbot

### 1. Ativar o workflow

1. Abra **Clima no Telegram** no n8n.
2. Confirme credenciais nos nós Telegram (sem triângulo vermelho).
3. Ative pelo toggle **Active** / **Published**.
4. Confirme ngrok ativo e `WEBHOOK_URL` correto no `.env`.

Se alterar o `WEBHOOK_URL`, desative e reative o workflow no n8n para re-registrar o webhook do Telegram.

### 2. Testar no Telegram

Envie mensagens no formato **`Cidade,UF`**.

#### Sucesso

| Você envia | O bot responde (exemplo) |
|------------|--------------------------|
| `Belo Horizonte,MG` | `🌤️ A temperatura em Belo Horizonte é de 18°C.` |
| `Palmas, TO` | `🌤️ A temperatura em Palmas é de 27°C.` |
| `Campinas, SP` | `🌤️ A temperatura em Campinas é de 15°C.` |

#### Erro

| Você envia | O bot responde |
|------------|----------------|
| `Porto Nacional, GO` | `❌ Cidade não encontrada. Use o formato Cidade,UF (ex.: São Paulo,SP).` |
| `Mais, TO` | `❌ Cidade não encontrada. Use o formato Cidade,UF (ex.: São Paulo,SP).` |

> `/start` não gera resposta. Envie diretamente `Cidade,UF`.

### 3. Verificar execuções

No n8n: abra o workflow → aba **Executions** → confira status e nó com falha.

---

## Estrutura do workflow

```
Telegram Trigger
  → Normalizar Entrada (queue + uf + cidade)
    → Geocodificar Cidade (OpenWeather Geo API)
      → Validar Localização
        → [válido]  Consultar OpenWeather → Formatar → Enviar Sucesso
        → [inválido] Enviar Erro
```

---

## Arquivos do repositório

| Arquivo | Descrição |
|---------|-----------|
| [`workflow-telegram-chatbot.json`](workflow-telegram-chatbot.json) | Workflow para importar no n8n |
| [`docker-compose.yml`](docker-compose.yml) | Stack Docker: n8n, Postgres, Redis e ngrok |
| [`.env.example`](.env.example) | Modelo das variáveis de ambiente |
| [`README.md`](README.md) | Esta documentação |

---

## Solução de problemas

### Bot não responde

```bash
curl -s -o /dev/null -w '%{http_code}\n' "${WEBHOOK_URL}/healthz"
source .env
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool
```

- `healthz` deve retornar **200**
- `getWebhookInfo` não deve ter `last_error_message`
- Se outro `ngrok` rodar na máquina: `pgrep -fl ngrok` → pare o processo → `docker compose restart ngrok`

### "access to env vars denied"

Reinicie após confirmar `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` no `docker-compose.yml`:

```bash
docker compose up -d n8n-editor n8n-worker
```

### Cidade errada ou sem resposta no erro

O workflow valida cidade + UF pela **Geo API** da OpenWeather antes de consultar a temperatura.

---

## Segurança

- O JSON contém apenas **referências** a credenciais (`id`/`name`), nunca tokens.
- `OPENWEATHER_API_KEY` usa `$env`, não fica embutida no workflow.
- `TELEGRAM_BOT_TOKEN` fica no `.env` e na credencial do n8n.
- Gere novos tokens se alguma chave for exposta.
