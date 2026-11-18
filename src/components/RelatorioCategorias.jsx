import { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const CORES_GRAFICO = [
  '#2563eb', '#16a34a', '#dc2626', '#d97706', 
  '#7c3aed', '#0891b2', '#db2777', '#4b5563'
];

export default function RelatorioCategorias() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

  const [inicio, setInicio] = useState(primeiroDia);
  const [fim, setFim] = useState(ultimoDia);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const buscarRelatorio = async (e) => {
    if (e) e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const token = localStorage.getItem('token'); 
      const response = await fetch(
        `http://localhost:3000/api/relatorios/categorias?inicio=${inicio}&fim=${fim}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.erro || 'Erro ao buscar relatório.');
      }

      const json = await response.json();
      setDados(json);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const dadosGrafico = dados
    ? {
        labels: dados.categorias.map((c) => `${c.nome} (${c.percentual}%)`),
        datasets: [
          {
            data: dados.categorias.map((c) => c.total),
            backgroundColor: CORES_GRAFICO.slice(0, dados.categorias.length),
            borderWidth: 1
          }
        ]
      }
    : null;

  return (
    <main className="relatorio-categorias">
      <h2>Relatório por Categoria</h2>

      {/* Filtro de Período */}
      <form onSubmit={buscarRelatorio} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem' }}>Início</label>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem' }}>Fim</label>
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} required />
        </div>
        <button type="submit" disabled={carregando}>
          {carregando ? 'Carregando...' : 'Filtrar'}
        </button>
      </form>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {dados && (
        <>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>
            Comparando <strong>{dados.periodo.inicio} a {dados.periodo.fim}</strong> com o período anterior ({dados.periodoAnterior.inicio} a {dados.periodoAnterior.fim}).
          </p>

          {/* Seção de Saídas: Tabela + Gráfico */}
          <div className="categorias-conteudo">
            <div className="categorias-tabela">
              <h3>Saídas por Categoria — Total: {formatarMoeda(dados.totalSaidas)}</h3>
              {dados.categorias.length === 0 ? (
                <p>Nenhuma saída registrada neste período.</p>
              ) : (
                <div className="tabela-relatorio">
                <table>
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Total</th>
                      <th>%</th>
                      <th>Período Anterior</th>
                      <th>Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.categorias.map((cat) => {
                      const diff = cat.total - cat.periodoAnterior;
                      const corVariacao = diff > 0 ? '#dc2626' : diff < 0 ? '#16a34a' : '#6b7280';
                      const sinal = diff > 0 ? '▲ Aumento' : diff < 0 ? '▼ Redução' : '— Igual';

                      return (
                        <tr key={cat.id}>
                          <td>{cat.nome}</td>
                          <td>{formatarMoeda(cat.total)}</td>
                          <td>{cat.percentual}%</td>
                          <td>{formatarMoeda(cat.periodoAnterior)}</td>
                          <td style={{ color: corVariacao, fontWeight: 'bold' }}>
                            {sinal} ({formatarMoeda(Math.abs(diff))})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </div>

            <div className="categorias-grafico">
              {dados.categorias.length > 0 && <Doughnut data={dadosGrafico} />}
            </div>
          </div>

          {/* Seção de Entradas */}
          <div className="categorias-tabela categorias-entradas">
            <h3>Entradas por Categoria — Total: {formatarMoeda(dados.totalEntradas)}</h3>
            {dados.entradasPorCategoria.length === 0 ? (
              <p>Nenhuma entrada registrada neste período.</p>
            ) : (
              <div className="tabela-relatorio">
              <table>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.entradasPorCategoria.map((ent) => (
                    <tr key={ent.id}>
                      <td>{ent.nome}</td>
                      <td className="valor-entrada">{formatarMoeda(ent.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
