/**
 * Valida se a resposta da OpenWeather contém temperatura e não é erro 404.
 * Usado no nó IF "Validar Resposta IF" do workflow n8n.
 */
function respostaValida(resposta) {
  const temp = resposta?.main?.temp;
  const cod = String(resposta?.cod ?? 200);
  return temp != null && cod !== '404';
}

module.exports = { respostaValida };
