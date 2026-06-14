// frontend/js/main.js - Inicjalizacja globalnych elementów UI
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link, .navbar-brand');
    const navbarCollapse = document.getElementById('mainNav');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) bsCollapse.hide();
            }
        });
    });

    // 1. WSTRZYKNIĘCIE GLOBALNEGO KONTENERA NA POWIADOMIENIA (NA GÓRZE)
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3 mt-2';
    toastContainer.style.zIndex = '9999';
    toastContainer.id = 'global-toast-container';
    document.body.appendChild(toastContainer);

    // 2. WSTRZYKNIĘCIE GLOBALNEGO MODALA POTWIERDZEŃ
    const modalHtml = `
    <div class="modal fade" id="customConfirmModal" tabindex="-1" aria-hidden="true" style="z-index: 9999;">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
                <div class="modal-body p-4 text-center">
                    <i class="bi bi-exclamation-circle text-warning mb-3 d-block" style="font-size: 3.5rem;"></i>
                    <h5 class="mb-4 fw-bold text-dark" id="confirmModalText">Czy na pewno?</h5>
                    <div class="d-flex justify-content-center gap-2">
                        <button type="button" class="btn btn-light border px-4 fw-medium rounded-pill" id="confirmModalBtnNo">Anuluj</button>
                        <button type="button" class="btn btn-primary px-4 fw-medium rounded-pill" id="confirmModalBtnYes">Tak, kontynuuj</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
});

// GLOBALNE FUNKCJE DOSTĘPNE DLA WSZYSTKICH MODUŁÓW
window.pokazPowiadomienie = function(wiadomosc, typ = 'success') {
    const container = document.getElementById('global-toast-container');
    if (!container) return alert(wiadomosc); // Zabezpieczenie
    
    let icon = 'bi-check-circle-fill';
    if (typ === 'danger') icon = 'bi-exclamation-triangle-fill';
    if (typ === 'warning') icon = 'bi-info-circle-fill';
    if (typ === 'secondary') icon = 'bi-box-arrow-right';

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${typ} border-0 mb-2 shadow-lg`;
    toastEl.style.borderRadius = '12px';
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
        <div class="d-flex p-1">
            <div class="toast-body fw-medium fs-6"><i class="bi ${icon} me-2"></i>${wiadomosc}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
};

window.potwierdzAkcje = function(wiadomosc) {
    return new Promise((resolve) => {
        const modalEl = document.getElementById('customConfirmModal');
        if (!modalEl) return resolve(confirm(wiadomosc)); // Zabezpieczenie
        
        document.getElementById('confirmModalText').innerText = wiadomosc;
        const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
        
        const btnYes = document.getElementById('confirmModalBtnYes');
        const btnNo = document.getElementById('confirmModalBtnNo');

        const cleanup = () => {
            btnYes.onclick = null;
            btnNo.onclick = null;
            modal.hide();
        };

        btnYes.onclick = () => { cleanup(); resolve(true); };
        btnNo.onclick = () => { cleanup(); resolve(false); };
        
        modal.show();
    });
};