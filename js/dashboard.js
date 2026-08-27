/* ==========================================================================
   dashboard.js - Visao geral do negocio (RF08, RF09 e RF10)
   ========================================================================== */

(function () {
  'use strict';

  var sessao = App.iniciar('dashboard');
  if (!sessao) { return; }

  /* ------------------------------ cabecalho ------------------------------ */
  document.getElementById('subtitulo').textContent =
    'Olá, ' + sessao.nome.split(' ')[0] + ' · ' + App.data(new Date());

  /* --------------------------- indicadores ------------------------------- */
  function montarTiles() {
    var r = Banco.resumoDashboard();

    var tiles = [
      { cor: 'azul', icone: 'caixa', valor: App.numero(r.produtos), rotulo: 'Produtos', menor: false },
      { cor: 'verde', icone: 'carrinho', valor: App.numero(r.vendasHoje), rotulo: 'Vendas hoje', menor: false },
      { cor: 'roxo', icone: 'subir', valor: App.moeda(r.receitaHoje), rotulo: 'Receita do dia', menor: true },
      { cor: 'laranja', icone: 'alerta', valor: App.numero(r.emAlerta), rotulo: 'Estoque baixo', menor: false }
    ];

    document.getElementById('tiles').innerHTML = tiles.map(function (t) {
      return '<article class="tile ' + t.cor + '">' +
               App.icone(t.icone, 'ico') +
               '<div class="n' + (t.menor ? ' menor' : '') + '">' + t.valor + '</div>' +
               '<div class="l">' + t.rotulo + '</div>' +
             '</article>';
    }).join('');
  }

  /* ------------------------ alertas de estoque --------------------------- */
  function montarAlertas() {
    var lista = Banco.produtosEmAlerta();
    var alvo = document.getElementById('alertas');

    if (!lista.length) {
      alvo.innerHTML = '<p class="vazio">Nenhum produto abaixo do estoque mínimo.<br>' +
                       'O estoque está equilibrado.</p>';
      return;
    }

    alvo.innerHTML = lista.map(function (p) {
      var critico = p.estoque < p.estoqueMinimo;
      return '<div class="linha-reg">' +
               '<div>' +
                 '<div class="n">' + App.escapar(p.nome) + '</div>' +
                 '<div class="sub">mínimo: ' + p.estoqueMinimo + ' unidades</div>' +
               '</div>' +
               '<div class="q' + (critico ? ' crit' : '') + '">' + p.estoque + ' un.</div>' +
             '</div>';
    }).join('');
  }

  /* -------------------------- ultimas vendas ----------------------------- */
  function montarVendas() {
    var doDia = Banco.vendasDoDia();
    var lista = doDia;
    var rotulo = 'hoje';

    /* Se ainda nao houve venda hoje, mostra as ultimas registradas. */
    if (!lista.length) {
      lista = Banco.listarVendas();
      rotulo = 'últimos registros';
    }

    document.getElementById('rotulo-vendas').textContent = rotulo;
    var alvo = document.getElementById('ultimas-vendas');

    if (!lista.length) {
      alvo.innerHTML = '<p class="vazio">Nenhuma venda registrada até o momento.</p>';
      return;
    }

    alvo.innerHTML = lista.slice(0, 5).map(function (v) {
      var unidades = v.itens.reduce(function (s, i) { return s + i.quantidade; }, 0);
      return '<div class="linha-reg">' +
               '<div>' +
                 '<div class="n">Venda #' + v.numero + '</div>' +
                 '<div class="sub">' + unidades + (unidades === 1 ? ' item · ' : ' itens · ') +
                   App.data(v.data) + ' ' + App.hora(v.data) + '</div>' +
               '</div>' +
               '<div class="q valor">' + App.moeda(v.total) + '</div>' +
             '</div>';
    }).join('');
  }

  montarTiles();
  montarAlertas();
  montarVendas();
})();
