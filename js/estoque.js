/* ==========================================================================
   estoque.js - Consulta, edicao e exclusao de produtos
   Atende RF03 (editar e excluir), RF04 (buscar e filtrar), RF08 (alerta de
   estoque baixo) e RF11 (cadastro de categorias).
   ========================================================================== */

(function () {
  'use strict';

  var sessao = App.iniciar('estoque');
  if (!sessao) { return; }

  var filtro = { termo: '', idCategoria: null };

  var campoBusca = document.getElementById('busca');
  var areaFiltros = document.getElementById('filtros');
  var areaLista = document.getElementById('lista');
  var areaAviso = document.getElementById('aviso');
  var subtitulo = document.getElementById('subtitulo');

  var modal = document.getElementById('modal-categorias');
  var formCategoria = document.getElementById('form-categoria');
  var campoCategoria = document.getElementById('nova-categoria');
  var erroCategoria = document.getElementById('erro-categoria');
  var listaCategorias = document.getElementById('lista-categorias');

  /* ------------------------------- avisos -------------------------------- */
  var temporizador = null;
  function avisar(texto) {
    areaAviso.textContent = texto;
    areaAviso.classList.remove('oculto');
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { areaAviso.classList.add('oculto'); }, 4000);
  }

  /* ------------------------------ subtitulo ------------------------------ */
  function atualizarSubtitulo() {
    var total = Banco.listarProdutos().length;
    var alerta = Banco.produtosEmAlerta().length;
    subtitulo.textContent = total + (total === 1 ? ' produto' : ' produtos') +
      (alerta ? ' · ' + alerta + ' com estoque baixo' : '');
  }

  /* ------------------------- filtros de categoria ------------------------ */
  function montarFiltros() {
    var chips = ['<button class="chip' + (filtro.idCategoria === null ? ' on' : '') +
                 '" data-categoria="">Todas</button>'];

    Banco.listarCategorias().forEach(function (c) {
      chips.push('<button class="chip' + (filtro.idCategoria === c.id ? ' on' : '') +
                 '" data-categoria="' + c.id + '">' + App.escapar(c.nome) + '</button>');
    });

    areaFiltros.innerHTML = chips.join('');

    areaFiltros.querySelectorAll('.chip').forEach(function (botao) {
      botao.addEventListener('click', function () {
        var valor = botao.getAttribute('data-categoria');
        filtro.idCategoria = valor ? Number(valor) : null;
        montarFiltros();
        montarLista();
      });
    });
  }

  /* --------------------------- lista de produtos ------------------------- */
  function montarLista() {
    var produtos = Banco.listarProdutos(filtro);

    if (!produtos.length) {
      areaLista.innerHTML = '<p class="vazio">Nenhum produto encontrado com esses critérios.<br>' +
                            'Ajuste a busca ou cadastre um novo produto.</p>';
      return;
    }

    areaLista.innerHTML = produtos.map(function (p) {
      var baixo = p.estoque <= p.estoqueMinimo;
      var estoque = baixo
        ? '<div class="est baixo">Estoque: ' + p.estoque + ' un. · abaixo do mínimo</div>'
        : '<div class="est">Estoque: <b>' + p.estoque + '</b> un.</div>';

      return '<article class="card' + (baixo ? ' critico' : '') + '">' +
               '<div class="item">' +
                 '<div class="txt">' +
                   '<div class="nome">' + App.escapar(p.nome) + '</div>' +
                   '<div class="cat">' + App.escapar(Banco.nomeCategoria(p.idCategoria)) + '</div>' +
                   estoque +
                 '</div>' +
                 '<div style="text-align:right">' +
                   '<div class="preco">' + App.moeda(p.preco) + '</div>' +
                   '<div class="acoes">' +
                     '<button class="editar" data-editar="' + p.id + '" title="Editar produto" ' +
                       'aria-label="Editar ' + App.escapar(p.nome) + '">' + App.icone('lapis', 'ic-sm') + '</button>' +
                     '<button class="excluir" data-excluir="' + p.id + '" title="Excluir produto" ' +
                       'aria-label="Excluir ' + App.escapar(p.nome) + '">' + App.icone('lixeira', 'ic-sm') + '</button>' +
                   '</div>' +
                 '</div>' +
               '</div>' +
             '</article>';
    }).join('');

    areaLista.querySelectorAll('[data-editar]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        window.location.href = 'produto.html?id=' + botao.getAttribute('data-editar');
      });
    });

    areaLista.querySelectorAll('[data-excluir]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        excluir(Number(botao.getAttribute('data-excluir')));
      });
    });
  }

  /* ---------------------------- exclusao (RF03) -------------------------- */
  /* A confirmacao usa uma segunda conferencia no proprio botao para nao
     depender de janelas do navegador. */
  var aguardando = null;

  function excluir(id) {
    var produto = Banco.buscarProduto(id);
    if (!produto) { return; }

    if (aguardando !== id) {
      aguardando = id;
      avisar('Toque novamente no ícone da lixeira para confirmar a exclusão de "' +
             produto.nome + '".');
      setTimeout(function () { if (aguardando === id) { aguardando = null; } }, 5000);
      return;
    }

    aguardando = null;
    var resultado = Banco.removerProduto(id);
    if (!resultado.ok) {
      avisar(resultado.erro);
      return;
    }

    avisar('Produto "' + produto.nome + '" excluído do estoque.');
    atualizarSubtitulo();
    montarFiltros();
    montarLista();
  }

  /* -------------------------- categorias (RF11) -------------------------- */
  function montarCategorias() {
    var categorias = Banco.listarCategorias();

    if (!categorias.length) {
      listaCategorias.innerHTML = '<p class="vazio">Nenhuma categoria cadastrada.</p>';
      return;
    }

    listaCategorias.innerHTML = categorias.map(function (c) {
      var quantos = Banco.listarProdutos({ idCategoria: c.id }).length;
      return '<div class="linha-reg">' +
               '<div>' +
                 '<div class="n">' + App.escapar(c.nome) + '</div>' +
                 '<div class="sub">' + quantos + (quantos === 1 ? ' produto' : ' produtos') + '</div>' +
               '</div>' +
               '<button class="excluir" data-remover="' + c.id + '" ' +
                 'aria-label="Remover categoria ' + App.escapar(c.nome) + '">' +
                 App.icone('lixeira', 'ic-sm') + '</button>' +
             '</div>';
    }).join('');

    listaCategorias.querySelectorAll('[data-remover]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        var resultado = Banco.removerCategoria(Number(botao.getAttribute('data-remover')));
        if (!resultado.ok) {
          erroCategoria.textContent = resultado.erro;
          erroCategoria.classList.remove('oculto');
          return;
        }
        erroCategoria.classList.add('oculto');
        montarCategorias();
        montarFiltros();
      });
    });
  }

  function abrirModal() {
    erroCategoria.classList.add('oculto');
    campoCategoria.value = '';
    montarCategorias();
    modal.classList.remove('oculto');
    campoCategoria.focus();
  }

  function fecharModal() {
    modal.classList.add('oculto');
  }

  document.getElementById('btn-categorias').addEventListener('click', abrirModal);
  document.getElementById('fechar-categorias').addEventListener('click', fecharModal);
  modal.addEventListener('click', function (evento) {
    if (evento.target === modal) { fecharModal(); }
  });

  formCategoria.addEventListener('submit', function (evento) {
    evento.preventDefault();
    var resultado = Banco.salvarCategoria(campoCategoria.value);

    if (!resultado.ok) {
      erroCategoria.textContent = resultado.erro;
      erroCategoria.classList.remove('oculto');
      return;
    }

    erroCategoria.classList.add('oculto');
    campoCategoria.value = '';
    montarCategorias();
    montarFiltros();
  });

  /* ------------------------------- busca --------------------------------- */
  campoBusca.addEventListener('input', function () {
    filtro.termo = campoBusca.value;
    montarLista();
  });

  atualizarSubtitulo();
  montarFiltros();
  montarLista();
})();
