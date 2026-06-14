document.addEventListener('DOMContentLoaded', () => {
    const loginEmail = document.getElementById('loginEmail');
    const loginHaslo = document.getElementById('loginHaslo');
    const checkObywatel = document.getElementById('checkObywatel');
    const btnLoguj = document.getElementById('btnLoguj');
    const btnRejestruj = document.getElementById('btnRejestruj');

    function pokazToasta(wiadomosc, typ = 'primary') {
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1060';
            document.body.appendChild(toastContainer);
        }
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-bg-${typ} border-0 mb-2`;
        toastEl.setAttribute('role', 'alert');
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body"><i class="bi bi-info-circle-fill me-2"></i>${wiadomosc}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(toastEl);
        const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();
        
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }

    function zaktualizujNawigacje() {
        const token = localStorage.getItem('jwt_token');
        const userString = localStorage.getItem('user_data');
        const navItemLogowanie = document.getElementById('navItemLogowanie');
        const navItemWyloguj = document.getElementById('navItemWyloguj');
        const navItemAdmin = document.getElementById('navItemAdmin');
        const wylogujUser = document.getElementById('wylogujUser');
        const wylogujBtn = document.getElementById('wylogujBtn');

        if (token && userString) {
            const user = JSON.parse(userString);
            if (navItemLogowanie) navItemLogowanie.classList.add('d-none');
            if (navItemAdmin) {
                if (user.rola === 'Admin') navItemAdmin.classList.remove('d-none');
                else navItemAdmin.classList.add('d-none');
            }
            if (navItemWyloguj) {
                navItemWyloguj.classList.remove('d-none');
                if (wylogujUser) wylogujUser.textContent = `(${user.login})`;
            }
            if (wylogujBtn) {
                wylogujBtn.onclick = (e) => {
                    e.preventDefault();
                    wylogujBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Wylogowywanie...';
                    wylogujBtn.classList.add('disabled');
                    setTimeout(() => {
                        localStorage.removeItem('jwt_token');
                        localStorage.removeItem('user_data');
                        if (loginEmail) loginEmail.value = '';
                        if (loginHaslo) loginHaslo.value = '';
                        if (checkObywatel) checkObywatel.checked = false;
                        
                        wylogujBtn.innerHTML = '<i class="bi bi-box-arrow-left me-1"></i> Wyloguj';
                        wylogujBtn.classList.remove('disabled');
                        zaktualizujNawigacje();
                        window.location.hash = '#mapa'; 
                        pokazToasta('Pomyślnie wylogowano z systemu.', 'secondary');
                    }, 1000);
                };
            }
        } else {
            if (navItemLogowanie) navItemLogowanie.classList.remove('d-none');
            if (navItemWyloguj) navItemWyloguj.classList.add('d-none');
            if (navItemAdmin) navItemAdmin.classList.add('d-none');
        }
    }

    zaktualizujNawigacje();

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
                
                pokazToasta(`Zalogowano jako: ${response.user.login}`, 'success');
                zaktualizujNawigacje();
                window.location.hash = '#mapa';
            } catch (err) {
                alert('Logowanie nie powiodło się: ' + err.message);
            }
        });
    }

    if (btnRejestruj) {
        btnRejestruj.addEventListener('click', async () => {
            if (!checkObywatel.checked) return alert('Wymagane obywatelstwo RP przy rejestracji!');
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

// FUNKCJE URZĘDNIKA DO WADIUM
window.zaladujWnioskiWadium = async function () {
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
    const potwierdzenie = confirm('Czy na pewno chcesz zaksięgować wpłatę i zezwolić na licytację w tej aukcji?');
    if (!potwierdzenie) return;
    try {
        await API.request(`/aukcje/wnioski/${wniosekId}/zatwierdz`, 'PATCH', {});
        // alert(' ✅ Sukces! Wpłata zaksięgowana. Użytkownik ma odblokowaną licytację.');
        const wiersz = document.getElementById(`wadium-row-${wniosekId}`);
        if (wiersz) {
            wiersz.style.transition = "opacity 0.5s";
            wiersz.style.opacity = "0";
            setTimeout(() => wiersz.remove(), 500);
        }
    } catch (error) { alert(` ❌ Błąd: ${error.message}`); }
};

// NOWOŚĆ: PRAWDZIWE ODRZUCANIE W BAZIE!
window.odrzucWadium = async function (wniosekId) {
    const potwierdzenie = confirm('Czy na pewno chcesz odrzucić wniosek o licytację? Użytkownik będzie musiał zgłosić się ponownie.');
    if (!potwierdzenie) return;
    
    try {
        // Wysyłamy żądanie usunięcia do bazy danych
        await API.request(`/aukcje/wnioski/${wniosekId}`, 'DELETE', {});
        
        // Płynne usunięcie wiersza z ekranu po sukcesie bazy
        const wiersz = document.getElementById(`wadium-row-${wniosekId}`);
        if (wiersz) {
            wiersz.style.transition = "opacity 0.5s";
            wiersz.style.opacity = "0";
            setTimeout(() => wiersz.remove(), 500);
        }
    } catch (error) {
        alert(` ❌ Błąd odrzucania wniosku: ${error.message}`);
    }
};

window.addEventListener('hashchange', () => {
    if (window.location.hash === '#panel-urzednika') window.zaladujWnioskiWadium();
});
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#panel-urzednika') window.zaladujWnioskiWadium();
});