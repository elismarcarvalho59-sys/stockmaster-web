/* ==========================================================================
   login.js - Tela de entrada no sistema (RF01)
   ========================================================================== */

(function () {
  'use strict';

  Banco.semear();

  /* Quem ja tem sessao aberta vai direto para o dashboard. */
  if (Banco.sessaoAtual()) {
    window.location.replace('dashboard.html');
    return;
  }

  var formulario = document.getElementById('form-login');
  var campoLogin = document.getElementById('login');
  var campoSenha = document.getElementById('senha');
  var campoLembrar = document.getElementById('lembrar');
  var caixaErro = document.getElementById('erro');

  function mostrarErro(mensagem) {
    caixaErro.textContent = mensagem;
    caixaErro.classList.remove('oculto');
    campoLogin.classList.add('erro');
    campoSenha.classList.add('erro');
  }

  function limparErro() {
    caixaErro.classList.add('oculto');
    campoLogin.classList.remove('erro');
    campoSenha.classList.remove('erro');
  }

  campoLogin.addEventListener('input', limparErro);
  campoSenha.addEventListener('input', limparErro);

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    limparErro();

    var login = campoLogin.value.trim();
    var senha = campoSenha.value;

    if (!login || !senha) {
      mostrarErro('Informe o login e a senha para entrar.');
      return;
    }

    var usuario = Banco.autenticar(login, senha);
    if (!usuario) {
      mostrarErro('Login ou senha incorretos. Confira os dados e tente novamente.');
      campoSenha.value = '';
      campoSenha.focus();
      return;
    }

    Banco.abrirSessao(usuario, campoLembrar.checked);
    window.location.href = 'dashboard.html';
  });

  campoLogin.focus();
})();
