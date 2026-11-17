// App.jsx => Controla cadastro, login e lançamentos.

import { useState } from 'react';
import Cadastro from './components/Cadastro.jsx';
import Login from './components/Login.jsx';
import Lancamentos from './components/Lancamentos.jsx';

function App() {
  const [tela, setTela] = useState('cadastro');

  function sair() {
    localStorage.removeItem('token');
    setTela('login');
  }

  return (
    <>
      {tela === 'cadastro' && <Cadastro />}

      {tela === 'login' && (
        <Login aoLogar={() => setTela('lancamentos')} />
      )}

      {tela === 'lancamentos' && <Lancamentos />}

      {tela === 'cadastro' && (
        <button type="button" onClick={() => setTela('login')}>
          Já tenho conta
        </button>
      )}

      {tela === 'login' && (
        <button type="button" onClick={() => setTela('cadastro')}>
          Quero criar uma conta
        </button>
      )}

      {tela === 'lancamentos' && (
        <button type="button" onClick={sair}>
          Sair
        </button>
      )}
    </>
  );
}

export default App;