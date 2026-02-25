function setTab(type) {
    const tabs = document.querySelectorAll('.tab');
    const btn = document.getElementById('main-btn');
    
    // Quitar activo de todas las pestañas
    tabs.forEach(t => t.classList.remove('active'));
    
    if(type === 'login') {
        tabs[0].classList.add('active');
        btn.innerText = 'Entrar a mi Cuenta';
    } else {
        tabs[1].classList.add('active');
        btn.innerText = 'Crear Cuenta Nueva';
    }
}
// Aquí puedes agregar más lógica en el futuro, 
// como la validación del formulario de registro.