/**
 * Normaliza o texto recebido do Telegram para a variável `queue`.
 * Usado no nó Set "Normalizar Entrada" do workflow n8n.
 *
 * Regras: trim, minúsculas, remove acentos, padroniza vírgulas e acrescenta ,br.
 */
function normalizarEntrada(texto) {
  const normalized = (texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s+/g, ' ');

  const parts = normalized.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 0 && parts[parts.length - 1] !== 'br') {
    parts.push('br');
  }
  return parts.join(',');
}

module.exports = { normalizarEntrada };
