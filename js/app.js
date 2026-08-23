/* ==========================================================================
   app.js - Funcoes compartilhadas por todas as telas do StockMaster
   --------------------------------------------------------------------------
   Reune o que se repete em mais de uma pagina: os icones em SVG, a formatacao
   de valores e datas, a protecao das rotas internas e a montagem do cabecalho
   e da barra de abas.
   ========================================================================== */

var App = (function () {
  'use strict';

  /* ------------------------------ icones --------------------------------- */
  var ICONES = {
    caixa: '<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7z"/><path d="m3 8.5 9 4.5 9-4.5M12 13v7"/>',
    grade: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>' +
           '<rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    carrinho: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>' +
              '<path d="M3 4h2l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L21 8H6"/>',
    barras: '<path d="M3 20h18"/><rect x="5" y="11" width="3.5" height="7" rx="1"/>' +
            '<rect x="10.2" y="6" width="3.5" height="12" rx="1"/><rect x="15.5" y="13.5" width="3.5" height="4.5" rx="1"/>',
    sair: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>',
    voltar: '<path d="m15 6-6 6 6 6"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    lapis: '<path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17v3z"/>',
    lixeira: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    alerta: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    subir: '<path d="M4 18 10 12l3.5 3.5L20 8"/><path d="M15 8h5v5"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
    olho: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    etiqueta: '<path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9z"/><circle cx="7.5" cy="7.5" r="1.2"/>'
  };

  function icone(nome, classe) {
    return '<svg class="ic ' + (classe || '') + '" viewBox="0 0 24 24">' + ICONES[nome] + '</svg>';
  }

  /* ---------------------------- formatacao ------------------------------- */

  function moeda(valor) {
    return (Number(valor) || 0).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL'
    });
  }

  function numero(valor) {
    return (Number(valor) || 0).toLocaleString('pt-BR');
  }

  function data(valor) {
    var d = valor instanceof Date ? valor : new Date(valor);
    return d.toLocaleDateString('pt-BR');
  }

  function dataCurta(valor) {
    var d = valor instanceof Date ? valor : new Date(valor);
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2);
  }

  function hora(valor) {
    var d = valor instanceof Date ? valor : new Date(valor);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  /* Evita a injecao de HTML a partir do texto digitado pelo usuario. */
  function escapar(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ------------------------- navegacao do app ---------------------------- */

  var PAGINAS = [
    { id: 'dashboard', arquivo: 'dashboard.html', texto: 'Dashboard', icone: 'grade' },
    { id: 'estoque', arquivo: 'estoque.html', texto: 'Estoque', icone: 'caixa' },
    { id: 'vendas', arquivo: 'vendas.html', texto: 'Vendas', icone: 'carrinho' },
    { id: 'relatorios', arquivo: 'relatorios.html', texto: 'Relatórios', icone: 'barras' }
  ];

  function montarAbas(ativa) {
    var alvo = document.getElementById('abas');
    if (!alvo) { return; }
    alvo.innerHTML = PAGINAS.map(function (p) {
      return '<a class="aba' + (p.id === ativa ? ' on' : '') + '" href="' + p.arquivo + '">' +
             '<span class="bolha">' + icone(p.icone) + '</span>' + p.texto + '</a>';
    }).join('');
  }

  function montarMarca(alvo, comSair) {
    if (!alvo) { return; }
    alvo.innerHTML =
      '<span class="marca">' + icone('caixa') + 'StockMaster</span>' +
      (comSair === false ? '' : '<button id="btn-sair" title="Sair do sistema">' + icone('sair') + '</button>');

    var botao = document.getElementById('btn-sair');
    if (botao) {
      botao.addEventListener('click', function () {
        Banco.encerrarSessao();
        window.location.href = 'index.html';
      });
    }
  }

  /* Prepara qualquer pagina interna: garante a carga inicial, bloqueia o
     acesso sem sessao aberta e monta o cabecalho e as abas. */
  function iniciar(paginaAtiva) {
    Banco.semear();

    var sessao = Banco.sessaoAtual();
    if (!sessao) {
      window.location.replace('index.html');
      return null;
    }

    montarMarca(document.getElementById('linha-marca'));
    montarAbas(paginaAtiva);
    return sessao;
  }

  return {
    icone: icone,
    moeda: moeda,
    numero: numero,
    data: data,
    dataCurta: dataCurta,
    hora: hora,
    escapar: escapar,
    montarAbas: montarAbas,
    montarMarca: montarMarca,
    iniciar: iniciar
  };
})();
