// Dashboard.jsx => Mostra as entradas, as saídas e o saldo do mês atual.

import { useEffect, useState } from 'react';

function formatarValor(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function Dashboard() {
  const [totais, setTotais] = useState(null);
  const [erro, setErro] = useState('');

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;
  const prefixo = `${ano}-${String(mes).padStart(2, '0')}`;
  const inicio = `${prefixo}-01`;
  const fim = `${prefixo}-${new Date(ano, mes, 0).getDate()}`;

  useEffect(() => {
    async function carregarResumo() {
      try {
        const token = localStorage.getItem('token');
        const filtros = new URLSearchParams({
          inicio,
          fim,
          pagina: '1',
          limite: '1',
        });

        const resposta = await fetch(
          `http://localhost:3000/api/lancamentos?${filtros}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(dados.erro || 'Não foi possível carregar o resumo.');
        }

        setTotais(dados.totais);
      } catch (e) {
        setErro(e.message);
      }
    }

    carregarResumo();
  }, [inicio, fim]);

  const mesAtual = hoje.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  const mesAtualCapitalizado =
    mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

  return (
    <main className="dashboard-resumo">
      <h1>Resumo do mês</h1>
      <p>{mesAtualCapitalizado}</p>

      {erro && <p role="alert">{erro}</p>}
      {!totais && !erro && <p>Carregando resumo...</p>}

      {totais && (
        <div className="tabela-relatorio">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Entradas</td>
                <td className="valor-entrada">{formatarValor(totais.entradas)}</td>
              </tr>
              <tr>
                <td>Saídas</td>
                <td className="valor-saida">{formatarValor(totais.saidas)}</td>
              </tr>
              <tr>
                <td><strong>Saldo</strong></td>
                <td className={Number(totais.saldo) >= 0 ? 'valor-entrada' : 'valor-saida'}>
                  <strong>{formatarValor(totais.saldo)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
