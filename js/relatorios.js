/* ==========================================================================
   relatorios.js - Relatorios de vendas por periodo (RF09 e RF10)
   O grafico de barras e desenhado em SVG pelo proprio JavaScript, sem
   biblioteca externa.
   ========================================================================== */

(function () {
  'use strict';

  var sessao = App.iniciar('relatorios');
  if (!sessao) { return; }

  var periodoAtual = 'mes';

  var areaGrafico = document.getElementById('grafico');
  var areaEixo = document.getElementById('eixo');
  var areaMaisVendidos = document.getElementById('mais-vendidos');
  var areaLista = document.getElementById('lista-vendas');

  /* ------------------------- grafico de barras --------------------------- */
  function desenharGrafico(dias) {
    if (!dias.length) {
      areaGrafico.innerHTML = '';
      areaEixo.innerHTML = '';
      return;
    }

    var largura = 360;
    var altura = 120;
    var base = altura - 7;
    var maior = Math.max.apply(null, dias.map(function (d) { return d.valor; })) || 1;

    var vao = dias.length > 20 ? 2 : 4;
    var passo = largura / dias.length;
    var larguraBarra = Math.max(3, passo - vao);

    var barras = dias.map(function (d, i) {
      var proporcao = d.valor / maior;
      var alturaBarra = Math.max(d.valor > 0 ? 3 : 1, proporcao * (base - 8));
      var x = i * passo + (passo - larguraBarra) / 2;
      var y = base - alturaBarra;
      var ultima = i === dias.length - 1;

      return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" ' +
             'width="' + larguraBarra.toFixed(1) + '" height="' + alturaBarra.toFixed(1) + '" ' +
             'rx="3" fill="' + (ultima ? '#4F6EF7' : '#8B5CF6') + '">' +
             '<title>' + App.data(d.data) + ': ' + App.moeda(d.valor) + '</title></rect>';
    }).join('');

    areaGrafico.innerHTML = barras +
      '<line x1="0" y1="' + base + '" x2="' + largura + '" y2="' + base + '" stroke="#E8EAF0"/>';

    /* rotulos do eixo: primeiro, meio e ultimo dia do periodo */
    var meio = dias[Math.floor(dias.length / 2)];
    areaEixo.innerHTML =
      '<span>' + App.dataCurta(dias[0].data) + '</span>' +
      (dias.length > 2 ? '<span>' + App.dataCurta(meio.data) + '</span>' : '') +
      '<span>' + App.dataCurta(dias[dias.length - 1].data) + '</span>';
  }

  /* ---------------------- ranking de mais vendidos ----------------------- */
  function montarMaisVendidos(lista) {
    if (!lista.length) {
      areaMaisVendidos.innerHTML = '<p class="vazio">Nenhum produto vendido neste período.</p>';
      return;
    }

    var maior = lista[0].quantidade || 1;
    var tons = ['#7C3AED', '#9B6BF0', '#B794F4', '#C9B2F8', '#DCCDFB'];

    areaMaisVendidos.innerHTML = lista.map(function (p, i) {
      var largura = Math.round((p.quantidade / maior) * 100);
      return '<div style="display:flex;align-items:center;gap:10px' +
               (i ? ';margin-top:11px' : '') + '">' +
               '<div style="flex:1;min-width:0">' +
                 '<div style="font-size:12.5px;font-weight:600">' + App.escapar(p.nome) + '</div>' +
                 '<div class="barra-prog"><span style="width:' + largura + '%;background:' +
                   tons[i % tons.length] + '"></span></div>' +
               '</div>' +
               '<div style="font-size:12px;font-weight:700;width:52px;text-align:right">' +
                 p.quantidade + ' un.</div>' +
             '</div>';
    }).join('');
  }

  /* ------------------------- vendas do periodo --------------------------- */
  function montarLista(vendas) {
    document.getElementById('resumo-lista').textContent =
      vendas.length + (vendas.length === 1 ? ' registro' : ' registros');

    if (!vendas.length) {
      areaLista.innerHTML = '<p class="vazio">Nenhuma venda registrada no período selecionado.</p>';
      return;
    }

    areaLista.innerHTML = vendas.slice(0, 20).map(function (v) {
      var unidades = v.itens.reduce(function (s, i) { return s + i.quantidade; }, 0);
      return '<div class="linha-reg">' +
               '<div>' +
                 '<div class="n">Venda #' + v.numero + '</div>' +
                 '<div class="sub">' + App.data(v.data) + ' · ' + unidades +
                   (unidades === 1 ? ' unidade · ' : ' unidades · ') + App.escapar(v.formaPagamento) + '</div>' +
               '</div>' +
               '<div class="q valor">' + App.moeda(v.total) + '</div>' +
             '</div>';
    }).join('');
  }

  /* ------------------------------ atualizar ------------------------------ */
  function atualizar() {
    var r = Banco.relatorio(periodoAtual);

    var rotulos = {
      hoje: 'Movimento de hoje',
      semana: 'Últimos 7 dias',
      mes: 'Mês atual'
    };
    document.getElementById('periodo').textContent =
      rotulos[periodoAtual] + ' · ' + App.data(r.inicio) + ' a ' + App.data(r.fim);

    document.getElementById('faturamento').textContent = App.moeda(r.faturamento);
    document.getElementById('qtd-vendas').textContent = App.numero(r.quantidade);
    document.getElementById('ticket').textContent = App.moeda(r.ticketMedio);

    /* Comparacao entre a primeira e a segunda metade do periodo, para indicar
       se o faturamento esta subindo ou caindo. */
    var selo = document.getElementById('variacao');
    if (r.dias.length >= 2) {
      var meio = Math.floor(r.dias.length / 2);
      var anterior = r.dias.slice(0, meio).reduce(function (s, d) { return s + d.valor; }, 0);
      var recente = r.dias.slice(meio).reduce(function (s, d) { return s + d.valor; }, 0);
      var variacao = anterior > 0 ? ((recente - anterior) / anterior) * 100 : (recente > 0 ? 100 : 0);

      selo.textContent = (variacao >= 0 ? '+' : '') + variacao.toFixed(1).replace('.', ',') + '%';
      selo.style.background = variacao >= 0 ? '#E9F8EF' : '#FDECEC';
      selo.style.color = variacao >= 0 ? '#27AE60' : '#EB5757';
    } else {
      selo.textContent = '—';
      selo.style.background = '#F5F6F8';
      selo.style.color = '#8A90A0';
    }

    desenharGrafico(r.dias);
    montarMaisVendidos(r.maisVendidos);
    montarLista(r.vendas);
  }

  /* ------------------------------- filtros ------------------------------- */
  document.querySelectorAll('#filtros .chip').forEach(function (botao) {
    botao.addEventListener('click', function () {
      document.querySelectorAll('#filtros .chip').forEach(function (b) { b.classList.remove('on'); });
      botao.classList.add('on');
      periodoAtual = botao.getAttribute('data-periodo');
      atualizar();
    });
  });

  atualizar();
})();
