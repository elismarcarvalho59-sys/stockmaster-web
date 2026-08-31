/* ==========================================================================
   produto.js - Cadastro e edicao de produtos (RF02 e RF03)
   A mesma tela atende aos dois casos: sem parametro na URL ela cadastra um
   produto novo; com ?id=... ela carrega o produto para edicao.
   ========================================================================== */

(function () {
  'use strict';

  Banco.semear();

  if (!Banco.sessaoAtual()) {
    window.location.replace('index.html');
    return;
  }

  var parametros = new URLSearchParams(window.location.search);
  var idProduto = Number(parametros.get('id')) || null;

  var formulario = document.getElementById('form-produto');
  var campoNome = document.getElementById('nome');
  var campoCategoria = document.getElementById('categoria');
  var campoPreco = document.getElementById('preco');
  var campoEstoque = document.getElementById('estoque');
  var campoMinimo = document.getElementById('minimo');
  var caixaErro = document.getElementById('erro');

  /* --------------------------- lista de categorias ----------------------- */
  function montarCategorias(selecionada) {
    var categorias = Banco.listarCategorias();

    campoCategoria.innerHTML =
      '<option value="">Selecione…</option>' +
      categorias.map(function (c) {
        return '<option value="' + c.id + '"' +
               (c.id === selecionada ? ' selected' : '') + '>' +
               App.escapar(c.nome) + '</option>';
      }).join('');
  }

  /* ------------------------- carga para edicao --------------------------- */
  function carregarProduto() {
    var produto = Banco.buscarProduto(idProduto);

    if (!produto) {
      idProduto = null;
      montarCategorias(null);
      return;
    }

    document.title = 'StockMaster — Editar produto';
    document.getElementById('titulo').textContent = 'Editar produto';
    document.getElementById('subtitulo').textContent = 'Atualize os dados de ' + produto.nome;
    document.getElementById('texto-botao').textContent = 'Salvar alterações';

    campoNome.value = produto.nome;
    campoPreco.value = produto.preco;
    campoEstoque.value = produto.estoque;
    campoMinimo.value = produto.estoqueMinimo;
    montarCategorias(produto.idCategoria);
  }

  /* ------------------------------- erros --------------------------------- */
  function mostrarErro(mensagem, campo) {
    caixaErro.textContent = mensagem;
    caixaErro.classList.remove('oculto');
    if (campo) { campo.classList.add('erro'); campo.focus(); }
  }

  function limparErros() {
    caixaErro.classList.add('oculto');
    [campoNome, campoCategoria, campoPreco, campoEstoque, campoMinimo].forEach(function (c) {
      c.classList.remove('erro');
    });
  }

  formulario.addEventListener('input', limparErros);

  /* ------------------------------ gravacao ------------------------------- */
  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    limparErros();

    /* Conferencias feitas na tela antes de chamar a camada de dados, para que
       o usuario receba a mensagem apontando o campo errado. */
    if (!campoNome.value.trim()) {
      mostrarErro('Informe o nome do produto.', campoNome);
      return;
    }
    if (!campoCategoria.value) {
      mostrarErro('Selecione a categoria do produto.', campoCategoria);
      return;
    }
    if (!(Number(campoPreco.value) > 0)) {
      mostrarErro('O preço de venda deve ser maior que zero.', campoPreco);
      return;
    }
    if (campoEstoque.value === '' || Number(campoEstoque.value) < 0) {
      mostrarErro('Informe a quantidade disponível em estoque.', campoEstoque);
      return;
    }
    if (campoMinimo.value === '' || Number(campoMinimo.value) < 0) {
      mostrarErro('Informe o estoque mínimo para o alerta de reposição.', campoMinimo);
      return;
    }

    var resultado = Banco.salvarProduto({
      id: idProduto,
      nome: campoNome.value,
      idCategoria: Number(campoCategoria.value),
      preco: Number(campoPreco.value),
      estoque: Number(campoEstoque.value),
      estoqueMinimo: Number(campoMinimo.value)
    });

    if (!resultado.ok) {
      mostrarErro(resultado.erro, campoNome);
      return;
    }

    window.location.href = 'estoque.html';
  });

  if (idProduto) {
    carregarProduto();
  } else {
    montarCategorias(null);
  }

  campoNome.focus();
})();
