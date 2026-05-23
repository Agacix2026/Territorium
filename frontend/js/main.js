// main.js - Odpowiada tylko za drobne interakcje (np. zamykanie menu mobilnego)
document.addEventListener('DOMContentLoaded', () => {
    
    const navLinks = document.querySelectorAll('.nav-link, .navbar-brand');
    const navbarCollapse = document.getElementById('mainNav');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // USUNIĘTO event.preventDefault() - pozwalamy przeglądarce normalnie zmienić adres URL!
            
            // Automatyczne zwijanie menu "hamburgera" po kliknięciu w link na telefonach
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            }
        });
    });
});