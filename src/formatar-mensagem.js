/**
 * Formata a mensagem de sucesso com temperatura arredondada.
 * Usado no nó Set "Formatar Mensagem Sucesso" do workflow n8n.
 */
function formatarMensagemSucesso(nomeCidade, temperatura) {
  if (temperatura == null) return '';
  return `🌤️ A temperatura em ${nomeCidade} é de ${Math.round(temperatura)}°C.`;
}

const MENSAGEM_ERRO =
  '❌ Cidade não encontrada. Use o formato Cidade,UF,BR (ex.: São Paulo,SP,BR).';

module.exports = { formatarMensagemSucesso, MENSAGEM_ERRO };
