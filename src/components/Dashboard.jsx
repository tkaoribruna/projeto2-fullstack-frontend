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

  return (
    <main>
      <h1>Resumo do mês</h1>
      <p>{hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>

      {erro && <p role="alert">{erro}</p>}
      {!totais && !erro && <p>Carregando resumo...</p>}

      {totais && (
        <dl>
          <dt>Entradas</dt>
          <dd>{formatarValor(totais.entradas)}</dd>
          <dt>Saídas</dt>
          <dd>{formatarValor(totais.saidas)}</dd>
          <dt>Saldo</dt>
          <dd>{formatarValor(totais.saldo)}</dd>
        </dl>
      )}
    </main>
  );
}