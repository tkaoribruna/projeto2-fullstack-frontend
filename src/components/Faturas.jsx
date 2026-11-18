// Faturas.jsx => Exibe a fatura atual, as próximas faturas e o limite de cada cartão.

import { useEffect, useState } from 'react';

const API = 'http://localhost:3000/api';

function formatarValor(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarData(data) {
  return data.split('-').reverse().join('/');
}

export default function Faturas() {
  const [cartoes, setCartoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregarFaturas() {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Faça login novamente.');
        }

        const resposta = await fetch(`${API}/relatorios/faturas?meses=3`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(dados.erro || 'Não foi possível carregar as faturas.');
        }

        setCartoes(dados.cartoes);
      } catch (erro) {
        setErro(erro.message);
      } finally {
        setCarregando(false);
      }
    }

    carregarFaturas();
  }, []);

  return (
    <main className="pagina-lancamentos">
      <h1>Faturas dos cartões</h1>

      {carregando && <p>Carregando faturas...</p>}
      {erro && <p role="alert">{erro}</p>}
      {!carregando && !erro && cartoes.length === 0 && (
        <p>Nenhum cartão de crédito cadastrado.</p>
      )}

      {cartoes.map(cartao => (
        <section key={cartao.id}>
          <h2>{cartao.nome}</h2>

          <p><strong>Limite cadastrado</strong> {formatarValor(cartao.limite)}</p>
          <p><strong>Limite utilizado</strong> {formatarValor(cartao.limiteUtilizado)}</p>
          <p><strong>Limite disponível</strong> {formatarValor(cartao.limiteDisponivel)}</p>

          {cartao.faturas.map(fatura => (
            <article key={fatura.fechamento}>
              <h3>
                {fatura.atual ? 'Fatura atual' : 'Fatura futura'}
                {' — '}
                {formatarData(fatura.vencimento)}
              </h3>

              <p>Fechamento em {formatarData(fatura.fechamento)}</p>
              <p><strong>Total</strong> {formatarValor(fatura.total)}</p>

              {fatura.lancamentos.length === 0 ? (
                <p>Nenhum lançamento nesta fatura.</p>
              ) : (
                <ul>
                  {fatura.lancamentos.map(item => (
                    <li key={item.id}>
                      {item.descricao}
                      {item.totalParcelas > 1 &&
                        ` — parcela ${item.parcelaAtual}/${item.totalParcelas}`}
                      {' — '}
                      {formatarValor(item.valor)}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}