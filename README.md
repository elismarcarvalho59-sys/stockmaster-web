# StockMaster — Sistema de Controle de Estoque e Vendas

Projeto desenvolvido na disciplina **Projeto Integrador II** do curso de
Tecnologia em Sistemas para Internet — UESPI / UAPI (EAD).
Orientador: Esp. Mateus Abreu.

Este repositório contém o **front-end** do sistema, correspondente à
**Entrega 2**, na qual o protótipo aprovado na Entrega 1 foi transformado em um
projeto real, funcionando no navegador.

---

## Grupo 2 — Belém do Piauí

| Nº | Aluno(a) | E-mail |
|----|----------|--------|
| 01 | Matheus Lima Avelino Barros | mattslima@gmail.com |
| 02 | Elismar Francelina | elismarcarvalho59@gmail.com |
| 03 | Franciele Leal Gomes | lealgomesfranciele@gmail.com |
| 04 | José Abdias | joseabdiasdecarvalho@gmail.com |
| 05 | Kaenny Ribeiro | kaenny08rg@gmail.com |
| 06 | Mariana Gomes | marianacarvalho20166@gmail.com |

---

## Tecnologias front-end definidas

| Tecnologia | Aplicação no projeto |
|------------|----------------------|
| **HTML5** | Estrutura semântica das seis telas do sistema. |
| **CSS3** | Layout, identidade visual e responsividade. Usa variáveis CSS, Flexbox, Grid e *media queries*. |
| **JavaScript (ES5/ES6)** | Regras de negócio do front-end: autenticação, carrinho de venda, baixa no estoque, filtros e gráficos. |
| **SVG inline** | Ícones e gráfico de barras dos relatórios, desenhados no próprio código. |
| **Web Storage API** | Persistência local dos dados enquanto o backend não existe. |
| **Git e GitHub** | Versionamento e repositório remoto compartilhado pelo grupo. |
| **Visual Studio Code** | Editor utilizado no desenvolvimento. |

### Por que não usamos framework

O escopo desta etapa é composto por telas de formulário, listagem e relatório.
Usar HTML, CSS e JavaScript puros mantém o projeto **leve, sem instalação e sem
dependências**: qualquer integrante do grupo — ou o professor — abre o sistema
com um duplo clique no `index.html`, sem precisar rodar servidor, instalar
Node.js ou baixar pacotes.

---

## Como executar

Não é necessário instalar nada nem rodar servidor.

1. Baixe ou clone o repositório:
   ```bash
   git clone https://github.com/SEU-USUARIO/stockmaster-web.git
   ```
2. Abra a pasta do projeto.
3. Dê um duplo clique em **`index.html`** (ou clique com o botão direito →
   *Abrir com* → seu navegador).

### Acessos para avaliação

O sistema não possui auto-cadastro: conforme o escopo definido na documentação,
as contas são criadas pelo administrador — a tela de gerenciamento de usuários
(**RF12**) está no backlog para a Entrega 3. Para a avaliação desta entrega já
vêm dois acessos prontos, criados na carga inicial:

| Login | Senha | Perfil |
|-------|-------|--------|
| `matheus.barros` | `admin123` | administrador |
| `mariana.gomes` | `venda123` | operador |

> Na primeira execução o sistema cadastra automaticamente um estoque e um
> histórico de vendas de exemplo, para que o dashboard e os relatórios não
> apareçam vazios durante a apresentação.

---

## Estrutura do projeto

```
stockmaster-web/
├── index.html           → tela de login (RF01)
├── dashboard.html       → indicadores, alertas de estoque e últimas vendas
├── estoque.html         → consulta, busca, filtro, edição e exclusão de produtos
├── produto.html         → cadastro e edição de produto
├── vendas.html          → registro de venda e histórico
├── relatorios.html      → relatórios de vendas por período
├── css/
│   └── style.css        → folha de estilo única do projeto
└── js/
    ├── banco.js         → camada de acesso aos dados (isolada)
    ├── app.js           → funções compartilhadas por todas as telas
    ├── login.js
    ├── dashboard.js
    ├── estoque.js
    ├── produto.js
    ├── vendas.js
    └── relatorios.js
```

### Decisão de arquitetura

Todo o acesso a dados está concentrado em **`js/banco.js`**, que hoje grava no
armazenamento local do navegador seguindo exatamente a estrutura das tabelas
modeladas na documentação (`tb_usuario`, `tb_categoria`, `tb_produto`,
`tb_venda` e `tb_item_venda`).

Na **Entrega 3**, quando o backend e o banco relacional forem implementados,
será necessário alterar apenas o corpo das funções desse arquivo para que
passem a consumir a API. **As telas não precisarão ser modificadas.**

---

## Tarefas da Sprint Inicial implementadas

Tarefas retiradas da lista **Sprint Inicial** do quadro do grupo no Trello.
A atividade exigia no mínimo 4 tarefas; foram concluídas 6 das 7.

| # | Tarefa (cartão no Trello) | Requisito | Onde está | Situação |
|---|---------------------------|-----------|-----------|----------|
| 1 | Configurar o ambiente de desenvolvimento e o repositório | — | estrutura de pastas, `.gitignore`, `README.md` | ✅ Concluído |
| 2 | Modelar e implementar o banco de dados | RNF07 | `js/banco.js` (estrutura das tabelas) | 🔄 Em andamento |
| 3 | Desenvolver a tela de login e a autenticação | RF01 | `index.html`, `js/login.js` | ✅ Concluído |
| 4 | Implementar o cadastro de produtos | RF02 | `produto.html`, `js/produto.js` | ✅ Concluído |
| 5 | Implementar a edição e a exclusão de produtos | RF03 | `estoque.html`, `js/estoque.js` | ✅ Concluído |
| 6 | Desenvolver a tela de registro de vendas | RF05 | `vendas.html`, `js/vendas.js` | ✅ Concluído |
| 7 | Implementar a atualização automática do estoque | RF06 | `js/banco.js` → `registrarVenda()` | ✅ Concluído |

### Outros requisitos já atendidos nesta entrega

- **RF04** — consulta de produtos com busca por nome e filtro por categoria;
- **RF07** — cálculo automático do valor total da venda;
- **RF08** — alerta quando o produto atinge a quantidade mínima em estoque;
- **RF09** — relatórios de vendas por período, com gráfico e ranking de produtos;
- **RF10** — consulta do histórico de vendas realizadas;
- **RF11** — cadastro de categorias de produtos;
- **RNF01** — responsividade: layout de celular vira layout de desktop a partir de 760 px;
- **RNF04** — interface simples, seguindo o protótipo aprovado;
- **RNF05** — controle de acesso por perfil: somente o administrador exclui produtos;
- **RNF06** — bloqueio de venda com quantidade superior ao estoque disponível;
- **RNF08** — funciona em qualquer navegador atualizado, sem instalação.

Permanecem no **Backlog** para as próximas etapas: RF12 (gerenciamento de
usuários e perfis), exportação de relatórios em PDF e o backend com o banco
relacional.

---

## Validações implementadas

- Login e senha obrigatórios, com mensagem clara quando o acesso é negado;
- Nome do produto obrigatório e sem repetição no estoque;
- Preço de venda obrigatoriamente maior que zero;
- Quantidade e estoque mínimo obrigatoriamente inteiros e não negativos;
- Categoria obrigatória no cadastro do produto;
- Categoria em uso não pode ser removida;
- Venda exige ao menos um item e uma forma de pagamento;
- Quantidade vendida nunca ultrapassa o estoque disponível (RNF06);
- Confirmação em duas etapas antes de excluir um produto;
- Bloqueio de acesso às páginas internas sem sessão aberta;
- Escape de HTML nos textos digitados pelo usuário, evitando injeção de código.

---

## Links do projeto

- **Quadro no Trello:** https://trello.com/b/iZA2XD99
- **Documentação completa (PI II):** arquivo `StockMaster_PI2.docx` entregue na plataforma

---

## Próximos passos (Entrega 3)

- Implementar o backend e o banco de dados relacional;
- Substituir o armazenamento local por chamadas à API REST;
- Aplicar criptografia real de senha (bcrypt) e autenticação por token — RNF03;
- Implementar o gerenciamento de usuários e perfis (RF12);
- Continuar a evolução das telas e a atualização da documentação.
