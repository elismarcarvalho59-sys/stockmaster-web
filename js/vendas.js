/* ==========================================================================
   vendas.js - Registro de vendas e historico
   Atende RF05 (venda com um ou mais produtos), RF06 (baixa automatica no
   estoque), RF07 (calculo automatico do total), RF10 (consulta do historico)
   e RNF06 (bloqueio de venda acima do estoque disponivel).
   ========================================================================== */

(function () {
  'use strict';

  var sessao = App.iniciar('vendas');
  if (!sessao) { return; }

  /* carrinho da venda em andamento: { idProduto, quantidade } */
  var carrinho = [];
  var termo = '';

  var areaDisponiveis = document.getElementById('disponiveis');
  var areaItens = document.getElementById('itens');
  var areaHistorico = document.getElementById('historico');
  var campoBusca = document.getElementById('busca');
  var campoPagamento = document.getElementById('pagamento');
  var rotuloTotal = document.getElementById('total');
  var resumoItens = document.getElementById('resumo-itens');
  var resumoHistorico = document.getElementById('resumo-historico');
  var botaoFinalizar = document.getElementById('btn-finalizar');
  var caixaErro = document.getElementById('erro');
  var caixaSucesso = document.getElementById('sucesso');

  var painelNova = document.getElementById('painel-nova');
  var painelHistorico = document.getElementById('painel-historico');
  var chipNova = document.getElementById('chip-nova');
  var chipHistorico = document.getElementById('chip-historico');

  /* ----------------------------- utilitarios ----------------------------- */

  function noCarrinho(idProduto) {
    var achado = null;
    carrinho.forEach(function (i) { if (i.idProduto === idProduto) { achado = i; } });
    return achado;
  }

  function totalCarrinho() {
    return carrinho.reduce(function (soma, item) {
      var p = Banco.buscarProduto(item.idProduto);
      return soma + (p ? p.preco * item.quantidade : 0);
    }, 0);
  }

  function mostrarErro(mensagem) {
    caixaErro.textContent = mensagem;
    caixaErro.classList.remove('oculto');
    caixaSucesso.classList.add('oculto');
  }

  function limparMensagens() {
    caixaErro.classList.add('oculto');
    caixaSucesso.classList.add('oculto');
  }

  /* ------------------------------ cabecalho ------------------------------ */
  function atualizarSubtitulo() {
    document.getElementById('subtitulo').textContent =
      'Venda #' + Banco.proximoNumeroVenda() + ' · operador(a) ' + sessao.nome;
  }

  /* -------------------- formas de pagamento (RF05) ----------------------- */
  campoPagamento.innerHTML =
    '<option value="">Selecione…</option>' +
    Banco.FORMAS_PAGAMENTO.map(function (f) {
      return '<option value="' + f + '">' + f + '</option>';
    }).join('');

  campoPagamento.addEventListener('change', function () {
    limparMensagens();
    atualizarBotao();
  });

  /* ----------------------- produtos disponiveis -------------------------- */
  function montarDisponiveis() {
    var produtos = Banco.listarProdutos({ termo: termo });

    if (!produtos.length) {
      areaDisponiveis.innerHTML = '<p class="vazio">Nenhum produto encontrado.</p>';
      return;
    }

    areaDisponiveis.innerHTML = produtos.map(function (p) {
      var item = noCarrinho(p.id);
      var restante = p.estoque - (item ? item.quantidade : 0);
      var semEstoque = restante <= 0;

      return '<div class="item">' +
               '<div class="txt">' +
                 '<div class="nome">' + App.escapar(p.nome) + '</div>' +
                 '<div class="est' + (restante <= p.estoqueMinimo ? ' baixo' : '') + '">' +
                   'Estoque: <b>' + restante + '</b> un.</div>' +
               '</div>' +
               '<div class="preco">' + App.moeda(p.preco) + '</div>' +
               '<button class="mais" data-adicionar="' + p.id + '"' +
                 (semEstoque ? ' disabled' : '') +
                 ' title="Adicionar à venda" aria-label="Adicionar ' + App.escapar(p.nome) + '">' +
                 App.icone('mais', 'ic-sm') + '</button>' +
             '</div>';
    }).join('');

    areaDisponiveis.querySelectorAll('[data-adicionar]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        adicionar(Number(botao.getAttribute('data-adicionar')));
      });
    });
  }

  /* --------------------------- itens da venda ---------------------------- */
  function montarItens() {
    if (!carrinho.length) {
      areaItens.innerHTML = '<p class="vazio">Nenhum item adicionado.<br>' +
                            'Toque no + para incluir um produto na venda.</p>';
      resumoItens.textContent = 'nenhum item';
      return;
    }

    areaItens.innerHTML = carrinho.map(function (item) {
      var p = Banco.buscarProduto(item.idProduto);
      if (!p) { return ''; }

      return '<div class="linha-reg">' +
               '<div style="flex:1;min-width:0">' +
                 '<div class="n">' + App.escapar(p.nome) + '</div>' +
                 '<div class="sub">' + App.moeda(p.preco) + ' × ' + item.quantidade + '</div>' +
               '</div>' +
               '<div class="qtd">' +
                 '<button data-menos="' + p.id + '" aria-label="Diminuir quantidade">−</button>' +
                 '<button data-mais="' + p.id + '" aria-label="Aumentar quantidade">+</button>' +
               '</div>' +
               '<div class="q neutro">' + App.moeda(p.preco * item.quantidade) + '</div>' +
             '</div>';
    }).join('');

    var unidades = carrinho.reduce(function (s, i) { return s + i.quantidade; }, 0);
    resumoItens.textContent = carrinho.length + (carrinho.length === 1 ? ' item · ' : ' itens · ') +
                              unidades + (unidades === 1 ? ' unidade' : ' unidades');

    areaItens.querySelectorAll('[data-mais]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        adicionar(Number(botao.getAttribute('data-mais')));
      });
    });

    areaItens.querySelectorAll('[data-menos]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        remover(Number(botao.getAttribute('data-menos')));
      });
    });
  }

  /* ------------------------ total e botao (RF07) ------------------------- */
  function atualizarTotal() {
    rotuloTotal.textContent = App.moeda(totalCarrinho());
  }

  function atualizarBotao() {
    botaoFinalizar.disabled = !carrinho.length || !campoPagamento.value;
  }

  function redesenhar() {
    montarDisponiveis();
    montarItens();
    atualizarTotal();
    atualizarBotao();
  }

  /* ------------------------ carrinho: incluir/retirar -------------------- */
  function adicionar(idProduto) {
    limparMensagens();

    var produto = Banco.buscarProduto(idProduto);
    if (!produto) { return; }

    var item = noCarrinho(idProduto);
    var quantidade = item ? item.quantidade + 1 : 1;

    /* RNF06: nao permite ultrapassar o estoque disponivel. */
    if (quantidade > produto.estoque) {
      mostrarErro('Estoque insuficiente para ' + produto.nome + ': restam ' +
                  produto.estoque + ' unidade(s).');
      return;
    }

    if (item) { item.quantidade = quantidade; } else { carrinho.push({ idProduto: idProduto, quantidade: 1 }); }
    redesenhar();
  }

  function remover(idProduto) {
    limparMensagens();
    var item = noCarrinho(idProduto);
    if (!item) { return; }

    item.quantidade -= 1;
    if (item.quantidade <= 0) {
      carrinho = carrinho.filter(function (i) { return i.idProduto !== idProduto; });
    }
    redesenhar();
  }

  /* ----------------------- finalizar a venda (RF05) ---------------------- */
  botaoFinalizar.addEventListener('click', function () {
    limparMensagens();

    var resultado = Banco.registrarVenda(carrinho, campoPagamento.value);

    if (!resultado.ok) {
      mostrarErro(resultado.erro);
      redesenhar();
      return;
    }

    carrinho = [];
    campoPagamento.value = '';

    caixaSucesso.textContent = 'Venda #' + resultado.venda.numero + ' registrada no valor de ' +
                               App.moeda(resultado.venda.total) + '. O estoque foi atualizado.';
    caixaSucesso.classList.remove('oculto');

    atualizarSubtitulo();
    redesenhar();
    montarHistorico();
  });

  /* ------------------------- historico (RF10) ---------------------------- */
  function montarHistorico() {
    var vendas = Banco.listarVendas();
    resumoHistorico.textContent = vendas.length + (vendas.length === 1 ? ' venda registrada' : ' vendas registradas');

    if (!vendas.length) {
      areaHistorico.innerHTML = '<p class="vazio">Nenhuma venda registrada até o momento.</p>';
      return;
    }

    areaHistorico.innerHTML = vendas.slice(0, 30).map(function (v) {
      var itens = v.itens.map(function (i) {
        return '<div class="linha-reg">' +
                 '<div><div class="n">' + App.escapar(i.nome) + '</div>' +
                 '<div class="sub">' + App.moeda(i.precoUnitario) + ' × ' + i.quantidade + '</div></div>' +
                 '<div class="q neutro">' + App.moeda(i.subtotal) + '</div>' +
               '</div>';
      }).join('');

      return '<article class="card" style="padding:12px 15px">' +
               '<div class="linha-reg" style="padding-top:0">' +
                 '<div>' +
                   '<div class="n">Venda #' + v.numero + '</div>' +
                   '<div class="sub">' + App.data(v.data) + ' às ' + App.hora(v.data) +
                     ' · ' + App.escapar(v.formaPagamento) + '</div>' +
                   '<div class="sub">Operador(a): ' + App.escapar(v.operador) + '</div>' +
                 '</div>' +
                 '<div class="q valor">' + App.moeda(v.total) + '</div>' +
               '</div>' +
               '<div class="compacta">' + itens + '</div>' +
             '</article>';
    }).join('');
  }

  /* ----------------------------- alternancia ----------------------------- */
  chipNova.addEventListener('click', function () {
    chipNova.classList.add('on');
    chipHistorico.classList.remove('on');
    painelNova.classList.remove('oculto');
    painelHistorico.classList.add('oculto');
  });

  chipHistorico.addEventListener('click', function () {
    chipHistorico.classList.add('on');
    chipNova.classList.remove('on');
    painelHistorico.classList.remove('oculto');
    painelNova.classList.add('oculto');
    montarHistorico();
  });

  campoBusca.addEventListener('input', function () {
    termo = campoBusca.value;
    montarDisponiveis();
  });

  atualizarSubtitulo();
  redesenhar();
  montarHistorico();
})();
