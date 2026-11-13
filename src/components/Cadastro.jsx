// Cadastro.jsx => Exibe o formulário e envia o cadastro para a API.

import { useState } from 'react';

function Cadastro() {
  const [erroSenha, setErroSenha] = useState('');
  const [errosCampos, setErrosCampos] = useState({});
  const [erroCadastro, setErroCadastro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function lidarComCadastro(evento) {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);
    const senha = dados.get('senha');

    setErroSenha('');
    setErrosCampos({});
    setErroCadastro('');
    setSucesso('');

    if (senha !== dados.get('confirmarSenha')) {
      setErroSenha('As senhas não coincidem.');
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch('http://localhost:3000/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        nome: dados.get('nome'),
        email: dados.get('email'),
        cpf: dados.get('cpf'),
        senha,
        confirmacaoSenha: dados.get('confirmarSenha'),
        }),
      });

      if (resposta.status === 201) {
        formulario.reset();
        setSucesso('Conta criada! Clique em “Já tenho conta” para entrar.');
        return;
      }

      const resultado = await resposta.json().catch(() => null);
      setErroCadastro(resultado?.erro || 'Não foi possível criar a conta.');
      setErrosCampos(resultado?.campos ?? {});
    } catch {
      setErroCadastro('Não foi possível conectar à API. Verifique se o backend está rodando.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main>
      <h1>Criar conta</h1>

      <form onSubmit={lidarComCadastro}>
        <div>
          <label htmlFor="nome">Nome</label>
          <input id="nome" name="nome" autoComplete="name" required />
          {errosCampos.nome && <span>{errosCampos.nome}</span>}
        </div>

        <div>
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          {errosCampos.email && <span>{errosCampos.email}</span>}
        </div>

        <div>
          <label htmlFor="cpf">CPF</label>
          <input id="cpf" name="cpf" inputMode="numeric" required />
          {errosCampos.cpf && <span>{errosCampos.cpf}</span>}
        </div>

        <div>
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            onChange={() => setErroSenha('')}
            required
          />
          {errosCampos.senha && <span>{errosCampos.senha}</span>}
        </div>

        <div>
          <label htmlFor="confirmarSenha">Confirmar senha</label>
          <input
            id="confirmarSenha"
            name="confirmarSenha"
            type="password"
            autoComplete="new-password"
            onChange={() => setErroSenha('')}
            aria-invalid={Boolean(erroSenha)}
            aria-describedby={erroSenha ? 'erro-senha' : undefined}
            required
          />
          {erroSenha && <span id="erro-senha" role="alert">{erroSenha}</span>}
        </div>

        {erroCadastro && <p role="alert">{erroCadastro}</p>}
        {sucesso && <p role="status">{sucesso}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
    </main>
  );
}

export default Cadastro;