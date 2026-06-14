// frontend/js/auctions.js - Dynamiczne renderowanie wielu aukcji
function pobierzDaneSesji() {
    const token = localStorage.getItem('jwt_token');
    const userString = localStorage.getItem('user_data');
    if (!token || !userString) return null;
    try { return JSON.parse(userString); } catch (e) { return null; }
}

async function pobierzWszystkieAukcje() {
    const user = pobierzDaneSesji();
    let url = '/aukcje';
    if (user) url += `?userId=${user.id}`;
    
    try {
        const response = await API.request(url, 'GET');
        if (response.success) renderAukcje(response.data, user);
    } catch (error) {
        document.getElementById('auctions-container').innerHTML = '<div class="alert alert-danger">Błąd pobierania danych.</div>';
    }
}

function renderAukcje(aukcje, user) {
    const container = document.getElementById('auctions-container');
    if (!container) return;
    container.innerHTML = '';

    if (aukcje.length === 0) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-info shadow-sm p-4 text-center"><i class="bi bi-info-circle fs-4 d-block mb-2 text-info"></i>Aktualnie nie ma żadnych nieruchomości wystawionych na licytację.</div></div>';
        return;
    }

    aukcje.forEach(aukcja => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-6 mb-4';

        let actionHtml = '';

        if (!user) {
            actionHtml = `<div class="alert alert-warning small mb-0 text-center"><i class="bi bi-shield-lock-fill text-warning me-1"></i> Zaloguj się, aby brać udział w aukcji.</div>`;
        } else if (user.rola === 'Admin') {
            actionHtml = `<div class="alert alert-secondary small mb-0 text-center">Konto Urzędnika nie może licytować.</div>`;
        } else {
            const status = aukcja.wadium_status || 'Brak';
            if (status === 'Brak') {
                actionHtml = `
                    <div class="d-grid">
                        <button class="btn btn-primary" onclick="zglosWadium(${aukcja.id}, ${user.id})">
                            <i class="bi bi-cash-coin me-1"></i> Opłać wadium (${parseFloat(aukcja.kwota_wadium).toLocaleString('pl-PL')} PLN)
                        </button>
                    </div>`;
            } else if (status === 'Oczekuje') {
                actionHtml = `<div class="alert alert-info small mb-0 text-center"><i class="bi bi-hourglass-split text-info me-1"></i> Oczekuje na zaksięgowanie wadium przez Urząd.</div>`;
            } else if (status === 'Zatwierdzone' || user.rola === 'Licytant') {
                actionHtml = `
                    <form class="p-3 bg-light rounded border border-success" onsubmit="licytuj(event, ${aukcja.id}, ${aukcja.aktualna_cena})">
                        <label class="form-label small fw-bold text-success mb-1"><i class="bi bi-unlock-fill me-1"></i>Panel Licytacji Odblokowany!</label>
                        <div class="input-group">
                            <input type="number" class="form-control" id="bid-input-${aukcja.id}" min="${parseFloat(aukcja.aktualna_cena) + 1}" placeholder="Min: ${parseFloat(aukcja.aktualna_cena) + 1}" required>
                            <button class="btn btn-success fw-bold" type="submit">Licytuj</button>
                        </div>
                    </form>`;
            }
        }

        col.innerHTML = `
            <div class="gov-card h-100 bg-white shadow-sm d-flex flex-column" style="border-radius: 12px; border: 1px solid #e5e7eb; padding: 1.5rem;">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="fw-bold text-primary mb-0">${aukcja.tytul}</h5>
                    <span class="badge bg-warning text-dark"><i class="bi bi-hammer me-1"></i>Aktywna</span>
                </div>
                <p class="small text-muted flex-grow-1">${aukcja.opis}</p>
                <div class="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded border">
                    <div>
                        <span class="d-block small text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Aktualna cena</span>
                        <span class="fs-4 fw-bold text-dark">${parseFloat(aukcja.aktualna_cena).toLocaleString('pl-PL')} <span class="fs-6 text-muted fw-normal">PLN</span></span>
                    </div>
                    <div class="text-end">
                        <span class="d-block small text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Wymagane wadium</span>
                        <span class="fw-medium text-dark">${parseFloat(aukcja.kwota_wadium).toLocaleString('pl-PL')} PLN</span>
                    </div>
                </div>
                ${actionHtml}
            </div>
        `;
        container.appendChild(col);
    });
}

window.zglosWadium = async function(aukcjaId, userId) {
    if(!confirm('Zaraz zostaniesz przekierowany do systemu płatności wadium. Kontynuować?')) return;
    try {
        await API.request(`/aukcje/${aukcjaId}/zglos-wadium`, 'POST', { id_uzytkownika: userId });
        alert('Wniosek i wpłata wadium zostały zarejestrowane. Czekaj na weryfikację urzędu (Administrator musi zatwierdzić wpłatę w panelu).');
        pobierzWszystkieAukcje();
    } catch(e) { alert('Błąd: ' + e.message); }
};

window.licytuj = async function(event, aukcjaId, aktualnaCena) {
    event.preventDefault();
    const input = document.getElementById(`bid-input-${aukcjaId}`);
    const kwota = parseFloat(input.value);
    const user = pobierzDaneSesji();

    if(kwota <= aktualnaCena) { alert('Twoja oferta musi być wyższa niż aktualna cena rynkowa!'); return; }
    try {
        const res = await API.request(`/aukcje/${aukcjaId}/bid`, 'POST', { id_licytanta: user.id, kwota_oferowana: kwota });
        if(res.success) { alert('Gratulacje! Twoja oferta została złożona poprawnie.'); pobierzWszystkieAukcje(); }
    } catch(e) { alert('Błąd odrzucenia oferty: ' + e.message); }
};

window.addEventListener('hashchange', () => { if (window.location.hash === '#aukcje') pobierzWszystkieAukcje(); });
document.addEventListener('DOMContentLoaded', () => { if (window.location.hash === '#aukcje' || !window.location.hash) pobierzWszystkieAukcje(); });