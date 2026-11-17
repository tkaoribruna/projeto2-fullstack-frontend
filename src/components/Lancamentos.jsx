// Lancamentos.jsx => Gerencia lançamentos financeiros pela API.

import { useCallback, useEffect, useState } from 'react';

const API = 'http://localhost:3000/api';

const inicial = {
  descricao: '',
  valor: '',
  tipo: 'saida',
  data: '',
  categoriaId: '',
  fonteDestinoId: '',
  totalParcelas: '1',
};

export default function Lancamentos() {
  const [lancamentos, setLancamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fontes, setFontes] = useState([]);
  const [formulario, setFormulario] = useState(inicial);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const requisitar = useCallback(async (caminho, opcoes = {}) => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Faça login novamente.');
    }

    const resposta = await fetch(`${API}${caminho}`, {
      ...opcoes,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...opcoes.headers,
      },
    });

    if (resposta.status === 204) return null;

    const dados = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      const detalhes = dados?.campos
        ? Object.values(dados.campos).join(' ')
        : '';

      throw new Error(
        detalhes || dados?.erro || `Erro ${resposta.status}`
      );
    }

    return dados;
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');

    try {
      const [lista, listaCategorias, listaFontes] =
        await Promise.all([
          requisitar('/lancamentos'),
          requisitar('/categorias'),
          requisitar('/fontes-destinos'),
        ]);

      setLancamentos(
        Array.isArray(lista) ? lista : lista?.lancamentos ?? []
      );

      setCategorias(
        Array.isArray(listaCategorias)
          ? listaCategorias
          : listaCategorias?.categorias ?? []
      );

      setFontes(
        Array.isArray(listaFontes) ? listaFontes : []
      );
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [requisitar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function alterar(evento) {
    const { name, value } = evento.target;

    setFormulario(atual => ({
      ...atual,
      [name]: value,
      ...(name === 'tipo' ? { categoriaId: '' } : {}),
    }));
  }

  function editar(item) {
    setEditandoId(item.id);

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
    setEditandoId(null);
    setFormulario({ ...inicial });
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
        totalParcelas: editandoId
          ? 1
          : Number(formulario.totalParcelas),
      };

      await requisitar(
        editandoId
          ? `/lancamentos/${editandoId}`
          : '/lancamentos',
        {
          method: editandoId ? 'PUT' : 'POST',
          body: JSON.stringify(corpo),
        }
      );

      const mensagem = editandoId
        ? 'Lançamento atualizado!'
        : 'Lançamento cadastrado!';

      cancelar();
      await carregar();
      setSucesso(mensagem);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este lançamento?')) return;

    setErro('');
    setSucesso('');

    try {
      await requisitar(`/lancamentos/${id}`, {
        method: 'DELETE',
      });

      if (editandoId === id) cancelar();

      await carregar();
      setSucesso('Lançamento excluído!');
    } catch (e) {
      setErro(e.message);
    }
  }

  function formatarValor(valor) {
    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  return (
    <main>
      <h1>Lançamentos financeiros</h1>

      {erro && <p role="alert">{erro}</p>}
      {sucesso && <p role="status">{sucesso}</p>}

      <form onSubmit={salvar}>
        <h2>
          {editandoId ? 'Editar lançamento' : 'Novo lançamento'}
        </h2>

        <div>
          <label htmlFor="descricao">Descrição</label>
          <input
            id="descricao"
            name="descricao"
            value={formulario.descricao}
            onChange={alterar}
            maxLength={120}
            required
          />
        </div>

        <div>
          <label htmlFor="valor">Valor (R$)</label>
          <input
            id="valor"
            name="valor"
            type="number"
            min="0.01"
            step="0.01"
            value={formulario.valor}
            onChange={alterar}
            required
          />
        </div>

        <div>
          <label htmlFor="tipo">Tipo</label>
          <select
            id="tipo"
            name="tipo"
            value={formulario.tipo}
            onChange={alterar}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        <div>
          <label htmlFor="data">Data</label>
          <input
            id="data"
            name="data"
            type="date"
            value={formulario.data}
            onChange={alterar}
            required
          />
        </div>

        <div>
          <label htmlFor="categoriaId">Categoria</label>
          <select
            id="categoriaId"
            name="categoriaId"
            value={formulario.categoriaId}
            onChange={alterar}
            required
          >
            <option value="">Selecione uma categoria</option>

            {categorias
              .filter(c => c.tipo === formulario.tipo)
              .map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label htmlFor="fonteDestinoId">
            Fonte / Destino
          </label>
          <select
            id="fonteDestinoId"
            name="fonteDestinoId"
            value={formulario.fonteDestinoId}
            onChange={alterar}
            required
          >
            <option value="">Selecione uma fonte/destino</option>

            {fontes.map(f => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>

        {!editandoId && (
          <div>
            <label htmlFor="totalParcelas">
              Número de parcelas
            </label>
            <input
              id="totalParcelas"
              name="totalParcelas"
              type="number"
              min="1"
              max="48"
              step="1"
              value={formulario.totalParcelas}
              onChange={alterar}
              required
            />
          </div>
        )}

        <button type="submit" disabled={salvando}>
          {salvando
            ? 'Salvando...'
            : editandoId
              ? 'Salvar alterações'
              : 'Cadastrar lançamento'}
        </button>

        {editandoId && (
          <button type="button" onClick={cancelar}>
            Cancelar edição
          </button>
        )}
      </form>

      <h2>Meus lançamentos</h2>

      <button
        type="button"
        onClick={carregar}
        disabled={carregando}
      >
        Atualizar lista
      </button>

      {carregando ? (
        <p>Carregando...</p>
      ) : lancamentos.length === 0 ? (
        <p>Nenhum lançamento encontrado.</p>
      ) : (
        <table>
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
            {lancamentos.map(item => (
              <tr key={item.id}>
                <td>{item.descricao}</td>
                <td>{item.tipo}</td>
                <td>{formatarValor(item.valor)}</td>
                <td>
                  {String(item.data ?? '')
                    .slice(0, 10)
                    .split('-')
                    .reverse()
                    .join('/')}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => editar(item)}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => excluir(item.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}