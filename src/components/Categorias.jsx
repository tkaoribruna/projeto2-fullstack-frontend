import { useCallback, useState } from 'react';

const API = 'http://localhost:3000/api';

const INICIAL = {
  nome: '',
  tipo: 'saida',
};

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [formulario, setFormulario] = useState(INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [categoriasCarregadas, setCategoriasCarregadas] = useState(false);
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
      throw new Error(detalhes || dados?.erro || `Erro ${resposta.status}`);
    }

    return dados;
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');

    try {
      const dados = await requisitar('/categorias');
      setCategorias(Array.isArray(dados) ? dados : []);
      setCategoriasCarregadas(true);
      setErro('');
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [requisitar]);

  function alterar(evento) {
    const { name, value } = evento.target;
    setFormulario(atual => ({ ...atual, [name]: value }));
  }

  function editar(categoria) {
    setEditandoId(categoria.id);
    setFormulario({ nome: categoria.nome, tipo: categoria.tipo });
    setErro('');
    setSucesso('');
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setFormulario({ ...INICIAL });
    setErro('');
    setSucesso('');
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      await requisitar(
        editandoId ? `/categorias/${editandoId}` : '/categorias',
        {
          method: editandoId ? 'PUT' : 'POST',
          body: JSON.stringify({
            nome: formulario.nome.trim(),
            tipo: formulario.tipo,
          }),
        }
      );

      setEditandoId(null);
      setFormulario({ ...INICIAL });
      setSucesso(
        editandoId
          ? 'Categoria atualizada com sucesso.'
          : 'Categoria cadastrada com sucesso.'
      );
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(categoria) {
    if (!window.confirm(`Excluir a categoria "${categoria.nome}"?`)) return;

    setErro('');
    setSucesso('');

    try {
      await requisitar(`/categorias/${categoria.id}`, { method: 'DELETE' });
      setSucesso('Categoria excluída com sucesso.');
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <main>
      <h1>Categorias</h1>

      {erro && <p role="alert">{erro}</p>}
      {sucesso && <p role="status">{sucesso}</p>}

      <h2>{editandoId ? 'Editar categoria' : 'Nova categoria'}</h2>
      <form onSubmit={salvar}>
        <div>
          <label htmlFor="categoria-nome">Nome</label>
          <input
            id="categoria-nome"
            name="nome"
            value={formulario.nome}
            onChange={alterar}
            maxLength={60}
            required
          />
        </div>

        <div>
          <label htmlFor="categoria-tipo">Tipo</label>
          <select
            id="categoria-tipo"
            name="tipo"
            value={formulario.tipo}
            onChange={alterar}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        <button type="submit" disabled={salvando}>
          {salvando
            ? 'Salvando...'
            : editandoId
              ? 'Salvar alterações'
              : 'Cadastrar categoria'}
        </button>
        {editandoId && (
          <button type="button" onClick={cancelarEdicao}>
            Cancelar edição
          </button>
        )}
      </form>

      <h2>Minhas categorias</h2>
      <button type="button" onClick={carregar} disabled={carregando}>
        {carregando ? 'Carregando...' : 'Atualizar lista'}
      </button>
      {carregando ? (
        <p>Carregando...</p>
      ) : categoriasCarregadas && categorias.length === 0 ? (
        <p>Nenhuma categoria cadastrada.</p>
      ) : !categoriasCarregadas ? (
        <p>Atualize a lista para consultar as categorias cadastradas.</p>
      ) : (
        <table className="tabela-categorias">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(categoria => (
              <tr key={categoria.id}>
                <td>{categoria.nome}</td>
                <td>{categoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => editar(categoria)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => excluir(categoria)}
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
