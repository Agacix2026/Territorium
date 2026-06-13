/**
 * Moduł Aukcji i Licytacji - Integracja API (Tydzień 6)
 * Autor: Weronika
 */

// Identyfikatory testowe
const TEST_AUKCJA_ID = 1;
const TEST_LICYTANT_ID = 1; 

// Lokalny stan aplikacji
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

async function pobierzDaneAukcji() {
    try {
        const response = await API.request(`/aukcje/${TEST_AUKCJA_ID}`, 'GET');
        
        if (response.success) {
            const dane = response.data;
            stanAukcji.aktualnaCena = parseFloat(dane.aktualna_cena);
            
            document.getElementById('auction-title').textContent = dane.tytul;
            document.getElementById('current-price-display').textContent = `${stanAukcji.aktualnaCena.toLocaleString('pl-PL')} PLN`;
            document.getElementById('wadium-display').textContent = `${parseFloat(dane.kwota_wadium).toLocaleString('pl-PL')} PLN`;
            
            updateVisualSteps();
        }
    } catch (error) {
        console.error('Błąd pobierania aukcji:', error);
    }
}

function updateVisualSteps() {
    if (!stanAukcji.uzytkownikZgloszony) {
        setActiveStep(stepRegister);
    } else if (!stanAukcji.wadiumOplacone) {
        setActiveStep(stepWadium);
    } else {
        setActiveStep(stepBidForm);
    }
}

function setActiveStep(activeSection) {
    [stepRegister, stepWadium, stepBidForm].forEach((section) => {
        if (section) section.classList.add('hidden');
    });
    if (activeSection) activeSection.classList.remove('hidden');
}

function validateBidAmount() {
    const enteredAmount = parseFloat(bidInput.value);
    if (isNaN(enteredAmount) || enteredAmount <= stanAukcji.aktualnaCena) {
        bidButton.disabled = true;
        bidError.textContent = `Kwota musi być większa niż ${stanAukcji.aktualnaCena.toLocaleString('pl-PL')} PLN.`;
        bidInput.classList.add('input-error');
    } else {
        bidButton.disabled = false;
        bidError.textContent = '';
        bidInput.classList.remove('input-error');
    }
}

if (btnRegister) {
    btnRegister.addEventListener('click', () => {
        stanAukcji.uzytkownikZgloszony = true;
        updateVisualSteps();
    });
}

if (btnPayWadium) {
    btnPayWadium.addEventListener('click', () => {
        btnPayWadium.textContent = 'Przetwarzanie płatności wadium...';
        btnPayWadium.disabled = true;
        setTimeout(() => {
            stanAukcji.wadiumOplacone = true;
            updateVisualSteps();
        }, 1200);
    });
}

if (bidInput) {
    bidInput.addEventListener('input', validateBidAmount);
}

const bidForm = document.getElementById('auction-bid-form');
if (bidForm) {
    bidForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const finalAmount = parseFloat(bidInput.value);
        if (finalAmount <= stanAukcji.aktualnaCena) return;

        try {
            const response = await API.request(`/aukcje/${TEST_AUKCJA_ID}/bid`, 'POST', {
                id_licytanta: TEST_LICYTANT_ID,
                kwota_oferowana: finalAmount
            });

            if (response.success) {
                alert('Gratulacje! Twoja oferta została pomyślnie zapisana.');
                bidInput.value = '';
                bidButton.disabled = true;
                await pobierzDaneAukcji();
            }
        } catch (error) {
            bidError.textContent = error.message;
            alert(`Odmowa serwera: ${error.message}`);
        }
    });
}

document.addEventListener('DOMContentLoaded', pobierzDaneAukcji);