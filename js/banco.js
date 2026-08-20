/* ==========================================================================
   banco.js - Camada de acesso aos dados do StockMaster
   --------------------------------------------------------------------------
   Todo o acesso a dados do sistema passa por este arquivo. Nesta entrega os
   registros sao gravados no armazenamento local do navegador (Web Storage),
   seguindo exatamente a estrutura das tabelas modeladas na secao 4 da
   documentacao: tb_usuario, tb_categoria, tb_produto, tb_venda e
   tb_item_venda.

   Na Entrega 3, quando o backend e o banco relacional forem implementados,
   somente o corpo das funcoes abaixo precisara ser alterado para consumir a
   API. As telas continuam funcionando sem modificacao.
   ========================================================================== */

var Banco = (function () {
  'use strict';

  var CHAVES = {
    usuarios: 'sm_usuarios',
    categorias: 'sm_categorias',
    produtos: 'sm_produtos',
    vendas: 'sm_vendas',
    sessao: 'sm_sessao'
  };

  var FORMAS_PAGAMENTO = [
    'Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'PIX', 'Boleto'
  ];

  /* ---------------------- utilitarios internos --------------------------- */

  function ler(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || [];
    } catch (e) {
      return [];
    }
  }

  function gravar(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
  }

  function proximoId(lista) {
    var maior = 0;
    lista.forEach(function (r) { if (r.id > maior) { maior = r.id; } });
    return maior + 1;
  }

  /* Resumo de senha. Nao e criptografia real: serve apenas para nao guardar
     a senha em texto puro nesta etapa. O requisito RNF03 sera atendido no
     backend da Entrega 3, com bcrypt. */
  function cifrar(texto) {
    var hash = 5381;
    for (var i = 0; i < texto.length; i++) {
      hash = ((hash << 5) + hash + texto.charCodeAt(i)) | 0;
    }
    return 'sm$' + Math.abs(hash).toString(16);
  }

  /* ---------------------------- tb_usuario ------------------------------- */

  function listarUsuarios() {
    return ler(CHAVES.usuarios);
  }

  /* RF01 - autenticacao por login e senha. */
  function autenticar(login, senha) {
    var alvo = String(login || '').trim().toLowerCase();
    var achado = null;
    listarUsuarios().forEach(function (u) {
      if (u.login.toLowerCase() === alvo && u.senha === cifrar(senha)) { achado = u; }
    });
    return achado;
  }

  function abrirSessao(usuario, lembrar) {
    var dados = {
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      perfil: usuario.perfil,
      lembrar: !!lembrar
    };
    gravar(CHAVES.sessao, dados);
    return dados;
  }

  function sessaoAtual() {
    try {
      return JSON.parse(localStorage.getItem(CHAVES.sessao));
    } catch (e) {
      return null;
    }
  }

  function encerrarSessao() {
    localStorage.removeItem(CHAVES.sessao);
  }

  /* RNF05 - controle de acesso por perfil. */
  function ehAdministrador() {
    var s = sessaoAtual();
    return !!s && s.perfil === 'administrador';
  }

  /* --------------------------- tb_categoria ------------------------------ */

  function listarCategorias() {
    return ler(CHAVES.categorias).sort(function (a, b) {
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }

  /* RF11 - cadastro de categorias de produtos. */
  function salvarCategoria(nome) {
    var limpo = String(nome || '').trim();
    if (!limpo) { return { ok: false, erro: 'Informe o nome da categoria.' }; }

    var lista = ler(CHAVES.categorias);
    var repetida = lista.some(function (c) {
      return c.nome.toLowerCase() === limpo.toLowerCase();
    });
    if (repetida) { return { ok: false, erro: 'Já existe uma categoria com esse nome.' }; }

    lista.push({ id: proximoId(lista), nome: limpo });
    gravar(CHAVES.categorias, lista);
    return { ok: true };
  }

  function removerCategoria(id) {
    var emUso = ler(CHAVES.produtos).some(function (p) { return p.idCategoria === id; });
    if (emUso) {
      return { ok: false, erro: 'Esta categoria está sendo usada por um ou mais produtos.' };
    }
    gravar(CHAVES.categorias, ler(CHAVES.categorias).filter(function (c) { return c.id !== id; }));
    return { ok: true };
  }

  function nomeCategoria(id) {
    var nome = 'Sem categoria';
    listarCategorias().forEach(function (c) { if (c.id === id) { nome = c.nome; } });
    return nome;
  }

  /* ---------------------------- tb_produto ------------------------------- */

  /* RF04 - consulta de produtos com busca por nome e filtro por categoria. */
  function listarProdutos(filtro) {
    filtro = filtro || {};
    var termo = String(filtro.termo || '').trim().toLowerCase();

    return ler(CHAVES.produtos)
      .filter(function (p) {
        if (termo && p.nome.toLowerCase().indexOf(termo) === -1) { return false; }
        if (filtro.idCategoria && p.idCategoria !== filtro.idCategoria) { return false; }
        if (filtro.somenteAlerta && p.estoque > p.estoqueMinimo) { return false; }
        return true;
      })
      .sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
  }

  function buscarProduto(id) {
    var achado = null;
    ler(CHAVES.produtos).forEach(function (p) { if (p.id === id) { achado = p; } });
    return achado;
  }

  /* RF02 e RF03 - cadastro, edicao e exclusao de produtos. */
  function salvarProduto(dados) {
    var nome = String(dados.nome || '').trim();
    var preco = Number(dados.preco);
    var estoque = Number(dados.estoque);
    var minimo = Number(dados.estoqueMinimo);

    if (!nome) { return { ok: false, erro: 'Informe o nome do produto.' }; }
    if (!dados.idCategoria) { return { ok: false, erro: 'Selecione a categoria do produto.' }; }
    if (!(preco > 0)) { return { ok: false, erro: 'O preço de venda deve ser maior que zero.' }; }
    if (!(estoque >= 0) || estoque % 1 !== 0) {
      return { ok: false, erro: 'A quantidade em estoque deve ser um número inteiro.' };
    }
    if (!(minimo >= 0) || minimo % 1 !== 0) {
      return { ok: false, erro: 'O estoque mínimo deve ser um número inteiro.' };
    }

    var lista = ler(CHAVES.produtos);
    var repetido = lista.some(function (p) {
      return p.nome.toLowerCase() === nome.toLowerCase() && p.id !== dados.id;
    });
    if (repetido) { return { ok: false, erro: 'Já existe um produto cadastrado com esse nome.' }; }

    if (dados.id) {
      lista = lista.map(function (p) {
        if (p.id !== dados.id) { return p; }
        return {
          id: p.id, nome: nome, idCategoria: dados.idCategoria,
          preco: preco, estoque: estoque, estoqueMinimo: minimo,
          criadoEm: p.criadoEm
        };
      });
    } else {
      lista.push({
        id: proximoId(lista), nome: nome, idCategoria: dados.idCategoria,
        preco: preco, estoque: estoque, estoqueMinimo: minimo,
        criadoEm: new Date().toISOString()
      });
    }

    gravar(CHAVES.produtos, lista);
    return { ok: true };
  }

  function removerProduto(id) {
    if (!ehAdministrador()) {
      return { ok: false, erro: 'Somente o perfil administrador pode excluir produtos.' };
    }
    gravar(CHAVES.produtos, ler(CHAVES.produtos).filter(function (p) { return p.id !== id; }));
    return { ok: true };
  }

  /* RF08 - produtos que atingiram a quantidade minima em estoque. */
  function produtosEmAlerta() {
    return listarProdutos({ somenteAlerta: true }).sort(function (a, b) {
      return (a.estoque - a.estoqueMinimo) - (b.estoque - b.estoqueMinimo);
    });
  }

  /* ------------------- tb_venda e tb_item_venda -------------------------- */

  function listarVendas() {
    return ler(CHAVES.vendas).sort(function (a, b) {
      return new Date(b.data) - new Date(a.data);
    });
  }

  /* RF05, RF06, RF07 e RNF06 - registro da venda, calculo do total e baixa
     automatica no estoque, sem permitir quantidade acima do disponivel. */
  function registrarVenda(itens, formaPagamento) {
    if (!itens || !itens.length) {
      return { ok: false, erro: 'Adicione ao menos um produto à venda.' };
    }
    if (!formaPagamento) {
      return { ok: false, erro: 'Selecione a forma de pagamento.' };
    }

    var produtos = ler(CHAVES.produtos);
    var erro = null;
    var total = 0;
    var registrados = [];

    itens.forEach(function (item) {
      var produto = null;
      produtos.forEach(function (p) { if (p.id === item.idProduto) { produto = p; } });

      if (!produto) { erro = 'Produto não encontrado no estoque.'; return; }
      if (item.quantidade < 1) { erro = 'A quantidade deve ser de ao menos uma unidade.'; return; }
      if (item.quantidade > produto.estoque) {
        erro = 'Estoque insuficiente para ' + produto.nome + ': restam ' +
               produto.estoque + ' unidade(s).';
        return;
      }

      var subtotal = produto.preco * item.quantidade;
      total += subtotal;
      registrados.push({
        idProduto: produto.id,
        nome: produto.nome,
        precoUnitario: produto.preco,
        quantidade: item.quantidade,
        subtotal: subtotal
      });
    });

    if (erro) { return { ok: false, erro: erro }; }

    /* baixa automatica no estoque (RF06) */
    produtos = produtos.map(function (p) {
      var vendido = 0;
      registrados.forEach(function (i) { if (i.idProduto === p.id) { vendido = i.quantidade; } });
      return vendido ? Object.assign({}, p, { estoque: p.estoque - vendido }) : p;
    });
    gravar(CHAVES.produtos, produtos);

    var vendas = ler(CHAVES.vendas);
    var sessao = sessaoAtual() || {};
    var venda = {
      id: proximoId(vendas),
      numero: 1000 + proximoId(vendas),
      data: new Date().toISOString(),
      total: Math.round(total * 100) / 100,
      formaPagamento: formaPagamento,
      idUsuario: sessao.id || null,
      operador: sessao.nome || 'Operador',
      itens: registrados
    };
    vendas.push(venda);
    gravar(CHAVES.vendas, vendas);

    return { ok: true, venda: venda };
  }

  function proximoNumeroVenda() {
    return 1000 + proximoId(ler(CHAVES.vendas));
  }

  /* ----------------------- consultas agregadas --------------------------- */

  function mesmoDia(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  function vendasDoDia() {
    var hoje = new Date();
    return listarVendas().filter(function (v) { return mesmoDia(new Date(v.data), hoje); });
  }

  function vendasNoPeriodo(inicio, fim) {
    return listarVendas().filter(function (v) {
      var d = new Date(v.data);
      return d >= inicio && d <= fim;
    });
  }

  /* Indicadores do dashboard (RF09). */
  function resumoDashboard() {
    var doDia = vendasDoDia();
    var receita = doDia.reduce(function (s, v) { return s + v.total; }, 0);
    return {
      produtos: ler(CHAVES.produtos).length,
      vendasHoje: doDia.length,
      receitaHoje: receita,
      emAlerta: produtosEmAlerta().length
    };
  }

  /* RF09 e RF10 - relatorio de vendas por periodo. */
  function relatorio(periodo) {
    var fim = new Date();
    var inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    if (periodo === 'semana') { inicio.setDate(inicio.getDate() - 6); }
    if (periodo === 'mes') { inicio.setDate(1); }

    var vendas = vendasNoPeriodo(inicio, fim);
    var faturamento = vendas.reduce(function (s, v) { return s + v.total; }, 0);

    /* serie diaria para o grafico de barras */
    var dias = [];
    var cursor = new Date(inicio);
    while (cursor <= fim) {
      var doDia = vendas.filter(function (v) { return mesmoDia(new Date(v.data), cursor); });
      dias.push({
        data: new Date(cursor),
        valor: doDia.reduce(function (s, v) { return s + v.total; }, 0)
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    /* ranking de produtos mais vendidos */
    var mapa = {};
    vendas.forEach(function (v) {
      v.itens.forEach(function (i) {
        mapa[i.nome] = (mapa[i.nome] || 0) + i.quantidade;
      });
    });
    var maisVendidos = Object.keys(mapa)
      .map(function (nome) { return { nome: nome, quantidade: mapa[nome] }; })
      .sort(function (a, b) { return b.quantidade - a.quantidade; })
      .slice(0, 5);

    return {
      inicio: inicio,
      fim: fim,
      vendas: vendas,
      faturamento: faturamento,
      quantidade: vendas.length,
      ticketMedio: vendas.length ? faturamento / vendas.length : 0,
      dias: dias,
      maisVendidos: maisVendidos
    };
  }

  /* ------------------- carga inicial de demonstracao --------------------- */

  /* Cria os usuarios de acesso e um estoque de exemplo na primeira execucao,
     para que as telas nao apareçam vazias durante a apresentacao. */
  function semear() {
    if (!ler(CHAVES.usuarios).length) {
      gravar(CHAVES.usuarios, [
        { id: 1, nome: 'Matheus Lima Avelino Barros', login: 'matheus.barros',
          senha: cifrar('admin123'), perfil: 'administrador' },
        { id: 2, nome: 'Mariana Gomes', login: 'mariana.gomes',
          senha: cifrar('venda123'), perfil: 'operador' }
      ]);
    }

    if (!ler(CHAVES.categorias).length) {
      gravar(CHAVES.categorias, [
        { id: 1, nome: 'Eletrônicos' },
        { id: 2, nome: 'Acessórios' },
        { id: 3, nome: 'Cabos' },
        { id: 4, nome: 'Periféricos' }
      ]);
    }

    if (!ler(CHAVES.produtos).length) {
      gravar(CHAVES.produtos, [
        { id: 1, nome: 'Notebook Dell Inspiron 15', idCategoria: 1, preco: 3500.00, estoque: 15, estoqueMinimo: 5 },
        { id: 2, nome: 'Mouse Logitech M170', idCategoria: 2, preco: 120.00, estoque: 45, estoqueMinimo: 10 },
        { id: 3, nome: 'Teclado Mecânico RGB', idCategoria: 2, preco: 450.00, estoque: 8, estoqueMinimo: 10 },
        { id: 4, nome: 'Monitor LG 24 polegadas', idCategoria: 1, preco: 899.00, estoque: 12, estoqueMinimo: 4 },
        { id: 5, nome: 'Cabo HDMI 2m', idCategoria: 3, preco: 39.90, estoque: 6, estoqueMinimo: 15 },
        { id: 6, nome: 'Webcam Full HD', idCategoria: 4, preco: 289.00, estoque: 8, estoqueMinimo: 8 },
        { id: 7, nome: 'Headset Gamer HyperX', idCategoria: 2, preco: 320.00, estoque: 22, estoqueMinimo: 5 },
        { id: 8, nome: 'Impressora Multifuncional', idCategoria: 1, preco: 1150.00, estoque: 4, estoqueMinimo: 2 }
      ]);
    }

    if (!ler(CHAVES.vendas).length) {
      semearVendas();
    }
  }

  /* Gera um historico de vendas dos ultimos 30 dias para que o dashboard e os
     relatorios tenham dados desde a primeira execucao. */
  function semearVendas() {
    var produtos = ler(CHAVES.produtos);
    var vendas = [];
    var numero = 1000;

    for (var d = 29; d >= 0; d--) {
      var quantasVendas = 1 + Math.floor(((d * 7 + 3) % 5));
      for (var v = 0; v < quantasVendas; v++) {
        var data = new Date();
        data.setDate(data.getDate() - d);
        data.setHours(9 + ((v * 3) % 9), (v * 17) % 60, 0, 0);

        var itens = [];
        var total = 0;
        var quantosItens = 1 + ((d + v) % 3);
        for (var i = 0; i < quantosItens; i++) {
          var p = produtos[(d + v + i * 3) % produtos.length];
          if (itens.some(function (it) { return it.idProduto === p.id; })) { continue; }
          var qt = 1 + ((d + i) % 3);
          var sub = p.preco * qt;
          total += sub;
          itens.push({ idProduto: p.id, nome: p.nome, precoUnitario: p.preco,
                       quantidade: qt, subtotal: sub });
        }

        numero++;
        vendas.push({
          id: vendas.length + 1,
          numero: numero,
          data: data.toISOString(),
          total: Math.round(total * 100) / 100,
          formaPagamento: FORMAS_PAGAMENTO[(d + v) % FORMAS_PAGAMENTO.length],
          idUsuario: ((d + v) % 2) + 1,
          operador: ((d + v) % 2) === 0 ? 'Matheus Lima Avelino Barros' : 'Mariana Gomes',
          itens: itens
        });
      }
    }

    gravar(CHAVES.vendas, vendas);
  }

  /* ------------------------------ interface ------------------------------ */
  return {
    FORMAS_PAGAMENTO: FORMAS_PAGAMENTO,
    autenticar: autenticar,
    abrirSessao: abrirSessao,
    sessaoAtual: sessaoAtual,
    encerrarSessao: encerrarSessao,
    ehAdministrador: ehAdministrador,
    listarCategorias: listarCategorias,
    salvarCategoria: salvarCategoria,
    removerCategoria: removerCategoria,
    nomeCategoria: nomeCategoria,
    listarProdutos: listarProdutos,
    buscarProduto: buscarProduto,
    salvarProduto: salvarProduto,
    removerProduto: removerProduto,
    produtosEmAlerta: produtosEmAlerta,
    listarVendas: listarVendas,
    registrarVenda: registrarVenda,
    proximoNumeroVenda: proximoNumeroVenda,
    vendasDoDia: vendasDoDia,
    resumoDashboard: resumoDashboard,
    relatorio: relatorio,
    semear: semear
  };
})();
