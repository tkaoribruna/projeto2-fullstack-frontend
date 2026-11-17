// Login.jsx => Realiza o login e armazena o token JWT.

import { useState } from 'react';

function Login({ aoLogar }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function lidarComLogin(evento) {
    evento.preventDefault();

    setErro('');
    setCarregando(true);

    try {
      const resposta = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao realizar login.');
      }

      localStorage.setItem('token', dados.token);

      aoLogar?.();

    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main>
      <h1>Entrar</h1>

      <form onSubmit={lidarComLogin}>
        <div>
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            required
          />
        </div>

        {erro && <p role="alert">{erro}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}

export default Login;