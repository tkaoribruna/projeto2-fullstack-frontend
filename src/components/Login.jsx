// Login.jsx => Exibe o formulário de login do Controle Financeiro.

function Login() {
  function lidarComLogin(evento) {
    evento.preventDefault();
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
            required
          />
        </div>

        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}

export default Login;