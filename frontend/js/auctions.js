/**
 * Moduł Aukcji i Licytacji
 * Autor: Weronika (Mistrz Optymalizacji)
 */

// 1. MOCKOWANE DANE (Zastępstwo backendu do czasu integracji w Tygodniu 6)
const aktualnaAukcja = {
    id: 101,
    aktualnaCena: 150000.0,
    kwotaWadium: 5000.0,
    uzytkownikZgloszony: false,
    wadiumOplacone: false,
};
  
// 2. SELEKTORY ELEMENTÓW DOM
const bidInput = document.getElementById('bid-amount');
const bidButton = document.getElementById('btn-submit-bid');
const bidError = document.getElementById('bid-error-msg');
const btnRegister = document.getElementById('btn-register-auction');
const btnPayWadium = document.getElementById('btn-pay-wadium');

const stepRegister = document.getElementById('step-1');
const stepWadium = document.getElementById('step-2');
const stepBidForm = document.getElementById('step-3');

/**
 * Inicjalizacja widoku i danych liczbowych
 */
function initAuctionView() {
    document.getElementById('current-price-display').textContent = `${aktualnaAukcja.aktualnaCena.toLocaleString('pl-PL')} PLN`;
    document.getElementById('wadium-display').textContent = `${aktualnaAukcja.kwotaWadium.toLocaleString('pl-PL')} PLN`;
    
    updateVisualSteps();
}

/**
 * Przełączanie kroków (etapów wizualnych)
 */
function updateVisualSteps() {
    if (!aktualnaAukcja.uzytkownikZgloszony) {
        setActiveStep(stepRegister);
    } else if (!aktualnaAukcja.wadiumOplacone) {
        setActiveStep(stepWadium);
    } else {
        setActiveStep(stepBidForm);
    }
}

function setActiveStep(activeSection) {
    [stepRegister, stepWadium, stepBidForm].forEach((section) => {
        if (section) {
            section.classList.add('hidden');
        }
    });
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }
}

/**
 * Walidacja kwoty licytacji "w locie" (Na bieżąco podczas wpisywania)
 */
function validateBidAmount() {
    const enteredAmount = parseFloat(bidInput.value);

    if (isNaN(enteredAmount) || enteredAmount <= aktualnaAukcja.aktualnaCena) {
        // Kwota za mała -> Zablokuj przycisk, pokaż błąd i dodaj czerwoną ramkę
        bidButton.disabled = true;
        bidButton.setAttribute('aria-disabled', 'true');
        bidError.textContent = `Kwota musi być większa niż aktualna cena (${aktualnaAukcja.aktualnaCena} PLN).`;
        bidInput.classList.add('input-error');
    } else {
        // Kwota poprawna -> Odblokuj
        bidButton.disabled = false;
        bidButton.setAttribute('aria-disabled', 'false');
        bidError.textContent = '';
        bidInput.classList.remove('input-error');
    }
}

// 3. LISTENERY ZDARZEŃ (INTERAKCJA)

// Kliknięcie: Zgłoś chęć udziału
if (btnRegister) {
    btnRegister.addEventListener('click', () => {
        aktualnaAukcja.uzytkownikZgloszony = true;
        updateVisualSteps();
    });
}

// Kliknięcie: Opłać wadium
if (btnPayWadium) {
    btnPayWadium.addEventListener('click', () => {
        btnPayWadium.textContent = 'Przetwarzanie płatności...';
        btnPayWadium.disabled = true;

        // Symulacja czasu bramki płatniczej (1.2 sekundy)
        setTimeout(() => {
            aktualnaAukcja.wadiumOplacone = true;
            updateVisualSteps();
        }, 1200);
    });
}

// Reakcja na każdy wpisany znak w polu kwoty
if (bidInput) {
    bidInput.addEventListener('input', validateBidAmount);
}

// Zatwierdzenie formularza (Kliknięcie "Licytuj")
const bidForm = document.getElementById('auction-bid-form');
if (bidForm) {
    bidForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const finalAmount = parseFloat(bidInput.value);

        if (finalAmount > aktualnaAukcja.aktualnaCena) {
            aktualnaAukcja.aktualnaCena = finalAmount;
            initAuctionView(); // Odśwież cenę na ekranie
            bidInput.value = '';
            bidButton.disabled = true;
            alert('Gratulacje! Twoja oferta została pomyślnie złożona.');
        }
    });
}

// Odpalenie skryptu po załadowaniu drzewa DOM
document.addEventListener('DOMContentLoaded', initAuctionView);