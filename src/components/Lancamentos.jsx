// Lancamentos.jsx => Gerencia e consulta lançamentos financeiros.

import { useCallback, useEffect, useState } from 'react';

const API = 'http://localhost:3000/api';
const ITENS_POR_PAGINA = 10;

const formularioInicial = {
  descricao: '',
  valor: '',
  tipo: 'saida',
  data: '',
  categoriaId: '',
  fonteDestinoId: '',
  totalParcelas: '1',
};

function filtrosDoMes() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const prefixo = `${ano}-${String(mes + 1).padStart(2, '0')}`;
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();

  return {
    inicio: `${prefixo}-01`,
    fim: `${prefixo}-${ultimoDia}`,
    tipo: '',
    categoriaId: '',
    fonteDestinoId: '',
  };
}

function formatarValor(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarData(data) {
  return String(data ?? '').slice(0, 10).split('-').reverse().join('/');
}

async function requisitar(caminho, opcoes = {}) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Faça login novamente.');
  }

  const resposta = await fetch(`${API}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (resposta.status === 204) return null;

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const detalhes = dados?.campos
      ? Object.values(dados.campos).join(' ')
      : '';

    throw new Error(detalhes || dados?.erro || `Erro ${resposta.status}`);
  }

  return dados;
}

export default function Lancamentos() {
  const [lancamentos, setLancamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fontes, setFontes] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editando, setEditando] = useState(null);
  const [filtros, setFiltros] = useState(filtrosDoMes);
  const [consulta, setConsulta] = useState(() => ({
    filtros: filtrosDoMes(),
    pagina: 1,
  }));
  const [paginacao, setPaginacao] = useState({ pagina: 1, totalPaginas: 0 });
  const [totais, setTotais] = useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const fonteSelecionada = fontes.find(
    fonte => String(fonte.id) === formulario.fonteDestinoId
  );

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');

    try {
      const parametros = new URLSearchParams({
        pagina: String(consulta.pagina),
        limite: String(ITENS_POR_PAGINA),
      });

      for (const [campo, valor] of Object.entries(consulta.filtros)) {
        if (valor) parametros.set(campo, valor);
      }

      const [lista, listaCategorias, listaFontes] = await Promise.all([
        requisitar(`/lancamentos?${parametros}`),
        requisitar('/categorias'),
        requisitar('/fontes-destinos'),
      ]);

      const ultimaPagina = Math.max(1, lista.paginacao.totalPaginas);

      if (consulta.pagina > ultimaPagina) {
        setConsulta(atual => ({ ...atual, pagina: ultimaPagina }));
        return;
      }

      setLancamentos(lista.lancamentos);
      setPaginacao(lista.paginacao);
      setTotais(lista.totais);
      setCategorias(
        Array.isArray(listaCategorias) ? listaCategorias : listaCategorias?.categorias ?? []
      );
      setFontes(Array.isArray(listaFontes) ? listaFontes : []);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [consulta]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function alterar(evento) {
    const { name, value } = evento.target;

    setFormulario(atual => ({
      ...atual,
      [name]: value,
      ...(name === 'tipo' ? { categoriaId: '' } : {}),
      ...(name === 'fonteDestinoId' &&
        fontes.find(fonte => String(fonte.id) === value)?.tipo !== 'cartao_credito'
        ? { totalParcelas: '1' }
        : {}),
    }));
  }

  function alterarFiltro(evento) {
    const { name, value } = evento.target;

    setFiltros(atuais => ({
      ...atuais,
      [name]: value,
      ...(name === 'tipo' ? { categoriaId: '' } : {}),
    }));
  }

  function aplicarFiltros(evento) {
    evento.preventDefault();

    if (filtros.inicio && filtros.fim && filtros.inicio > filtros.fim) {
      setErro('A data inicial deve ser anterior ou igual à data final.');
      return;
    }

    setSucesso('');
    setConsulta({ filtros: { ...filtros }, pagina: 1 });
  }

  function voltarAoMes() {
    const mes = filtrosDoMes();
    setFiltros(mes);
    setSucesso('');
    setConsulta({ filtros: mes, pagina: 1 });
  }

  function mudarPagina(pagina) {
    setConsulta(atual => ({ ...atual, pagina }));
  }

  function editar(item) {
    setEditando(item);
    setFormulario({
      descricao: item.descricao ?? '',
      valor: String(item.valor ?? ''),
      tipo: item.tipo,
      data: String(item.data ?? '').slice(0, 10),
      categoriaId: String(item.categoriaId ?? ''),
      fonteDestinoId: String(item.fonteDestinoId ?? ''),
      totalParcelas: '1',
    });
    setErro('');
    setSucesso('');
  }

  function cancelar() {
    setEditando(null);
    setFormulario(formularioInicial);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      const corpo = {
        descricao: formulario.descricao.trim(),
        valor: Number(formulario.valor).toFixed(2),
        tipo: formulario.tipo,
        data: formulario.data,
        categoriaId: Number(formulario.categoriaId),
        fonteDestinoId: Number(formulario.fonteDestinoId),
        totalParcelas: !editando && fonteSelecionada?.tipo === 'cartao_credito'
          ? Number(formulario.totalParcelas)
          : 1,
      };

      await requisitar(editando ? `/lancamentos/${editando.id}` : '/lancamentos', {
        method: editando ? 'PUT' : 'POST',
        body: JSON.stringify(corpo),
      });

      setSucesso(editando ? 'Lançamento atualizado!' : 'Lançamento cadastrado!');
      cancelar();
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(item) {
    let excluirTodas = false;

    if (item.grupoParcelamento) {
      const escolha = window.prompt(
        'Digite 1 para excluir só esta parcela ou 2 para excluir todas as parcelas da compra.'
      );

      if (escolha === null) return;

      if (escolha !== '1' && escolha !== '2') {
        setSucesso('');
        setErro('Digite 1 ou 2 para escolher o que excluir.');
        return;
      }

      excluirTodas = escolha === '2';
    } else if (!window.confirm('Excluir este lançamento?')) {
      return;
    }

    setErro('');
    setSucesso('');

    try {
      const sufixo = excluirTodas ? '?escopo=todas' : '';
      await requisitar(`/lancamentos/${item.id}${sufixo}`, { method: 'DELETE' });

      if (
        editando?.id === item.id ||
        (excluirTodas && editando?.grupoParcelamento === item.grupoParcelamento)
      ) {
        cancelar();
      }

      setSucesso(excluirTodas ? 'Parcelas excluídas!' : 'Lançamento excluído!');
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <main className="pagina-lancamentos">
      <h1>Lançamentos financeiros</h1>

      {erro && <p role="alert">{erro}</p>}
      {sucesso && <p role="status">{sucesso}</p>}

      <form onSubmit={salvar}>
        <h2>{editando ? 'Editar lançamento' : 'Novo lançamento'}</h2>

        <div>
          <label htmlFor="descricao">Descrição</label>
          <input
            id="descricao" name="descricao" value={formulario.descricao}
            onChange={alterar} maxLength={120} required
          />
        </div>

        <div>
          <label htmlFor="valor">Valor (R$)</label>
          <input
            id="valor" name="valor" type="number" min="0.01" step="0.01"
            value={formulario.valor} onChange={alterar} required
          />
        </div>

        <div>
          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" value={formulario.tipo} onChange={alterar}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        <div>
          <label htmlFor="data">Data</label>
          <input
            id="data" name="data" type="date" value={formulario.data}
            onChange={alterar} required
          />
        </div>

        <div>
          <label htmlFor="categoriaId">Categoria</label>
          <select
            id="categoriaId" name="categoriaId" value={formulario.categoriaId}
            onChange={alterar} required
          >
            <option value="">Selecione uma categoria</option>
            {categorias.filter(categoria => categoria.tipo === formulario.tipo).map(categoria => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fonteDestinoId">Fonte / Destino</label>
          <select
            id="fonteDestinoId" name="fonteDestinoId" value={formulario.fonteDestinoId}
            onChange={alterar} required
          >
            <option value="">Selecione uma fonte/destino</option>
            {fontes.map(fonte => (
              <option key={fonte.id} value={fonte.id}>{fonte.nome}</option>
            ))}
          </select>
        </div>

        {!editando && fonteSelecionada?.tipo === 'cartao_credito' && (
          <div>
            <label htmlFor="totalParcelas">Número de parcelas</label>
            <input
              id="totalParcelas" name="totalParcelas" type="number" min="1" max="48"
              step="1" value={formulario.totalParcelas} onChange={alterar} required
            />
          </div>
        )}

        <button type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar lançamento'}
        </button>

        {editando && (
          <button type="button" onClick={cancelar}>Cancelar edição</button>
        )}
      </form>

      <section className="lista-lancamentos">
        <h2>Meus lançamentos</h2>

        <form onSubmit={aplicarFiltros}>
          <div>
            <label htmlFor="filtroInicio">Data inicial</label>
            <input
              id="filtroInicio" name="inicio" type="date"
              value={filtros.inicio} onChange={alterarFiltro}
            />
          </div>

          <div>
            <label htmlFor="filtroFim">Data final</label>
            <input
              id="filtroFim" name="fim" type="date"
              value={filtros.fim} onChange={alterarFiltro}
            />
          </div>

          <div>
            <label htmlFor="filtroTipo">Tipo do lançamento</label>
            <select id="filtroTipo" name="tipo" value={filtros.tipo} onChange={alterarFiltro}>
              <option value="">Todos os tipos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>

          <div>
            <label htmlFor="filtroCategoria">Categoria</label>
            <select
              id="filtroCategoria" name="categoriaId"
              value={filtros.categoriaId} onChange={alterarFiltro}
            >
              <option value="">Todas as categorias</option>
              {categorias
                .filter(categoria => !filtros.tipo || categoria.tipo === filtros.tipo)
                .map(categoria => (
                  <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtroFonte">Fonte / Destino</label>
            <select
              id="filtroFonte" name="fonteDestinoId"
              value={filtros.fonteDestinoId} onChange={alterarFiltro}
            >
              <option value="">Todas as fontes/destinos</option>
              {fontes.map(fonte => (
                <option key={fonte.id} value={fonte.id}>{fonte.nome}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={carregando}>Filtrar</button>
          <button type="button" onClick={voltarAoMes} disabled={carregando}>
            Mês atual
          </button>
        </form>

        <button type="button" onClick={carregar} disabled={carregando}>
          Atualizar lista
        </button>

        {carregando ? (
          <p>Carregando...</p>
        ) : (
          <>
            <p>
              <strong>Entradas</strong> {formatarValor(totais.entradas)}
              {' · '}
              <strong>Saídas</strong> {formatarValor(totais.saidas)}
              {' · '}
              <strong>Saldo</strong> {formatarValor(totais.saldo)}
            </p>

            {lancamentos.length === 0 ? (
              <p>Nenhum lançamento encontrado.</p>
            ) : (
              <div className="tabela-lancamentos-scroll">
                <table className="tabela-lancamentos">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lancamentos.map(item => {
                      const cartaoCredito = fontes.find(
                        fonte => String(fonte.id) === String(item.fonteDestinoId)
                      )?.tipo === 'cartao_credito';
                      const totalParcelas = Number(item.totalParcelas) || 1;

                      return (
                        <tr key={item.id}>
                          <td>
                            {item.descricao}
                            {cartaoCredito && (
                              <small className="detalhe-parcelas">
                                {totalParcelas} {totalParcelas === 1 ? 'parcela' : 'parcelas'}
                                {totalParcelas > 1 &&
                                  ` · parcela ${item.parcelaAtual}/${totalParcelas}`}
                              </small>
                            )}
                          </td>
                          <td>{item.tipo}</td>
                          <td>{formatarValor(item.valor)}</td>
                          <td>{formatarData(item.data)}</td>
                          <td>
                            <div className="acoes-lancamento">
                              <button type="button" onClick={() => editar(item)}>Editar</button>
                              <button type="button" onClick={() => excluir(item)}>Excluir</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {paginacao.totalPaginas > 1 && (
              <div className="acoes-lancamento" aria-label="Paginação de lançamentos">
                <button
                  type="button"
                  disabled={paginacao.pagina <= 1}
                  onClick={() => mudarPagina(paginacao.pagina - 1)}
                >
                  Anterior
                </button>
                <span>Página {paginacao.pagina} de {paginacao.totalPaginas}</span>
                <button
                  type="button"
                  disabled={paginacao.pagina >= paginacao.totalPaginas}
                  onClick={() => mudarPagina(paginacao.pagina + 1)}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}