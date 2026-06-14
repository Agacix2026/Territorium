/**
 * Moduł Aukcji i Licytacji - Integracja API (Tydzień 6)
 * Autorzy: Weronika + Agata (Poprawki UX, stany oczekiwania i weryfikacja roli Licytanta)
 */

let aktualneAuctionId = parseInt(localStorage.getItem('selected_auction_id')) || 1;

let stanAukcji = {
    aktualnaCena: 0,
    uzytkownikZgloszony: false,
    wadiumOplacone: false
};

const bidInput = document.getElementById('bid-amount');
const bidButton = document.getElementById('btn-submit-bid');
const bidError = document.getElementById('bid-error-msg');
const btnRegister = document.getElementById('btn-register-auction');
const btnPayWadium = document.getElementById('btn-pay-wadium');
const stepRegister = document.getElementById('step-1');
const stepWadium = document.getElementById('step-2');
const stepBidForm = document.getElementById('step-3');

function pobierzDaneSesji() {
    const token = localStorage.getItem('jwt_token');
    const userString = localStorage.getItem('user_data');
    if (!token || !userString) return null;
    try {
        return JSON.parse(userString);
    } catch (e) {
        console.error('Błąd parsowania danych użytkownika', e);
        return null;
    }
}

function wczytajStanZgloszenia(userId, auctionId) {
    const klucz = `stan_aukcji_u${userId}_a${auctionId}`;
    const zapisanyStan = localStorage.getItem(klucz);
    if (zapisanyStan) {
        try {
            const parsed = JSON.parse(zapisanyStan);
            stanAukcji.uzytkownikZgloszony = parsed.uzytkownikZgloszony || false;
            stanAukcji.wadiumOplacone = parsed.wadiumOplacone || false;
        } catch (e) {
            console.error(e);
        }
    } else {
        stanAukcji.uzytkownikZgloszony = false;
        stanAukcji.wadiumOplacone = false;
    }
}

function zapiszStanZgloszenia(userId, auctionId) {
    const klucz = `stan_aukcji_u${userId}_a${auctionId}`;
    localStorage.setItem(klucz, JSON.stringify({
        uzytkownikZgloszony: stanAukcji.uzytkownikZgloszony,
        wadiumOplacone: stanAukcji.wadiumOplacone
    }));
}

async function pobierzDaneAukcji() {
    aktualneAuctionId = parseInt(localStorage.getItem('selected_auction_id')) || 1;
    
    try {
        const response = await API.request(`/aukcje/${aktualneAuctionId}`, 'GET');

        if (response.success) {
            const dane = response.data;
            stanAukcji.aktualnaCena = parseFloat(dane.aktualna_cena);

            if (document.getElementById('auction-title')) {
                document.getElementById('auction-title').textContent = dane.tytul;
            }
            if (document.getElementById('current-price-display')) {
                document.getElementById('current-price-display').textContent = `${stanAukcji.aktualnaCena.toLocaleString('pl-PL')} PLN`;
            }
            if (document.getElementById('wadium-display')) {
                document.getElementById('wadium-display').textContent = `${parseFloat(dane.kwota_wadium).toLocaleString('pl-PL')} PLN`;
            }

            updateVisualSteps();
        }
    } catch (error) {
        console.error('Błąd pobierania aukcji:', error);
        if (document.getElementById('auction-title')) {
            document.getElementById('auction-title').textContent = `Przedmiot aukcyjny (Zasób #${aktualneAuctionId})`;
        }
        updateVisualSteps();
    }
}

function updateVisualSteps() {
    const user = pobierzDaneSesji();
    const kontenerAukcji = document.getElementById('aukcje');
    if (!kontenerAukcji) return;

    // Czyszczenie ewentualnych dynamicznych komunikatów przy każdym odświeżeniu widoku
    const staryKomunikatGosc = document.getElementById('guest-auth-alert');
    const staryKomunikatOczekiwanie = document.getElementById('wait-approval-alert');
    if (staryKomunikatGosc) staryKomunikatGosc.remove();
    if (staryKomunikatOczekiwanie) staryKomunikatOczekiwanie.remove();

    // 1. BLOKADA DLA NIEZALOGOWANYCH GOŚCI
    if (!user) {
        setActiveStep(null); // Ukrywa wszystkie kroki (1, 2 i 3)

        const alertDiv = document.createElement('div');
        alertDiv.id = 'guest-auth-alert';
        alertDiv.className = 'alert alert-warning border border-warning shadow-sm p-4 text-center mt-3';
        alertDiv.innerHTML = `
            <h5 class="fw-bold text-dark mb-2"><i class="bi bi-shield-lock-fill me-2 text-warning"></i> Wymagane zalogowanie</h5>
            <p class="text-muted small mb-3">Jako Gość możesz jedynie przeglądać oferty. Aby zgłosić chęć licytacji, opłacić wadium i brać czynny udział, musisz potwierdzić tożsamość obywatela RP.</p>
            <a href="#logowanie" class="btn btn-primary btn-sm px-4 fw-medium"><i class="bi bi-box-arrow-in-right me-1"></i> Zaloguj się teraz</a>
        `;
        const govCard = kontenerAukcji.querySelector('.gov-card');
        if (govCard) govCard.appendChild(alertDiv);
        return;
    }

    wczytajStanZgloszenia(user.id, aktualneAuctionId);

    // 2. SKRÓT UPRAWNIEŃ DLA PEŁNOPRAWNEGO LICYTANTA
    if (user.rola === 'Licytant' || user.rola === 'Admin') {
        stanAukcji.uzytkownikZgloszony = true;
        stanAukcji.wadiumOplacone = true;
    }

    // 3. STEROWANIE WIDOCZNOŚCIĄ KROKÓW
    if (!stanAukcji.uzytkownikZgloszony) {
        setActiveStep(stepRegister);
    } else if (!stanAukcji.wadiumOplacone) {
        setActiveStep(stepWadium);
    } else if (user.rola !== 'Licytant' && user.rola !== 'Admin') {
        // --- NOWOŚĆ: STAN OCZEKIWANIA NA URZĘDNIKA ---
        setActiveStep(null); // Ukrywamy formularz licytacji (krok 3), bo nie ma roli!
        
        const alertDiv = document.createElement('div');
        alertDiv.id = 'wait-approval-alert';
        alertDiv.className = 'alert alert-info border border-info shadow-sm p-4 text-center mt-3';
        alertDiv.innerHTML = `
            <h5 class="fw-bold text-dark mb-2"><i class="bi bi-hourglass-split me-2 text-info"></i> Oczekiwanie na zaksięgowanie wpłaty</h5>
            <p class="text-muted small mb-0">Twoja wpłata została zarejestrowana i oczekuje na weryfikację przez Urząd. Gdy Urzędnik zatwierdzi wadium, Twoje uprawnienia zmienią się na <strong>Licytanta</strong> i automatycznie odblokujemy dla Ciebie panel licytacji.</p>
            <button class="btn btn-outline-info btn-sm mt-3" onclick="window.location.reload()"><i class="bi bi-arrow-clockwise me-1"></i> Odśwież status</button>
        `;
        const govCard = kontenerAukcji.querySelector('.gov-card');
        if (govCard) govCard.appendChild(alertDiv);
    } else {
        // Ma rolę i opłacił wadium - pokazujemy licytację
        setActiveStep(stepBidForm);
    }
}

function setActiveStep(activeSection) {
    [stepRegister, stepWadium, stepBidForm].forEach((section) => {
        if (section) section.classList.add('hidden', 'd-none');
    });
    if (activeSection) activeSection.classList.remove('hidden', 'd-none');
}

function validateBidAmount() {
    if (!bidInput) return;
    const enteredAmount = parseFloat(bidInput.value);
    if (isNaN(enteredAmount) || enteredAmount <= stanAukcji.aktualnaCena) {
        if (bidButton) bidButton.disabled = true;
        if (bidError) bidError.textContent = `Kwota musi być większa niż ${stanAukcji.aktualnaCena.toLocaleString('pl-PL')} PLN.`;
        bidInput.classList.add('input-error');
    } else {
        if (bidButton) bidButton.disabled = false;
        if (bidError) bidError.textContent = '';
        bidInput.classList.remove('input-error');
    }
}

if (btnRegister) {
    btnRegister.onclick = function() {
        const user = pobierzDaneSesji();
        if (!user) return;
        
        stanAukcji.uzytkownikZgloszony = true;
        zapiszStanZgloszenia(user.id, aktualneAuctionId);
        updateVisualSteps();
    };
}

if (btnPayWadium) {
    btnPayWadium.onclick = async function() {
        const user = pobierzDaneSesji();
        if (!user) return;

        btnPayWadium.textContent = 'Przetwarzanie płatności wadium...';
        btnPayWadium.disabled = true;
        
        try {
            // WYSYŁKA DO BACKENDU ABY ADMIN TO ZOBACZYŁ W PANELU!
            await API.request(`/aukcje/${aktualneAuctionId}/zglos-wadium`, 'POST', { id_uzytkownika: user.id });

            stanAukcji.wadiumOplacone = true;
            zapiszStanZgloszenia(user.id, aktualneAuctionId);
            updateVisualSteps();
        } catch (error) {
            alert('Wystąpił błąd podczas rejestracji wadium: ' + error.message);
        } finally {
            btnPayWadium.textContent = 'Opłać wadium online';
            btnPayWadium.disabled = false;
        }
    };
}

if (bidInput) {
    bidInput.addEventListener('input', validateBidAmount);
}

const bidForm = document.getElementById('auction-bid-form');
if (bidForm) {
    bidForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = pobierzDaneSesji();
        const finalAmount = parseFloat(bidInput.value);
        if (finalAmount <= stanAukcji.aktualnaCena) return;
        
        try {
            const response = await API.request(`/aukcje/${aktualneAuctionId}/bid`, 'POST', {
                id_licytanta: user ? user.id : 1,
                kwota_oferowana: finalAmount
            });
            if (response.success) {
                alert('Gratulacje! Twoja oferta została pomyślnie zapisana.');
                bidInput.value = '';
                if (bidButton) bidButton.disabled = true;
                await pobierzDaneAukcji();
            }
        } catch (error) {
            // Bezpiecznik: Gdyby ktoś "zhackował" frontend i odkrył formularz, dostanie ładny komunikat
            if (bidError) {
                bidError.textContent = error.message.includes('403') 
                    ? 'Nie posiadasz jeszcze roli licytanta. Wymagana akceptacja urzędu.' 
                    : error.message;
            }
        }
    });
}

window.addEventListener('hashchange', () => {
    if (window.location.hash === '#aukcje') {
        pobierzDaneAukcji();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#aukcje' || !window.location.hash) {
        pobierzDaneAukcji();
    }
});