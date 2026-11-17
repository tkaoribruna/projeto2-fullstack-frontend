import { useCallback, useState } from 'react';

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

export default function FontesDestinos() {
  const [fontes, setFontes] = useState([]);
  const [formulario, setFormulario] = useState(INICIAL);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [fontesCarregadas, setFontesCarregadas] = useState(false);
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
      const dados = await requisitar('/fontes-destinos');
      setFontes(Array.isArray(dados) ? dados : []);
      setFontesCarregadas(true);
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

  async function cadastrar(evento) {
    evento.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    const cartaoCredito = formulario.tipo === 'cartao_credito';

    try {
      await requisitar('/fontes-destinos', {
        method: 'POST',
        body: JSON.stringify({
          nome: formulario.nome.trim(),
          tipo: formulario.tipo,
          diaFechamento: cartaoCredito
            ? Number(formulario.diaFechamento)
            : null,
          diaVencimento: cartaoCredito
            ? Number(formulario.diaVencimento)
            : null,
          limite: cartaoCredito ? Number(formulario.limite) : null,
        }),
      });

      setFormulario({ ...INICIAL });
      setSucesso('Fonte/destino cadastrada com sucesso.');
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
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
      <h1>Fontes e destinos</h1>

      <h2>Cadastrar fonte/destino</h2>
      <form onSubmit={cadastrar}>
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

        {formulario.tipo === 'cartao_credito' && (
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

        {erro && <p role="alert">{erro}</p>}
        {sucesso && <p role="status">{sucesso}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      <h2>Minhas fontes/destinos</h2>
      <button type="button" onClick={carregar} disabled={carregando}>
        {carregando ? 'Carregando...' : 'Atualizar lista'}
      </button>
      {carregando ? (
        <p>Carregando...</p>
      ) : fontesCarregadas && fontes.length === 0 ? (
        <p>Nenhuma fonte/destino cadastrada.</p>
      ) : !fontesCarregadas ? (
        <p>Atualize a lista para consultar as fontes/destinos cadastradas.</p>
      ) : (
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
