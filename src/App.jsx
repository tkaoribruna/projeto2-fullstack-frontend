// App.jsx => Exibe a tela de cadastro do Controle Financeiro.

import Cadastro from './components/Cadastro.jsx';
import {useState} from 'react';
import Login from './components/Login.jsx';

function App() {
  const [tela, setTela] = useState('cadastro');
  const estaNoCadastro = tela === 'cadastro';


  return(
    <>
      {estaNoCadastro ? <Cadastro/> : <Login/>}

      <button typeof='button' onClick={() => setTela(estaNoCadastro ? 'login' : 'cadastro')}>
        {estaNoCadastro ? 'Já tenho conta' : 'Quero criar uma conta'}
      </button>

    </>  
  );
}

export default App;