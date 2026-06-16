document.addEventListener('DOMContentLoaded', () => {
    const formPanel = document.getElementById('formularzUmowyPanel');
    const tableBody = document.getElementById('umowy-table-body-panel');
    if (!tableBody) return;

    function isAdmin() {
        const userString = localStorage.getItem('user_data');
        if (!userString) return false;
        try { return JSON.parse(userString).rola === 'Admin'; } catch(e) { return false; }
    }

    window.loadContracts = async function() {
        try {
            const theadTr = tableBody.parentElement.querySelector('thead tr');
            const czyAdmin = isAdmin();

            if (theadTr) {
                theadTr.innerHTML = `
                    <th style="width: 50px;">Lp.</th>
                    <th>Sygnatura (Nr Umowy)</th>
                    <th>Zasób (ID)</th>
                    ${czyAdmin ? '<th class="text-primary">Najemca (Dane)</th>' : ''}
                    <th>Okres Dzierżawy</th>
                    <th>Czynsz</th>
                    <th>Status</th>
                    <th class="text-center" style="width: 100px;">Plik</th>
                    ${czyAdmin ? '<th class="text-end">Akcje Zarządcze</th>' : ''}
                `;
            }
            
            tableBody.innerHTML = `<tr><td colspan="${czyAdmin ? 9 : 7}" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span>Ładowanie danych...</td></tr>`;

            const umowy = await API.request('/umowy', 'GET');

            if (umowy.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="${czyAdmin ? 9 : 7}" class="text-center py-4 text-muted">Brak zarejestrowanych umów w systemie.</td></tr>`;
                return;
            }

            tableBody.innerHTML = '';
            umowy.forEach((umowa, index) => {
                const tr = document.createElement('tr');
                const dataRozp = new Date(umowa.data_rozpoczecia).toLocaleDateString('pl-PL');
                const dataZak = new Date(umowa.data_zakonczenia).toLocaleDateString('pl-PL');

                const statusBadge = umowa.czy_podpisana 
                    ? `<span class="badge bg-success shadow-sm"><i class="bi bi-check-circle"></i> Podpisana</span>` 
                    : `<span class="badge bg-secondary shadow-sm"><i class="bi bi-hourglass-split"></i> Oczekuje</span>`;

                const downloadLink = umowa.url 
                    ? `<a href="${umowa.url}" target="_blank" class="btn btn-sm btn-outline-primary shadow-sm border-0" title="Pobierz Plik"><i class="bi bi-download"></i> Pobierz</a>`
                    : ``;

                let najemcaCell = '';
                if (czyAdmin) {
                    const emailDom = umowa.email_najemcy ? `<br><small class="text-muted"><i class="bi bi-envelope"></i> ${umowa.email_najemcy}</small>` : '';
                    najemcaCell = `<td><span class="fw-medium">${umowa.imie_nazwisko_najemcy || 'Brak danych'}</span>${emailDom}</td>`;
                }

                let actionBtn = '';
                if (czyAdmin) {
                    const podpisBtn = umowa.czy_podpisana
                        ? `<button class="btn btn-sm btn-outline-warning me-1 shadow-sm border-0" onclick="zmienPodpisUmowy(${umowa.id}, false)" title="Zmień na Niepodpisaną"><i class="bi bi-x-circle"></i> Cofnij podpis</button>`
                        : `<button class="btn btn-sm btn-success me-1 shadow-sm border-0" onclick="zmienPodpisUmowy(${umowa.id}, true)" title="Zmień na Podpisaną"><i class="bi bi-check-lg"></i> Oznacz jako podpisaną</button>`;

                    actionBtn = `<td class="text-end text-nowrap">${podpisBtn}<button class="btn btn-sm btn-outline-danger shadow-sm border-0" onclick="usunUmowe(${umowa.id})" title="Usuń umowę"><i class="bi bi-trash3-fill"></i></button></td>`;
                }
                
                tr.innerHTML = `
                    <th scope="row">${index + 1}</th>
                    <td>
                        <span class="fw-bold">${umowa.numer_umowy}</span>
                        ${czyAdmin ? `<br><small class="text-muted" style="font-size: 0.7em;">Tech ID: ${umowa.id}</small>` : ''}
                    </td>
                    <td>Działka #${umowa.id_dzialki}</td>
                    ${najemcaCell}
                    <td>${dataRozp} - ${dataZak}</td>
                    <td class="fw-bold text-dark">${umowa.wartosc_czynszu} PLN</td>
                    <td>${statusBadge}</td>
                    <td class="text-center">${downloadLink}</td>
                    ${actionBtn}
                `;
                tableBody.appendChild(tr);
            });
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Błąd połączenia z bazą.</td></tr>`;
        }
    }

    window.usunUmowe = async function(id) {
        if (!(await potwierdzAkcje(`Czy na pewno chcesz trwale usunąć umowę o Tech ID #${id}?`))) return;
        try {
            await API.request(`/umowy/${id}`, 'DELETE');
            pokazPowiadomienie('Umowa została pomyślnie usunięta.', 'success');
            loadContracts();
        } catch (error) {
            pokazPowiadomienie('Błąd usuwania umowy: ' + error.message, 'danger');
        }
    };

    window.zmienPodpisUmowy = async function(id, nowyStatus) {
        const komunikat = nowyStatus ? 'Czy na pewno chcesz oznaczyć tę umowę jako PODPISANĄ?'
            : 'Czy na pewno chcesz cofnąć status podpisu (NIEPODPISANA)?';
        if (!(await potwierdzAkcje(komunikat))) return;
        try {
            await API.request(`/umowy/${id}/podpisz`, 'PATCH', { czyPodpisana: nowyStatus });
            pokazPowiadomienie('Zaktualizowano status podpisu umowy.', 'success');
            loadContracts();
        } catch (error) {
            pokazPowiadomienie('Błąd zmiany statusu: ' + error.message, 'danger');
        }
    };

    if (formPanel) {
        formPanel.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const idDzialki = document.getElementById('idDzialkiPanel') ? document.getElementById('idDzialkiPanel').value : 0;
            const imieNazwisko = document.getElementById('imieNazwiskoPanel') ? document.getElementById('imieNazwiskoPanel').value : '';
            const emailNajemcy = document.getElementById('emailNajemcyPanel') ? document.getElementById('emailNajemcyPanel').value : '';
            const numerUmowy = document.getElementById('numerUmowyPanel') ? document.getElementById('numerUmowyPanel').value : '';
            const urlUmowy = document.getElementById('urlUmowyPanel') ? document.getElementById('urlUmowyPanel').value : '';
            const formatUmowy = document.getElementById('formatUmowyPanel') ? document.getElementById('formatUmowyPanel').value : 'PDF';
            const dataStart = document.getElementById('dataStartPanel') ? document.getElementById('dataStartPanel').value : '';
            const dataKoniec = document.getElementById('dataKoniecPanel') ? document.getElementById('dataKoniecPanel').value : '';
            const czynsz = document.getElementById('czynszPanel') ? document.getElementById('czynszPanel').value : 0;

            const payload = {
                id_dzialki: parseInt(idDzialki),
                imie_nazwisko_najemcy: imieNazwisko,
                email_najemcy: emailNajemcy,
                numer_umowy: numerUmowy,
                url: urlUmowy,
                format_pliku: formatUmowy,
                data_rozpoczecia: dataStart,
                data_zakonczenia: dataKoniec,
                wartosc_czynszu: parseFloat(czynsz)
            };

            if (new Date(payload.data_zakonczenia) <= new Date(payload.data_rozpoczecia)) {
                pokazPowiadomienie('Data zakończenia musi być późniejsza niż data rozpoczęcia!', 'warning');
                return;
            }

            try {
                document.getElementById('btnZapiszUmowePanel').disabled = true;
                await API.request('/umowy', 'POST', payload);
                pokazPowiadomienie('Umowa została pomyślnie dodana do rejestru!', 'success');
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