const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizarEntrada } = require('../src/normalizar-entrada');
const { formatarMensagemSucesso, MENSAGEM_ERRO } = require('../src/formatar-mensagem');
const { respostaValida } = require('../src/validar-resposta');

test('normalizarEntrada padroniza cidade, uf e acrescenta br', () => {
  assert.equal(normalizarEntrada('Belo Horizonte, MG'), 'belo horizonte,mg,br');
  assert.equal(normalizarEntrada('São Paulo, SP'), 'sao paulo,sp,br');
});

test('formatarMensagemSucesso arredonda temperatura', () => {
  assert.equal(
    formatarMensagemSucesso('Belo Horizonte', 18.6),
    '🌤️ A temperatura em Belo Horizonte é de 19°C.'
  );
});

test('respostaValida detecta sucesso e erro', () => {
  assert.equal(respostaValida({ main: { temp: 25 }, cod: 200 }), true);
  assert.equal(respostaValida({ cod: 404 }), false);
});

test('mensagem de erro segue o enunciado', () => {
  assert.match(MENSAGEM_ERRO, /Cidade,UF,BR/);
  assert.match(MENSAGEM_ERRO, /São Paulo,SP,BR/);
});
