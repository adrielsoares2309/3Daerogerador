#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Plataforma 3D — Cadeia de Geração e Distribuição de Energia Eólica
# Inicializa o servidor Node.js (Vite) e expõe via Cloudflare Tunnel,
# retornando o link público gerado pelo túnel.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-5173}"
PRODUCTION=false
DETACH=false
URL_ONLY=false
STOP_ONLY=false
TUNNEL_TOKEN="${CLOUDFLARE_TUNNEL_TOKEN:-}"
PUBLIC_URL_OVERRIDE="${CLOUDFLARE_PUBLIC_URL:-}"
PID_FILE="$SCRIPT_DIR/.start.pids"

LOG_DIR="${TMPDIR:-/tmp}/eolica-tunnel"
mkdir -p "$LOG_DIR"
NODE_LOG="$LOG_DIR/node.log"
CF_LOG="$LOG_DIR/cloudflared.log"

NODE_PID=""
CF_PID=""

usage() {
  cat <<'EOF'
Uso: ./start.sh [opções]

Inicializa a aplicação Node.js (Vite) e o Cloudflare Tunnel, retornando o link público.

Opções:
  -p, --port <porta>     Porta inicial do servidor local (padrão: 5173)
  --production, --prod   Executa em modo de produção (vite preview; compila ./dist se necessário)
  -d, --detach           Inicia em segundo plano, exibe o link do túnel e encerra o comando
  --url-only             Imprime apenas o link do Cloudflare Tunnel na saída padrão (stdout)
  --token <token>        Usa um Named Tunnel da Cloudflare (ou defina CLOUDFLARE_TUNNEL_TOKEN)
  --public-url <url>     URL pública do Named Tunnel para exibição (opcional, com --token)
  --stop                 Encerra processos iniciados anteriormente com --detach
  -h, --help             Exibe esta ajuda
EOF
}

log_info() {
  if [[ "$URL_ONLY" == true ]]; then
    echo "$@" >&2
  else
    echo "$@"
  fi
}

log_error() {
  echo "[ERRO] $*" >&2
}

# Parse de argumentos
while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--port)
      [[ $# -ge 2 ]] || { log_error "Falta o valor para $1."; exit 1; }
      PORT="$2"
      shift 2
      ;;
    --production|--prod)
      PRODUCTION=true
      shift
      ;;
    -d|--detach)
      DETACH=true
      shift
      ;;
    --url-only)
      URL_ONLY=true
      shift
      ;;
    --token)
      [[ $# -ge 2 ]] || { log_error "Falta o valor para $1."; exit 1; }
      TUNNEL_TOKEN="$2"
      shift 2
      ;;
    --public-url)
      [[ $# -ge 2 ]] || { log_error "Falta o valor para $1."; exit 1; }
      PUBLIC_URL_OVERRIDE="$2"
      shift 2
      ;;
    --stop)
      STOP_ONLY=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log_error "Opção desconhecida: $1"
      usage >&2
      exit 1
      ;;
  esac
done

# Encerra instância anterior iniciada com --detach
if [[ "$STOP_ONLY" == true ]]; then
  if [[ ! -f "$PID_FILE" ]]; then
    log_info "Nenhum processo em segundo plano encontrado ($PID_FILE ausente)."
    exit 0
  fi
  # shellcheck disable=SC1090
  source "$PID_FILE"
  for pid_var in "${CF_PID:-}" "${NODE_PID:-}"; do
    if [[ -n "$pid_var" ]] && kill -0 "$pid_var" 2>/dev/null; then
      kill "$pid_var" 2>/dev/null || true
    fi
  done
  rm -f "$PID_FILE"
  log_info "Servidor Node.js e Cloudflare Tunnel encerrados."
  exit 0
fi

# Tenta localizar Node.js em gerenciadores comuns caso não esteja no PATH
ensure_node_in_path() {
  if command -v node >/dev/null 2>&1; then
    return 0
  fi

  if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
    # shellcheck disable=SC1091
    source "${NVM_DIR:-$HOME/.nvm}/nvm.sh" >/dev/null 2>&1 || true
  fi

  for extra_bin in \
    "$HOME/.volta/bin" \
    "$HOME/.fnm" \
    "$HOME/.local/share/fnm/aliases/default/bin" \
    "$HOME/.asdf/shims" \
    "$HOME/.local/share/mise/shims" \
    "/usr/local/bin"
  do
    if [[ -d "$extra_bin" && ":$PATH:" != *":$extra_bin:"* ]]; then
      export PATH="$extra_bin:$PATH"
    fi
  done

  if ! command -v node >/dev/null 2>&1 && [[ -d "${NVM_DIR:-$HOME/.nvm}/versions/node" ]]; then
    local latest_nvm_bin
    latest_nvm_bin="$(find "${NVM_DIR:-$HOME/.nvm}/versions/node" -maxdepth 2 -type d -name bin 2>/dev/null | sort -V | tail -n 1 || true)"
    if [[ -n "$latest_nvm_bin" ]]; then
      export PATH="$latest_nvm_bin:$PATH"
    fi
  fi

  command -v node >/dev/null 2>&1
}

cleanup() {
  local exit_code=$?
  if [[ -n "$CF_PID" ]] && kill -0 "$CF_PID" 2>/dev/null; then
    kill "$CF_PID" 2>/dev/null || true
    wait "$CF_PID" 2>/dev/null || true
  fi
  if [[ -n "$NODE_PID" ]] && kill -0 "$NODE_PID" 2>/dev/null; then
    kill "$NODE_PID" 2>/dev/null || true
    wait "$NODE_PID" 2>/dev/null || true
  fi
  exit "$exit_code"
}

trap cleanup EXIT INT TERM

if [[ "$URL_ONLY" == false ]]; then
  echo ""
  echo "======================================================================"
  echo "  PLATAFORMA 3D — ENERGIA EÓLICA + CLOUDFLARE TUNNEL                  "
  echo "======================================================================"
  echo ""
fi

# 1. Verifica Node.js e cloudflared
if ! ensure_node_in_path; then
  log_error "Node.js não encontrado no PATH. Instale o Node.js (v18+) para continuar."
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  log_error "cloudflared não encontrado no PATH."
  log_error "Instale em: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  exit 1
fi

# 2. Verifica dependências locais
if [[ ! -d "$SCRIPT_DIR/node_modules" ]]; then
  log_info "[1/4] Instalando dependências locais (npm install)..."
  npm install >&2
else
  log_info "[1/4] Dependências locais verificadas (node_modules OK)."
fi

# 3. Encontra uma porta livre a partir da porta solicitada
find_free_port() {
  node --input-type=commonjs -e '
    const net = require("net");
    let port = Number(process.argv[1]);
    function tryPort(p) {
      const srv = net.createServer();
      srv.unref();
      srv.on("error", () => tryPort(p + 1));
      srv.listen(p, "127.0.0.1", () => {
        srv.close(() => {
          process.stdout.write(String(p));
        });
      });
    }
    tryPort(port);
  ' "$1"
}

PORT="$(find_free_port "$PORT")"
LOCAL_URL="http://127.0.0.1:$PORT"
VITE_BIN="$SCRIPT_DIR/node_modules/vite/bin/vite.js"

if [[ ! -f "$VITE_BIN" ]]; then
  log_error "Binário do Vite não encontrado em $VITE_BIN. Execute 'npm install'."
  exit 1
fi

# 4. Prepara e inicia o servidor Node.js (Vite)
if [[ "$PRODUCTION" == true ]]; then
  if [[ ! -f "$SCRIPT_DIR/dist/index.html" ]]; then
    log_info "[2/4] Compilando build de produção (vite build)..."
    node "$VITE_BIN" build >&2
  else
    log_info "[2/4] Build de produção localizado em ./dist."
  fi
  VITE_ARGS=("$VITE_BIN" "preview" "--port" "$PORT" "--strictPort" "--host")
  MODE_LABEL="PRODUÇÃO (vite preview)"
else
  VITE_ARGS=("$VITE_BIN" "--port" "$PORT" "--strictPort" "--host")
  MODE_LABEL="DESENVOLVIMENTO (vite dev)"
fi

: > "$NODE_LOG"
: > "$CF_LOG"

log_info "[2/4] Iniciando servidor Node.js em $MODE_LABEL na porta $PORT..."
if [[ "$DETACH" == true ]]; then
  nohup node "${VITE_ARGS[@]}" >"$NODE_LOG" 2>&1 </dev/null &
else
  node "${VITE_ARGS[@]}" >"$NODE_LOG" 2>&1 &
fi
NODE_PID=$!

# Aguarda o servidor local ficar pronto
wait_for_local_server() {
  local attempts=0
  local max_attempts=60
  while (( attempts < max_attempts )); do
    if ! kill -0 "$NODE_PID" 2>/dev/null; then
      log_error "O servidor Node.js encerrou inesperadamente. Log:"
      cat "$NODE_LOG" >&2
      return 1
    fi
    if node --input-type=commonjs -e '
      const http = require("http");
      const req = http.get(process.argv[1], (res) => {
        res.resume();
        process.exit(0);
      });
      req.on("error", () => process.exit(1));
      req.setTimeout(1000, () => { req.destroy(); process.exit(1); });
    ' "$LOCAL_URL" 2>/dev/null; then
      return 0
    fi
    sleep 0.5
    attempts=$((attempts + 1))
  done
  log_error "Tempo esgotado aguardando o servidor Node.js em $LOCAL_URL. Log:"
  cat "$NODE_LOG" >&2
  return 1
}

wait_for_local_server

# 5. Inicia o Cloudflare Tunnel
log_info "[3/4] Iniciando Cloudflare Tunnel apontando para $LOCAL_URL..."
if [[ -n "$TUNNEL_TOKEN" ]]; then
  CF_ARGS=("tunnel" "--no-autoupdate" "run" "--token" "$TUNNEL_TOKEN")
else
  CF_ARGS=("tunnel" "--no-autoupdate" "--url" "$LOCAL_URL")
fi

if [[ "$DETACH" == true ]]; then
  nohup cloudflared "${CF_ARGS[@]}" >"$CF_LOG" 2>&1 </dev/null &
else
  cloudflared "${CF_ARGS[@]}" >"$CF_LOG" 2>&1 &
fi
CF_PID=$!

# Captura o link público do Cloudflare Tunnel
TUNNEL_URL=""
if [[ -n "$TUNNEL_TOKEN" ]]; then
  attempts=0
  while (( attempts < 60 )); do
    if ! kill -0 "$CF_PID" 2>/dev/null; then
      log_error "cloudflared encerrou inesperadamente. Log:"
      cat "$CF_LOG" >&2
      exit 1
    fi
    if grep -qE "Registered tunnel connection" "$CF_LOG" 2>/dev/null; then
      break
    fi
    sleep 0.5
    attempts=$((attempts + 1))
  done
  TUNNEL_URL="${PUBLIC_URL_OVERRIDE:-Tunnel autenticado ativo (verifique o hostname configurado no painel Cloudflare Zero Trust)}"
else
  attempts=0
  while (( attempts < 90 )); do
    if ! kill -0 "$CF_PID" 2>/dev/null; then
      log_error "cloudflared encerrou inesperadamente. Log:"
      cat "$CF_LOG" >&2
      exit 1
    fi
    TUNNEL_URL="$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$CF_LOG" 2>/dev/null | grep -v 'api\.trycloudflare\.com' | head -n 1 || true)"
    if [[ -n "$TUNNEL_URL" ]]; then
      break
    fi
    sleep 0.5
    attempts=$((attempts + 1))
  done

  if [[ -z "$TUNNEL_URL" ]]; then
    log_error "Não foi possível obter o link do Cloudflare Tunnel dentro do tempo limite. Log:"
    cat "$CF_LOG" >&2
    exit 1
  fi
fi

# 6. Exibe/retorna o link do Cloudflare Tunnel
log_info "[4/4] Aplicação pronta!"

if [[ "$URL_ONLY" == true ]]; then
  echo "$TUNNEL_URL"
else
  echo ""
  echo "----------------------------------------------------------------------"
  echo "  APLICAÇÃO ONLINE VIA CLOUDFLARE TUNNEL!"
  echo ""
  echo "  Link Cloudflare Tunnel : $TUNNEL_URL"
  echo "  Link Local             : http://localhost:$PORT"
  echo "  Logs                   : $NODE_LOG | $CF_LOG"
  echo ""
  if [[ "$DETACH" == true ]]; then
    echo "  Executando em segundo plano (Node PID: $NODE_PID | Tunnel PID: $CF_PID)"
    echo "  Para encerrar: ./start.sh --stop"
  else
    echo "  (Pressione Ctrl+C neste terminal para encerrar o servidor e o túnel)"
  fi
  echo "----------------------------------------------------------------------"
  echo ""
fi

if [[ "$DETACH" == true ]]; then
  cat > "$PID_FILE" <<EOF
NODE_PID=$NODE_PID
CF_PID=$CF_PID
PORT=$PORT
TUNNEL_URL=$TUNNEL_URL
EOF
  trap - EXIT INT TERM
  exit 0
fi

# Mantém o script ativo até Ctrl+C ou encerramento de um dos processos
while true; do
  if ! kill -0 "$NODE_PID" 2>/dev/null; then
    log_error "O processo do Node.js parou inesperadamente. Verifique $NODE_LOG."
    exit 1
  fi
  if ! kill -0 "$CF_PID" 2>/dev/null; then
    log_error "O processo do cloudflared parou inesperadamente. Verifique $CF_LOG."
    exit 1
  fi
  sleep 1
done
