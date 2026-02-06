// public/js/permissoes.js
function aplicarPermissoes(perfil) {
  document.querySelectorAll('[data-perfil]').forEach(el => {
    const permitido = el.dataset.perfil.split(',');
    if (!permitido.includes(perfil)) {
      el.style.display = 'none';
    }
  });
}
