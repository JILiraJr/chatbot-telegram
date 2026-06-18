# Chatbot de Clima no Telegram (n8n)

## Descrição do projeto

Este projeto implementa um **chatbot de clima no Telegram** utilizando **n8n**. O usuário envia o nome de uma cidade brasileira e o bot responde com a **temperatura atual** em graus Celsius.

O fluxo consulta a API gratuita do [OpenWeather](https://openweathermap.org/api) e devolve uma mensagem curta e amigável. Em caso de cidade inexistente ou resposta inválida, o bot informa o formato esperado de entrada.

**Tecnologias utilizadas:**

- **n8n** — automação do workflow (Telegram Trigger, HTTP Request, IF, Set, Telegram Send)
- **OpenWeather** — dados meteorológicos (`/data/2.5/weather`)
- **Telegram Bot API** — recebimento e envio de mensagens
- **Docker Compose** — ambiente local com n8n, Postgres, Redis e ngrok

**Formato de entrada:** `Cidade,UF,BR` (ex.: `São Paulo,SP,BR`). Se o usuário enviar apenas `Cidade,UF`, o workflow acrescenta `,BR` automaticamente na variável `queue`.

---

## Conformidade com os requisitos do workflow

| Requisito | Implementação |
|-----------|---------------|
| 1. Telegram Trigger | Nó **Telegram Trigger** (`updates: message`) |
| 2. Variável `queue` | Nó **Normalizar Entrada** (Set) — trim, minúsculas, remove acentos, padroniza vírgulas |
| 3. HTTP Request OpenWeather | Nó **Consultar OpenWeather** → `https://api.openweathermap.org/data/2.5/weather` com `q` ← `queue`, `units=metric`, `lang=pt_br`, `appid=$env.OPENWEATHER_API_KEY` |
| 4. Extração e formatação | Nó **Formatar Mensagem Sucesso** — extrai `main.temp`, arredonda e monta a mensagem |
| 5. Validação e erro | Nó **Validar Resposta IF** — verifica `main.temp` e `cod ≠ 404`; ramo falso → **Enviar Mensagem Erro** |
| 6. Resposta Telegram | Nós **Enviar Mensagem Sucesso** e **Enviar Mensagem Erro** |
| 7. Exportação e README | `workflow-telegram-chatbot.json` sem tokens embutidos; credenciais por referência |

> **Sobre o parâmetro `queue`:** o enunciado define a variável `queue` no Set node. A API OpenWeather recebe essa variável no parâmetro de consulta `q` (nome exigido pela API).

---

## Estrutura do repositório

| Arquivo / pasta | Descrição |
|-----------------|-----------|
| [`workflow-telegram-chatbot.json`](workflow-telegram-chatbot.json) | Workflow exportado para importar no n8n |
| [`src/`](src/) | Lógica de negócio extraída do workflow (normalização, validação, formatação) |
| [`tests/`](tests/) | Testes automatizados da lógica |
| [`docker-compose.yml`](docker-compose.yml) | Stack Docker: n8n, Postgres, Redis e ngrok |
| [`.env.example`](.env.example) | Modelo das variáveis de ambiente |
| [`README.md`](README.md) | Esta documentação |

---

## Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose
- [Node.js](https://nodejs.org/) 18+ (opcional, para rodar os testes em `src/`)
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

### Rodar testes da lógica (opcional)

```bash
npm test
```

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

Não usa credencial do n8n. A chave é lida via `$env.OPENWEATHER_API_KEY` no nó **Consultar OpenWeather**.

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

Envie mensagens no formato **`Cidade,UF,BR`** ou **`Cidade,UF`** (o sufixo `,BR` é acrescentado automaticamente).

#### Sucesso

| Você envia | O bot responde (exemplo) |
|------------|--------------------------|
| `Belo Horizonte,MG,BR` | `🌤️ A temperatura em Belo Horizonte é de 18°C.` |
| `Palmas,TO,BR` | `🌤️ A temperatura em Palmas é de 27°C.` |
| `Campinas,SP` | `🌤️ A temperatura em Campinas é de 15°C.` |

#### Erro

| Você envia | O bot responde |
|------------|----------------|
| `CidadeInexistente,XX,BR` | `❌ Cidade não encontrada. Use o formato Cidade,UF,BR (ex.: São Paulo,SP,BR).` |

> `/start` não gera resposta. Envie diretamente `Cidade,UF,BR` ou `Cidade,UF`.

### 3. Verificar execuções

No n8n: abra o workflow → aba **Executions** → confira status e nó com falha.

---

## Estrutura do workflow

```
Telegram Trigger
  → Normalizar Entrada (variável queue)
    → Consultar OpenWeather (q ← queue, units, lang, appid)
      → Validar Resposta IF
        → [válido]  Formatar Mensagem Sucesso → Enviar Mensagem Sucesso
        → [inválido] Enviar Mensagem Erro
```

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

### Cidade não encontrada

Confirme o formato `Cidade,UF,BR` (ex.: `São Paulo,SP,BR`). A OpenWeather usa o valor da variável `queue` no parâmetro `q`.

---

## Segurança

- O JSON contém apenas **referências** a credenciais (`id`/`name`), nunca tokens.
- `OPENWEATHER_API_KEY` usa `$env`, não fica embutida no workflow.
- `TELEGRAM_BOT_TOKEN` fica no `.env` e na credencial do n8n.
- Gere novos tokens se alguma chave for exposta.
