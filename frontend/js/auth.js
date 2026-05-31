document.addEventListener('DOMContentLoaded', () => {
    const loginEmail = document.getElementById('loginEmail');
    const loginHaslo = document.getElementById('loginHaslo');
    const checkObywatel = document.getElementById('checkObywatel');
    const btnLoguj = document.getElementById('btnLoguj');
    const btnRejestruj = document.getElementById('btnRejestruj');

    // --- FUNKCJA ZARZĄDZAJĄCA NAWIGACJĄ I WYLOGOWANIEM ---
    function zaktualizujNawigacje() {
        const token = localStorage.getItem('jwt_token');
        const userString = localStorage.getItem('user_data');
        
        const navItemLogowanie = document.getElementById('navItemLogowanie');
        const navItemWyloguj = document.getElementById('navItemWyloguj');
        const wylogujUser = document.getElementById('wylogujUser');
        const wylogujBtn = document.getElementById('wylogujBtn');

        if (token && userString) {
            const user = JSON.parse(userString);
            
            // Zalogowany: Ukrywamy "Logowanie", pokazujemy "Wyloguj"
            if (navItemLogowanie) navItemLogowanie.classList.add('d-none');
            if (navItemWyloguj) {
                navItemWyloguj.classList.remove('d-none');
                if (wylogujUser) wylogujUser.textContent = `(${user.login})`;
            }

            // Akcja dla przycisku wylogowania
            if (wylogujBtn) {
                wylogujBtn.onclick = (e) => {
                    e.preventDefault();
                    localStorage.removeItem('jwt_token');
                    localStorage.removeItem('user_data');
                    window.location.hash = '#logowanie';
                    window.location.reload();
                };
            }
        } else {
            // Niezalogowany: Pokazujemy "Logowanie", ukrywamy "Wyloguj"
            if (navItemLogowanie) navItemLogowanie.classList.remove('d-none');
            if (navItemWyloguj) navItemWyloguj.classList.add('d-none');
        }
    }

    // Uruchamiamy funkcję od razu po załadowaniu strony
    zaktualizujNawigacje();

    // --- LOGOWANIE ---
    if (btnLoguj) {
        btnLoguj.addEventListener('click', async () => {
            try {
                const response = await API.request('/uzytkownicy/login', 'POST', {
                    login: loginEmail.value,
                    haslo: loginHaslo.value
                });
                localStorage.setItem('jwt_token', response.token);
                localStorage.setItem('user_data', JSON.stringify(response.user));
                window.location.hash = '#mapa';
                window.location.reload();
            } catch (err) {
                alert('Logowanie nie powiodło się: ' + err.message);
            }
        });
    }

    // --- REJESTRACJA ---
    if (btnRejestruj) {
        btnRejestruj.addEventListener('click', async () => {
            if (!checkObywatel.checked) return alert('Wymagane obywatelstwo RP!');
            try {
                await API.request('/uzytkownicy/register', 'POST', {
                    login: loginEmail.value,
                    haslo: loginHaslo.value,
                    czyObywatelRP: true,
                    rola: 'Mieszkaniec'
                });
                alert('Konto utworzone! Teraz kliknij Zaloguj.');
            } catch (err) {
                alert('Rejestracja nie powiodła się: ' + err.message);
            }
        });
    }
});