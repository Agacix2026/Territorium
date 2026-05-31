document.addEventListener('DOMContentLoaded', () => {
    const formularz = document.getElementById('formularzAutoryzacji');
    const btnLogowanie = document.getElementById('btnLogowanie');
    const checkObywatel = document.getElementById('checkObywatel');
    const loginEmail = document.getElementById('loginEmail');
    const loginHaslo = document.getElementById('loginHaslo');

    // Funkcja zarządzająca stanem UI po zalogowaniu
    function zaktualizujNawigacje() {
        const token = localStorage.getItem('jwt_token');
        const user = JSON.parse(localStorage.getItem('user_data'));
        const navLinks = document.querySelector('.navbar-nav');

        if (token && user) {
            // Ukrywamy link do logowania
            const loginLink = document.querySelector('a[href="#logowanie"]');
            if(loginLink) loginLink.parentElement.classList.add('d-none');

            // Dodajemy link wyloguj (jeśli jeszcze go nie ma)
            if (!document.getElementById('wylogujBtn')) {
                const logoutLi = document.createElement('li');
                logoutLi.className = 'nav-item';
                logoutLi.innerHTML = `<a href="#" id="wylogujBtn" class="nav-link text-warning fw-bold"><i class="bi bi-box-arrow-right me-1"></i>Wyloguj (${user.login})</a>`;
                navLinks.appendChild(logoutLi);

                document.getElementById('wylogujBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('jwt_token');
                    localStorage.removeItem('user_data');
                    window.location.hash = '#logowanie';
                    window.location.reload();
                });
            }
        }
    }

    zaktualizujNawigacje();

    if (!formularz) return;

    formularz.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        let czyPoprawny = true;
        if (!checkObywatel.checked) {
            czyPoprawny = false;
            checkObywatel.setCustomValidity('Wymagane obywatelstwo');
        } else {
            checkObywatel.setCustomValidity('');
        }

        formularz.classList.add('was-validated');
        if (!formularz.checkValidity() || !czyPoprawny) return;

        btnLogowanie.disabled = true;
        btnLogowanie.textContent = 'Przetwarzanie...';

        const payload = {
            login: loginEmail.value,
            haslo: loginHaslo.value,
            czyObywatelRP: checkObywatel.checked
            // UWAGA: Rejestrujemy domyślnie jako 'Mieszkaniec'. Urzędnika dodamy ręcznie w bazie.
        };

        try {
            let response;
            try {
                // Próba logowania
                response = await API.request('/uzytkownicy/login', 'POST', payload);
            } catch (loginError) {
                // Jeśli nie istnieje (błąd 401), rejestrujemy
                if (loginError.message.includes('Nieprawidłowy login')) {
                    await API.request('/uzytkownicy/register', 'POST', payload);
                    alert('Konto zostało utworzone! Trwa logowanie...');
                    response = await API.request('/uzytkownicy/login', 'POST', payload);
                } else {
                    throw loginError;
                }
            }

            // Zapis danych do przeglądarki
            localStorage.setItem('jwt_token', response.token);
            localStorage.setItem('user_data', JSON.stringify(response.user));

            formularz.reset();
            formularz.classList.remove('was-validated');
            
            alert('Sukces! Zostałeś pomyślnie zalogowany.');
            window.location.hash = '#mapa';
            window.location.reload(); // Wymusza przeładowanie routera i nawigacji

        } catch (error) {
            alert(`Błąd autoryzacji: ${error.message}`);
        } finally {
            btnLogowanie.disabled = false;
            btnLogowanie.textContent = 'Utwórz konto / Zaloguj';
        }
    });
});