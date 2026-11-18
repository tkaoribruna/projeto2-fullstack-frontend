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
    <main className="pagina-faturas">
      <h1>Faturas dos cartões</h1>

      {carregando && <p>Carregando faturas...</p>}
      {erro && <p role="alert">{erro}</p>}
      {!carregando && !erro && cartoes.length === 0 && (
        <p>Nenhum cartão de crédito cadastrado.</p>
      )}

      {cartoes.map(cartao => (
        <section className="cartao-faturas" key={cartao.id}>
          <div className="cartao-faturas-cabecalho">
            <h2>{cartao.nome}</h2>
          </div>

          <div className="limites-cartao">
            <table>
              <tbody>
                <tr>
                  <th scope="row">Limite cadastrado</th>
                  <td>{formatarValor(cartao.limite)}</td>
                </tr>
                <tr>
                  <th scope="row">Limite utilizado</th>
                  <td className="valor-saida">
                    {formatarValor(cartao.limiteUtilizado)}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Limite disponível</th>
                  <td className="valor-entrada">
                    {formatarValor(cartao.limiteDisponivel)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="lista-faturas">
            {cartao.faturas.map(fatura => (
              <article
                className={`fatura-card${fatura.atual ? ' fatura-card-atual' : ''}`}
                key={fatura.fechamento}
              >
                <div className="fatura-cabecalho">
                  <h3>
                    {fatura.atual ? 'Fatura atual' : 'Fatura futura'}
                  </h3>
                  <span>{formatarData(fatura.vencimento)}</span>
                </div>

                <dl className="fatura-dados">
                  <div>
                    <dt>Fechamento</dt>
                    <dd>{formatarData(fatura.fechamento)}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatarValor(fatura.total)}</dd>
                  </div>
                </dl>

                {fatura.lancamentos.length === 0 ? (
                  <p className="fatura-vazia">Nenhum lançamento nesta fatura.</p>
                ) : (
                  <div className="fatura-lancamentos">
                    <table>
                      <thead>
                        <tr>
                          <th>Descrição</th>
                          <th>Parcela</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fatura.lancamentos.map(item => (
                          <tr key={item.id}>
                            <td>{item.descricao}</td>
                            <td>
                              {item.totalParcelas > 1
                                ? `${item.parcelaAtual}/${item.totalParcelas}`
                                : '—'}
                            </td>
                            <td>{formatarValor(item.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
