document.addEventListener('DOMContentLoaded', () => {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3 mt-5';
    toastContainer.style.zIndex = '9999';
    toastContainer.style.pointerEvents = 'none';
    toastContainer.id = 'global-toast-container';
    document.body.appendChild(toastContainer);

    const modalHtml = `
    <div class="modal fade" id="customConfirmModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-body p-4 text-center">
                    <i class="bi bi-exclamation-circle text-warning mb-3 d-block" style="font-size: 3.5rem;"></i>
                    <h5 class="mb-4 fw-bold text-dark" id="confirmModalText">Czy na pewno?</h5>
                    <div class="d-flex justify-content-center gap-2">
                        <button type="button" class="btn btn-light border px-4 rounded-pill" id="confirmModalBtnNo">Anuluj</button>
                        <button type="button" class="btn btn-primary px-4 rounded-pill" id="confirmModalBtnYes">Tak</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const dateModalHtml = `
    <div class="modal fade" id="customDateModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-body p-4 text-center">
                    <i class="bi bi-calendar-event text-primary mb-3 d-block" style="font-size: 3.5rem;"></i>
                    <h5 class="mb-3 fw-bold text-dark" id="dateModalText">Czas licytacji</h5>
                    <input type="datetime-local" class="form-control mb-4" id="customDateInput">
                    <div class="d-flex justify-content-center gap-2">
                        <button type="button" class="btn btn-light border px-4 rounded-pill" id="dateModalBtnCancel">Anuluj</button>
                        <button type="button" class="btn btn-primary px-4 rounded-pill" id="dateModalBtnConfirm">Wystaw</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', dateModalHtml);
});

window.pokazPowiadomienie = function(wiadomosc, typ = 'success') {
    const container = document.getElementById('global-toast-container');
    const toastEl = document.createElement('div');
    
    toastEl.style.pointerEvents = 'auto'; 
    toastEl.className = `toast align-items-center text-bg-${typ} border-0 mb-2 shadow-lg`;
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body fw-medium fs-6"><i class="bi bi-info-circle me-2"></i>${wiadomosc}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toastEl);
    
    const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
};

window.potwierdzAkcje = function(wiadomosc) {
    return new Promise((resolve) => {
        const modalEl = document.getElementById('customConfirmModal');
        document.getElementById('confirmModalText').innerText = wiadomosc;
        const modal = new bootstrap.Modal(modalEl);
        document.getElementById('confirmModalBtnYes').onclick = () => { modal.hide(); resolve(true); };
        document.getElementById('confirmModalBtnNo').onclick = () => { modal.hide(); resolve(false); };
        modal.show();
    });
};

window.zapytajODate = function(wiadomosc) {
    return new Promise((resolve) => {
        const modalEl = document.getElementById('customDateModal');
        document.getElementById('dateModalText').innerText = wiadomosc;
        const inputEl = document.getElementById('customDateInput');
        const modal = new bootstrap.Modal(modalEl);
        document.getElementById('dateModalBtnConfirm').onclick = () => { modal.hide(); resolve(inputEl.value); };
        document.getElementById('dateModalBtnCancel').onclick = () => { modal.hide(); resolve(null); };
        modal.show();
    });
};