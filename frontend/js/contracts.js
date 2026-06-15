document.addEventListener('DOMContentLoaded', () => {
    const formPanel = document.getElementById('formularzUmowyPanel');
    const tableBody = document.getElementById('umowy-table-body-panel');
    if (!tableBody) return;

    function isAdmin() {
        const userString = localStorage.getItem('user_data');
        if (!userString) return false;
        try { return JSON.parse(userString).rola === 'Admin'; } catch(e) { return false; }
    }

    window.loadContracts = async function () {
        try {
            const theadTr = tableBody.parentElement.querySelector('thead tr');
            const czyAdmin = isAdmin();

            if (theadTr) {
                theadTr.innerHTML = `
                    <th style="width: 50px;">Lp.</th>
                    <th>Sygnatura (Nr Umowy)</th>
                    <th>Zasób (ID)</th>
                    <th>Najemca (ID)</th>
                    <th>Okres Dzierżawy</th>
                    <th>Czynsz</th>
                    ${czyAdmin ? '<th class="text-end">Akcja</th>' : ''}
                `;
            }

            tableBody.innerHTML = `<tr><td colspan="${czyAdmin ? 7 : 6}" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Ładowanie danych...</td></tr>`;

            const umowy = await API.request('/umowy', 'GET');

            if (umowy.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="${czyAdmin ? 7 : 6}" class="text-center py-4 text-muted">Brak zarejestrowanych umów w systemie.</td></tr>`;
                return;
            }

            tableBody.innerHTML = '';
            umowy.forEach((umowa, index) => {
                const tr = document.createElement('tr');
                const dataRozp = new Date(umowa.data_rozpoczecia).toLocaleDateString('pl-PL');
                const dataZak = new Date(umowa.data_zakonczenia).toLocaleDateString('pl-PL');

                let actionBtn = '';
                if (czyAdmin) {
                    actionBtn = `<td class="text-end"><button class="btn btn-sm btn-outline-danger shadow-sm border-0" onclick="usunUmowe(${umowa.id})" title="Usuń umowę"><i class="bi bi-trash3-fill"></i></button></td>`;
                }

                // ZMIANA: Tech ID dokleja się w szablonie tylko jeśli czyAdmin === true
                tr.innerHTML = `
                    <th scope="row">${index + 1}</th>
                    <td>
                        <span class="fw-bold">${umowa.numer_umowy}</span>
                        ${czyAdmin ? `<br><small class="text-muted" style="font-size: 0.7em;">Tech ID: ${umowa.id}</small>` : ''}
                    </td>
                    <td>Działka #${umowa.id_dzialki}</td>
                    <td>Najemca #${umowa.id_najemcy}</td>
                    <td>${dataRozp} - ${dataZak}</td>
                    <td class="fw-bold text-dark">${umowa.wartosc_czynszu} PLN</td>
                    ${actionBtn}
                `;
                tableBody.appendChild(tr);
            });
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Błąd połączenia z bazą.</td></tr>`;
        }
    }

    window.usunUmowe = async function (id) {
        if (!(await potwierdzAkcje(`Czy na pewno chcesz trwale usunąć umowę o Tech ID #${id}?`))) return;
        try {
            await API.request(`/umowy/${id}`, 'DELETE');
            pokazPowiadomienie('Umowa została pomyślnie usunięta.', 'success');
            loadContracts();
        } catch (error) {
            pokazPowiadomienie('Błąd usuwania umowy: ' + error.message, 'danger');
        }
    };

    if (formPanel) {
        formPanel.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                id_dzialki: parseInt(document.getElementById('idDzialkiPanel').value),
                id_najemcy: parseInt(document.getElementById('idNajemcyPanel').value),
                numer_umowy: document.getElementById('numerUmowyPanel').value,
                data_rozpoczecia: document.getElementById('dataStartPanel').value,
                data_zakonczenia: document.getElementById('dataKoniecPanel').value,
                wartosc_czynszu: parseFloat(document.getElementById('czynszPanel').value)
            };

            if (new Date(payload.data_zakonczenia) <= new Date(payload.data_rozpoczecia)) {
                pokazPowiadomienie('Data zakończenia musi być późniejsza niż data rozpoczęcia!', 'warning');
                return;
            }

            try {
                document.getElementById('btnZapiszUmowePanel').disabled = true;
                await API.request('/umowy', 'POST', payload);
                pokazPowiadomienie('Umowa została wygenerowana pomyślnie!', 'success');
                formPanel.reset();
                loadContracts();
            } catch (error) {
                pokazPowiadomienie(`Błąd serwera: ${error.message}`, 'danger');
            } finally {
                document.getElementById('btnZapiszUmowePanel').disabled = false;
            }
        });
    }

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#umowy') loadContracts();
    });

    if (window.location.hash === '#umowy' || !window.location.hash) {
        loadContracts();
    }
});