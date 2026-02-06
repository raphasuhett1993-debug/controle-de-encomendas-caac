// public/js/auditoria.js
let modalAuditoria;

document.addEventListener('DOMContentLoaded', async () => {
  const funcionario = await protegerPagina(['admin']);
  if (!funcionario) return;

  aplicarPermissoes(funcionario.perfil);

  modalAuditoria = new bootstrap.Modal(
    document.getElementById('modalAuditoria')
  );

  document
    .getElementById('filtroTabela')
    .addEventListener('change', carregarAuditoria);

  document
    .getElementById('filtroAcao')
    .addEventListener('change', carregarAuditoria);

  document
    .getElementById('filtroUsuario')
    .addEventListener('input', carregarAuditoria);

  carregarAuditoria();
});

async function carregarAuditoria() {
  const tabela = document.getElementById('filtroTabela').value;
  const acao = document.getElementById('filtroAcao').value;
  const usuario = document.getElementById('filtroUsuario').value.toLowerCase();

  let query = supabaseClient
    .from('auditoria')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(200);

  if (tabela) query = query.eq('tabela', tabela);
  if (acao) query = query.eq('acao', acao);

  const { data } = await query;
  const tbody = document.getElementById('tabela-auditoria');
  tbody.innerHTML = '';

  data
    .filter(a =>
      !usuario || (a.usuario_nome || '').toLowerCase().includes(usuario)
    )
    .forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(a.criado_em).toLocaleString('pt-BR')}</td>
        <td>${a.tabela}</td>
        <td>${a.acao}</td>
        <td>${a.usuario_nome || '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary">Ver</button>
        </td>
      `;

      tr.querySelector('button').addEventListener('click', () =>
        abrirModalAuditoria(a)
      );

      tbody.appendChild(tr);
    });
}

function abrirModalAuditoria(a) {
  document.getElementById('audUsuario').innerText = a.usuario_nome || '-';
  document.getElementById('audAcao').innerText = a.acao;
  document.getElementById('audTabela').innerText = a.tabela;
  document.getElementById('audRegistro').innerText = a.registro_id;
  document.getElementById('audData').innerText =
    new Date(a.criado_em).toLocaleString('pt-BR');

  modalAuditoria.show();
}
