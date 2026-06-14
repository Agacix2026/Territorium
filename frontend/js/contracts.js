document.addEventListener('DOMContentLoaded', () => {
    const formPanel = document.getElementById('formularzUmowyPanel');
    const tableBody = document.getElementById('umowy-table-body-panel');
    const alertError = document.getElementById('umowy-error-alert');
    const alertSuccess = document.getElementById('umowy-success-alert');

    if (!tableBody) return;

    // Sprawdzanie uprawnień
    function isAdmin() {
        const userString = localStorage.getItem('user_data');
        if (!userString) return false;
        try { return JSON.parse(userString).rola === 'Admin'; } catch(e) { return false; }
    }

    // Dynamiczne pobieranie i rysowanie tabeli
    window.loadContracts = async function() {
        try {
            const theadTr = tableBody.parentElement.querySelector('thead tr');
            const czyAdmin = isAdmin();
            
            // Dynamiczny nagłówek: 6 kolumn dla Admina, 5 dla zwykłego użytkownika
            if (theadTr) {
                theadTr.innerHTML = `
                    <th>ID Umowy</th>
                    <th>Zasób (ID Działki)</th>
                    <th>Najemca (ID)</th>
                    <th>Okres Dzierżawy</th>
                    <th>Wartość Czynszu</th>
                    ${czyAdmin ? '<th class="text-end">Akcja</th>' : ''}
                `;
            }

            tableBody.innerHTML = `<tr><td colspan="${czyAdmin ? 6 : 5}" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Ładowanie danych...</td></tr>`;
            
            const umowy = await API.request('/umowy', 'GET');
            
            if (umowy.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="${czyAdmin ? 6 : 5}" class="text-center py-4 text-muted">Brak zarejestrowanych umów w systemie.</td></tr>`;
                return;
            }
            
            tableBody.innerHTML = '';

            umowy.forEach(umowa => {
                const tr = document.createElement('tr');
                const dataRozp = new Date(umowa.data_rozpoczecia).toLocaleDateString('pl-PL');
                const dataZak = new Date(umowa.data_zakonczenia).toLocaleDateString('pl-PL');
                
                let actionBtn = '';
                if (czyAdmin) {
                    actionBtn = `<td class="text-end"><button class="btn btn-sm btn-outline-danger shadow-sm border-0" onclick="usunUmowe(${umowa.id})" title="Usuń umowę"><i class="bi bi-trash3-fill"></i></button></td>`;
                }

                tr.innerHTML = `
                    <th scope="row">${umowa.id}</th>
                    <td>Działka #${umowa.id_dzialki}</td>
                    <td>Najemca #${umowa.id_najemcy}</td>
                    <td>${dataRozp} - ${dataZak}</td>
                    <td class="fw-bold text-dark">${umowa.wartosc_czynszu} PLN</td>
                    ${actionBtn}
                `;
                tableBody.appendChild(tr);
            });
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Błąd połączenia z bazą.</td></tr>`;
        }
    }

    // Usuwanie umowy
    window.usunUmowe = async function(id) {
        if (!confirm(`Czy na pewno chcesz trwale usunąć umowę #${id}?`)) return;
        try {
            await API.request(`/umowy/${id}`, 'DELETE');
            loadContracts(); // Odśwież tabelę
        } catch (error) {
            alert('Błąd usuwania umowy: ' + error.message);
        }
    };

    // Obsługa formularza panelu urzędnika
    if (formPanel) {
        formPanel.addEventListener('submit', async (e) => {
            e.preventDefault();
            alertError.classList.add('d-none');
            alertSuccess.classList.add('d-none');
            
            const payload = {
                id_dzialki: parseInt(document.getElementById('idDzialkiPanel').value),
                id_najemcy: parseInt(document.getElementById('idNajemcyPanel').value),
                numer_umowy: 'UM/' + Math.floor(Math.random() * 10000) + '/2026',
                data_rozpoczecia: document.getElementById('dataStartPanel').value,
                data_zakonczenia: document.getElementById('dataKoniecPanel').value,
                wartosc_czynszu: parseFloat(document.getElementById('czynszPanel').value)
            };
            
            if (new Date(payload.data_zakonczenia) <= new Date(payload.data_rozpoczecia)) {
                alertError.innerHTML = 'Data zakończenia musi być późniejsza niż data rozpoczęcia!';
                alertError.classList.remove('d-none');
                return;
            }
            
            try {
                document.getElementById('btnZapiszUmowePanel').disabled = true;
                await API.request('/umowy', 'POST', payload);
                alertSuccess.textContent = 'Umowa została wygenerowana pomyślnie!';
                alertSuccess.classList.remove('d-none');
                formPanel.reset();
                loadContracts();
            } catch (error) {
                alertError.innerHTML = `Błąd serwera: ${error.message}`;
                alertError.classList.remove('d-none');
            } finally {
                document.getElementById('btnZapiszUmowePanel').disabled = false;
            }
        });
    }

    // --- KLUCZOWA POPRAWKA: Przebudowuj tabelę przy wejściu w zakładkę ---
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#umowy') {
            loadContracts();
        }
    });

    if (window.location.hash === '#umowy' || !window.location.hash) {
        loadContracts();
    }
});