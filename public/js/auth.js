// public/js/auth.js
async function protegerPagina(perfisPermitidos = []) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  const { data: funcionario } = await supabaseClient
    .from('funcionarios')
    .select('nome, perfil')
    .eq('id', session.user.id)
    .single();

  if (!funcionario) {
    alert('Usuário não encontrado');
    window.location.href = 'login.html';
    return null;
  }

  if (
    perfisPermitidos.length &&
    !perfisPermitidos.includes(funcionario.perfil)
  ) {
    alert('Acesso restrito');
    window.location.href = 'index.html';
    return null;
  }

  const el = document.getElementById('usuarioLogado');
  if (el) el.innerText = `${funcionario.nome} (${funcionario.perfil})`;

  return funcionario;
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}
