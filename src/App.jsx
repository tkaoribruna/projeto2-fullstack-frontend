// App.jsx => Controla o acesso e a navegação entre as telas.

import { useState } from 'react';
import Cadastro from './components/Cadastro.jsx';
import Categorias from './components/Categorias.jsx';
import Dashboard from './components/Dashboard.jsx';
import FontesDestinos from './components/FontesDestinos.jsx';
import Login from './components/Login.jsx';
import Lancamentos from './components/Lancamentos.jsx';
import RelatorioCategorias from './components/RelatorioCategorias.jsx';
import RelatorioFontesDestinos from './components/RelatorioFontesDestinos.jsx';
import Faturas from './components/Faturas.jsx';

function App() {
  const [tela, setTela] = useState('cadastro');
  const telasAutenticadas = [
    'dashboard',
    'lancamentos',
    'categorias',
    'fontes',
    'relatorio',
    'relatorio-fontes',
    'faturas',
  ];
  const autenticado = telasAutenticadas.includes(tela);

  function sair() {
    localStorage.removeItem('token');
    setTela('login');
  }

  return (
    <div className={`app-shell${autenticado ? ' app-shell--autenticado' : ''}`}>
      {autenticado && (
        <nav className="menu-principal" aria-label="Menu principal">
          <button
            type="button"
            aria-current={tela === 'dashboard' ? 'page' : undefined}
            onClick={() => setTela('dashboard')}
          >
            Resumo
          </button>
          <button
            type="button"
            aria-current={tela === 'lancamentos' ? 'page' : undefined}
            onClick={() => setTela('lancamentos')}
          >
            Lançamentos
          </button>
          <button
            type="button"
            aria-current={tela === 'categorias' ? 'page' : undefined}
            onClick={() => setTela('categorias')}
          >
            Categorias
          </button>
          <button
            type="button"
            aria-current={tela === 'fontes' ? 'page' : undefined}
            onClick={() => setTela('fontes')}
          >
            Fontes/destinos
          </button>
          <button
            type="button"
            aria-current={tela === 'relatorio' ? 'page' : undefined}
            onClick={() => setTela('relatorio')}
          >
            Relatório categorias
          </button>
          <button
            type="button"
            aria-current={tela === 'relatorio-fontes' ? 'page' : undefined}
            onClick={() => setTela('relatorio-fontes')}
          >
            Relatório fontes/destinos
          </button>
          <button
            type="button"
            aria-current={tela === 'faturas' ? 'page' : undefined}
            onClick={() => setTela('faturas')}
          >
            Faturas
          </button>
          <button type="button" onClick={sair}>
            Sair
          </button>
        </nav>
      )}

      {tela === 'cadastro' && <Cadastro />}

      {tela === 'login' && (
        <Login aoLogar={() => setTela('dashboard')} />
      )}

      {tela === 'dashboard' && <Dashboard />}
      {tela === 'lancamentos' && <Lancamentos />}
      {tela === 'categorias' && <Categorias />}
      {tela === 'fontes' && <FontesDestinos />}
      {tela === 'relatorio' && <RelatorioCategorias />}
      {tela === 'relatorio-fontes' && <RelatorioFontesDestinos />}
      {tela === 'faturas' && <Faturas />}

      {tela === 'cadastro' && (
        <div className="auth-switch">
          <button type="button" onClick={() => setTela('login')}>
            Já tenho conta
          </button>
        </div>
      )}

      {tela === 'login' && (
        <div className="auth-switch">
          <button type="button" onClick={() => setTela('cadastro')}>
            Quero criar uma conta
          </button>
        </div>
      )}
    </div>
  );
}

export default App;