// auth.js - Logika modułu logowania i rejestracji (Agata)
document.addEventListener('DOMContentLoaded', () => {
    
    const formularz = document.getElementById('formularzAutoryzacji');
    if (!formularz) return;

    const btnLogowanie = document.getElementById('btnLogowanie');
    const checkObywatel = document.getElementById('checkObywatel');

    formularz.addEventListener('submit', (event) => {
        // Blokujemy przeładowanie strony
        event.preventDefault();
        
        let czyPoprawny = true;

        // Twarda walidacja obywatelstwa za pomocą JS
        if (!checkObywatel.checked) {
            czyPoprawny = false;
            checkObywatel.setCustomValidity('Wymagane obywatelstwo');
        } else {
            checkObywatel.setCustomValidity(''); // Czyścimy błąd, jeśli zaznaczone
        }

        // Włączenie wizualnej walidacji z Bootstrapa (zielone/czerwone ramki)
        formularz.classList.add('was-validated');

        // Jeśli są jakiekolwiek błędy, przerywamy działanie
        if (!formularz.checkValidity() || !czyPoprawny) {
            return;
        }

        // --- Symulacja Sukcesu Logowania (Do połączenia z backendem w Tyodniu 4) ---
        
        // Zabezpieczenie przed wielokrotnym klikaniem
        btnLogowanie.disabled = true;
        btnLogowanie.textContent = 'Przetwarzanie...';

        setTimeout(() => {
            alert('Sukces! Konto zostało utworzone/zalogowane.');
            
            // Czyszczenie formularza i przywrócenie stanu początkowego
            formularz.reset();
            formularz.classList.remove('was-validated');
            btnLogowanie.disabled = false;
            btnLogowanie.textContent = 'Utwórz konto / Zaloguj';
            
            // Przekierowanie zalogowanego na mapę (Wykorzystanie routera Oliwii)
            window.location.hash = '#mapa';
            
        }, 1000);
    });
});