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
            if (navItemLogowanie) navItemLogowanie.classList.add('d-none');
            if (navItemWyloguj) {
                navItemWyloguj.classList.remove('d-none');
                if (wylogujUser) wylogujUser.textContent = `(${user.login})`;
            }
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
            if (navItemLogowanie) navItemLogowanie.classList.remove('d-none');
            if (navItemWyloguj) navItemWyloguj.classList.add('d-none');
        }
    }
    zaktualizujNawigacje();

    // --- LOGOWANIE ---
    if (btnLoguj) {
        btnLoguj.addEventListener('click', async (e) => {
            e.preventDefault();
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

// --- FUNKCJE DLA URZĘDNIKA ---

// Dynamiczne ładowanie wniosków z bazy danych
window.zaladujWnioskiWadium = async function() {
    const tabela = document.getElementById('tabela-wadium-body');
    if (!tabela) return;

    try {
        const wnioski = await API.request('/aukcje/wnioski/wadium', 'GET');
        tabela.innerHTML = '';

        if (wnioski.length === 0) {
            tabela.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Brak oczekujących wpłat wadium.</td></tr>';
            return;
        }

        wnioski.forEach(w => {
            const tr = document.createElement('tr');
            tr.id = `wadium-row-${w.wniosek_id}`;
            tr.innerHTML = `
                <td><div class="fw-bold text-dark">${w.login}</div><div class="text-muted small">Użytkownik ID: ${w.user_id}</div></td>
                <td>Działka N/${w.aukcja_id}</td>
                <td><span class="badge bg-warning bg-opacity-25 text-dark border border-warning border-opacity-50"><i class="bi bi-hourglass-split me-1"></i>Oczekuje</span></td>
                <td class="text-end">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-success" onclick="zatwierdzWadium(${w.user_id}, ${w.wniosek_id})" title="Zatwierdź wadium"><i class="bi bi-check-lg"></i></button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="odrzucWadium(${w.wniosek_id})" title="Odrzuć wniosek"><i class="bi bi-x-lg"></i></button>
                    </div>
                </td>
            `;
            tabela.appendChild(tr);
        });
    } catch (err) {
        console.error('Błąd pobierania wniosków:', err);
    }
};

window.zatwierdzWadium = async function (idUzytkownika, wniosekId) {
    const potwierdzenie = confirm('Czy na pewno chcesz zatwierdzić wpłatę i nadać temu użytkownikowi prawa Licytanta?');
    if (!potwierdzenie) return;
    try {
        // Zamiast błędnego fetch na port 3000, używamy API.request na zdefiniowany w configu port
        await API.request(`/uzytkownicy/${idUzytkownika}/rola`, 'PATCH', { nowaRola: 'Licytant' });
        
        // Zmiana statusu wniosku w bazie, żeby zniknął z listy do akceptacji
        await API.request(`/aukcje/wnioski/${wniosekId}/zatwierdz`, 'PATCH', {});

        alert(' ✅ Sukces! Obywatel otrzymał status Licytanta i może brać udział w aukcji.');

        const wiersz = document.getElementById(`wadium-row-${wniosekId}`);
        if (wiersz) {
            wiersz.style.transition = "opacity 0.5s";
            wiersz.style.opacity = "0";
            setTimeout(() => wiersz.remove(), 500);
        }
    } catch (error) {
        console.error('Błąd połączenia z API:', error);
        alert(` ❌ Błąd: ${error.message}`);
    }
};

window.odrzucWadium = function (wniosekId) {
    const potwierdzenie = confirm('Czy odrzucić wniosek o licytację?');
    if (potwierdzenie) {
        // Tu docelowo mógłby być patch odrzucający wniosek na stałe
        const wiersz = document.getElementById(`wadium-row-${wniosekId}`);
        if (wiersz) wiersz.remove();
    }
};

// Podpięcie ładowania wniosków po wejściu do panelu urzędnika
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#panel-urzednika') {
        window.zaladujWnioskiWadium();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#panel-urzednika') {
        window.zaladujWnioskiWadium();
    }
});