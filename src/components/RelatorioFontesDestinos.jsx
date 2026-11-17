import { useState } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const API = 'http://localhost:3000/api';

function dataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

const NOMES_TIPOS = {
  renda: 'Renda',
  conta: 'Conta',
  cartao_credito: 'Cartão de crédito',
};

export default function RelatorioFontesDestinos() {
  const hoje = new Date();
  const [inicio, setInicio] = useState(
    dataLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  );
  const [fim, setFim] = useState(
    dataLocal(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0))
  );
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function buscarRelatorio(evento) {
    evento.preventDefault();
    setCarregando(true);
    setErro('');
    setDados(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Faça login novamente.');

      const parametros = new URLSearchParams({ inicio, fim });
      const resposta = await fetch(
        `${API}/relatorios/fontes-destinos?${parametros}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const resultado = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          resultado?.erro || `Erro ${resposta.status} ao buscar relatório.`
        );
      }

      setDados(resultado);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  const fontesDestinos = dados?.fontesDestinos ?? [];
  const entradasPorFonte = fontesDestinos
    .filter(item => Number(item.entradas) > 0)
    .sort((a, b) => Number(b.entradas) - Number(a.entradas));
  const saidasPorDestino = fontesDestinos
    .filter(item => Number(item.saidas) > 0)
    .sort((a, b) => Number(b.saidas) - Number(a.saidas));
  const contas = fontesDestinos.filter(item => item.tipo === 'conta');

  const grafico = {
    labels: fontesDestinos.map(
      item => `${item.nome} (${NOMES_TIPOS[item.tipo] ?? item.tipo})`
    ),
    datasets: [
      {
        label: 'Entradas',
        data: fontesDestinos.map(item => Number(item.entradas)),
        backgroundColor: '#16a34a',
      },
      {
        label: 'Saídas',
        data: fontesDestinos.map(item => Number(item.saidas)),
        backgroundColor: '#dc2626',
      },
    ],
  };

  return (
    <main className="relatorio-fontes">
      <h1>Relatório por fonte/destino</h1>
      <p>Consulte entradas, saídas e saldos no período selecionado.</p>

      <form onSubmit={buscarRelatorio}>
        <div>
          <label htmlFor="relatorio-inicio">Início</label>
          <input
            id="relatorio-inicio"
            type="date"
            value={inicio}
            onChange={evento => setInicio(evento.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="relatorio-fim">Fim</label>
          <input
            id="relatorio-fim"
            type="date"
            value={fim}
            onChange={evento => setFim(evento.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={carregando}>
          {carregando ? 'Carregando...' : 'Gerar relatório'}
        </button>
      </form>

      {erro && <p role="alert">{erro}</p>}

      {dados && (
        <section aria-label="Resultado do relatório">
          <p>
            Período: <strong>{dados.periodo.inicio}</strong> a{' '}
            <strong>{dados.periodo.fim}</strong>
          </p>

          {fontesDestinos.length === 0 ? (
            <p>Nenhuma fonte/destino cadastrada para este usuário.</p>
          ) : (
            <>
              <div className="resumo-relatorio">
                <article>
                  <h2>Total de entradas</h2>
                  <p>
                    {formatarMoeda(
                      fontesDestinos.reduce(
                        (total, item) => total + Number(item.entradas),
                        0
                      )
                    )}
                  </p>
                </article>
                <article>
                  <h2>Total de saídas</h2>
                  <p>
                    {formatarMoeda(
                      fontesDestinos.reduce(
                        (total, item) => total + Number(item.saidas),
                        0
                      )
                    )}
                  </p>
                </article>
              </div>

              <section className="grafico-relatorio">
                <h2>Entradas e saídas por fonte/destino</h2>
                <Bar
                  data={grafico}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </section>

              <h2>Entradas por fonte</h2>
              {entradasPorFonte.length === 0 ? (
                <p>Nenhuma entrada registrada no período.</p>
              ) : (
                <div className="tabela-relatorio">
                  <table>
                    <thead>
                      <tr>
                        <th>Fonte</th>
                        <th>Tipo</th>
                        <th>Total recebido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entradasPorFonte.map(item => (
                        <tr key={item.id}>
                          <td>{item.nome}</td>
                          <td>{NOMES_TIPOS[item.tipo] ?? item.tipo}</td>
                          <td>{formatarMoeda(item.entradas)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h2>Saídas por destino</h2>
              {saidasPorDestino.length === 0 ? (
                <p>Nenhuma saída registrada no período.</p>
              ) : (
                <div className="tabela-relatorio">
                  <table>
                    <thead>
                      <tr>
                        <th>Destino</th>
                        <th>Tipo</th>
                        <th>Total gasto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saidasPorDestino.map(item => (
                        <tr key={item.id}>
                          <td>{item.nome}</td>
                          <td>{NOMES_TIPOS[item.tipo] ?? item.tipo}</td>
                          <td>{formatarMoeda(item.saidas)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h2>Saldo das contas</h2>
              {contas.length === 0 ? (
                <p>Nenhuma fonte/destino do tipo conta cadastrada.</p>
              ) : (
                <div className="tabela-relatorio">
                  <table>
                    <thead>
                      <tr>
                        <th>Conta</th>
                        <th>Entradas</th>
                        <th>Saídas</th>
                        <th>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contas.map(item => (
                        <tr key={item.id}>
                          <td>{item.nome}</td>
                          <td>{formatarMoeda(item.entradas)}</td>
                          <td>{formatarMoeda(item.saidas)}</td>
                          <td>{formatarMoeda(item.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
