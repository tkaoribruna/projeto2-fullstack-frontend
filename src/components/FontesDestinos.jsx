// FontesDestinos.jsx => Cadastra, lista, edita e exclui fontes e destinos.

import { useState } from 'react';

const API = 'http://localhost:3000/api';

const INICIAL = {
  nome: '',
  tipo: 'conta',
  diaFechamento: '',
  diaVencimento: '',
  limite: '',
};

const NOMES_TIPOS = {
  renda: 'Renda',
  conta: 'Conta',
  cartao_credito: 'Cartão de crédito',
};

async function requisitar(caminho, opcoes = {}) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Faça login novamente.');
  }

  const resposta = await fetch(`${API}/fontes-destinos${caminho}`, {
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

function formatarValor(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function FontesDestinos() {
  const [fontes, setFontes] = useState([]);
  const [formulario, setFormulario] = useState(INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [fontesCarregadas, setFontesCarregadas] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const editando = editandoId !== null;
  const cartaoCredito = formulario.tipo === 'cartao_credito';

  async function carregar() {
    setCarregando(true);
    setErro('');

    try {
      const dados = await requisitar('');
      setFontes(Array.isArray(dados) ? dados : []);
      setFontesCarregadas(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  function alterar(evento) {
    const { name, value } = evento.target;
    setFormulario(atual => ({ ...atual, [name]: value }));
  }

  function editar(fonte) {
    setEditandoId(fonte.id);
    setFormulario({
      nome: fonte.nome,
      tipo: fonte.tipo,
      diaFechamento: fonte.diaFechamento ?? '',
      diaVencimento: fonte.diaVencimento ?? '',
      limite: fonte.limite ?? '',
    });
    setErro('');
    setSucesso('');
    document.getElementById('fonte-nome')?.focus();
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setFormulario(INICIAL);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      await requisitar(editando ? `/${editandoId}` : '', {
        method: editando ? 'PUT' : 'POST',
        body: JSON.stringify({
          nome: formulario.nome.trim(),
          tipo: formulario.tipo,
          diaFechamento: cartaoCredito ? Number(formulario.diaFechamento) : null,
          diaVencimento: cartaoCredito ? Number(formulario.diaVencimento) : null,
          limite: cartaoCredito ? Number(formulario.limite) : null,
        }),
      });

      cancelarEdicao();
      setSucesso(editando
        ? 'Fonte/destino atualizada com sucesso.'
        : 'Fonte/destino cadastrada com sucesso.');
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(fonte) {
    if (!window.confirm(`Excluir "${fonte.nome}"?`)) return;

    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      await requisitar(`/${fonte.id}`, { method: 'DELETE' });

      if (editandoId === fonte.id) cancelarEdicao();

      setSucesso('Fonte/destino excluída com sucesso.');
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main>
      <h1>Fontes e destinos</h1>

      {erro && <p role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}
      {sucesso && <p role="status" style={{ color: '#1e3a8a' }}>{sucesso}</p>}

      <h2>{editando ? 'Editar fonte/destino' : 'Cadastrar fonte/destino'}</h2>

      <form onSubmit={salvar}>
        <div>
          <label htmlFor="fonte-nome">Nome</label>
          <input
            id="fonte-nome"
            name="nome"
            value={formulario.nome}
            onChange={alterar}
            maxLength={60}
            required
          />
        </div>

        <div>
          <label htmlFor="fonte-tipo">Tipo</label>
          <select
            id="fonte-tipo"
            name="tipo"
            value={formulario.tipo}
            onChange={alterar}
          >
            <option value="renda">Renda</option>
            <option value="conta">Conta</option>
            <option value="cartao_credito">Cartão de crédito</option>
          </select>
        </div>

        {cartaoCredito && (
          <>
            <div>
              <label htmlFor="diaFechamento">Dia de fechamento (1–31)</label>
              <input
                id="diaFechamento"
                name="diaFechamento"
                type="number"
                min="1"
                max="31"
                step="1"
                value={formulario.diaFechamento}
                onChange={alterar}
                required
              />
            </div>

            <div>
              <label htmlFor="diaVencimento">Dia de vencimento (1–31)</label>
              <input
                id="diaVencimento"
                name="diaVencimento"
                type="number"
                min="1"
                max="31"
                step="1"
                value={formulario.diaVencimento}
                onChange={alterar}
                required
              />
            </div>

            <div>
              <label htmlFor="limite">Limite (R$)</label>
              <input
                id="limite"
                name="limite"
                type="number"
                min="0.01"
                max="9999999999.99"
                step="0.01"
                value={formulario.limite}
                onChange={alterar}
                required
              />
            </div>
          </>
        )}

        <button type="submit" disabled={salvando}>
          {salvando ? 'Aguarde...' : editando ? 'Salvar alterações' : 'Cadastrar'}
        </button>

        {editando && (
          <button type="button" onClick={cancelarEdicao} disabled={salvando}>
            Cancelar edição
          </button>
        )}
      </form>

      <h2>Minhas fontes/destinos</h2>

      <button type="button" onClick={carregar} disabled={carregando || salvando}>
        {carregando ? 'Carregando...' : 'Atualizar lista'}
      </button>

      {!carregando && !fontesCarregadas && (
        <p>Atualize a lista para consultar as fontes/destinos cadastradas.</p>
      )}

      {!carregando && fontesCarregadas && fontes.length === 0 && (
        <p>Nenhuma fonte/destino cadastrada.</p>
      )}

      {!carregando && fontes.length > 0 && (
        <ul>
          {fontes.map(fonte => (
            <li key={fonte.id}>
              <strong>{fonte.nome}</strong> — {NOMES_TIPOS[fonte.tipo] ?? fonte.tipo}
              {fonte.tipo === 'cartao_credito' && (
                <span>
                  {' '}· Fechamento: {fonte.diaFechamento}
                  {' '}· Vencimento: {fonte.diaVencimento}
                  {' '}· Limite: {formatarValor(fonte.limite)}
                </span>
              )}

              <div className="acoes-lancamento">
                <button type="button" onClick={() => editar(fonte)} disabled={salvando}>
                  Editar
                </button>
                <button type="button" onClick={() => excluir(fonte)} disabled={salvando}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}