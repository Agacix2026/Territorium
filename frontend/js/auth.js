document.addEventListener('DOMContentLoaded', () => {
    const loginEmail = document.getElementById('loginEmail');
    const loginHaslo = document.getElementById('loginHaslo');
    const checkObywatel = document.getElementById('checkObywatel');
    const btnLoguj = document.getElementById('btnLoguj');
    const btnRejestruj = document.getElementById('btnRejestruj');

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
                        pokazPowiadomienie('Pomyślnie wylogowano z systemu.', 'secondary');
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
            if(!loginEmail.value || !loginHaslo.value) return pokazPowiadomienie('Wprowadź login i hasło.', 'danger');
            try {
                const response = await API.request('/uzytkownicy/login', 'POST', {
                    login: loginEmail.value,
                    haslo: loginHaslo.value
                });
                localStorage.setItem('jwt_token', response.token);
                localStorage.setItem('user_data', JSON.stringify(response.user));
                
                pokazPowiadomienie(`Zalogowano jako: ${response.user.login}`, 'success');
                zaktualizujNawigacje();
                window.location.hash = '#mapa';
            } catch (err) {
                pokazPowiadomienie('Logowanie nie powiodło się: ' + err.message, 'danger');
            }
        });
    }

    if (btnRejestruj) {
        btnRejestruj.addEventListener('click', async () => {
            if (!checkObywatel.checked) return pokazPowiadomienie('Wymagane obywatelstwo RP przy rejestracji!', 'danger');
            try {
                await API.request('/uzytkownicy/register', 'POST', {
                    login: loginEmail.value,
                    haslo: loginHaslo.value,
                    czyObywatelRP: true,
                    rola: 'Mieszkaniec'
                });
                pokazPowiadomienie('Konto utworzone! Teraz kliknij Zaloguj.', 'success');
            } catch (err) {
                pokazPowiadomienie('Rejestracja nie powiodła się: ' + err.message, 'danger');
            }
        });
    }
});

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
    if (!(await potwierdzAkcje('Czy na pewno chcesz zaksięgować wpłatę i zezwolić na licytację w tej aukcji?'))) return;
    try {
        await API.request(`/aukcje/wnioski/${wniosekId}/zatwierdz`, 'PATCH', {});
        pokazPowiadomienie('Sukces! Wpłata zaksięgowana.', 'success');
        const wiersz = document.getElementById(`wadium-row-${wniosekId}`);
        if (wiersz) {
            wiersz.style.transition = "opacity 0.5s";
            wiersz.style.opacity = "0";
            setTimeout(() => wiersz.remove(), 500);
        }
    } catch (error) { pokazPowiadomienie(`Błąd: ${error.message}`, 'danger'); }
};

window.odrzucWadium = async function (wniosekId) {
    if (!(await potwierdzAkcje('Czy na pewno chcesz odrzucić wniosek o licytację?'))) return;
    try {
        await API.request(`/aukcje/wnioski/${wniosekId}`, 'DELETE', {});
        pokazPowiadomienie('Wniosek został odrzucony.', 'success');
        const wiersz = document.getElementById(`wadium-row-${wniosekId}`);
        if (wiersz) {
            wiersz.style.transition = "opacity 0.5s";
            wiersz.style.opacity = "0";
            setTimeout(() => wiersz.remove(), 500);
        }
    } catch (error) {
        pokazPowiadomienie(`Błąd odrzucania wniosku: ${error.message}`, 'danger');
    }
};

window.addEventListener('hashchange', () => {
    if (window.location.hash === '#panel-urzednika') window.zaladujWnioskiWadium();
});
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#panel-urzednika') window.zaladujWnioskiWadium();
});