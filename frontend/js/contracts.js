// js/contracts.js - Moduł obsługi umów (Przetłumaczony z React na Vanilla JS)
document.addEventListener('DOMContentLoaded', () => {
    const formPanel = document.getElementById('formularzUmowyPanel');
    const tableBody = document.getElementById('umowy-table-body-panel');
    const alertError = document.getElementById('umowy-error-alert');
    const alertSuccess = document.getElementById('umowy-success-alert');
    
    // Zapobiega błędom, jeśli skrypt załaduje się na stronie bez panelu urzędnika
    if (!formPanel || !tableBody) return;

    // ZADANIE 2: POBIERANIE DANYCH (GET /api/umowy)
    async function loadContracts() {
        try {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Ładowanie danych z serwera...</td></tr>';
            const umowy = await API.request('/umowy', 'GET');
            
            if (umowy.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Brak zarejestrowanych umów w systemie.</td></tr>';
                return;
            }

            tableBody.innerHTML = '';
            umowy.forEach(umowa => {
                const tr = document.createElement('tr');
                const dataRozp = new Date(umowa.data_rozpoczecia).toLocaleDateString('pl-PL');
                const dataZak = new Date(umowa.data_zakonczenia).toLocaleDateString('pl-PL');
                
                tr.innerHTML = `
                    <th scope="row">${umowa.id}</th>
                    <td>Działka #${umowa.id_dzialki}</td>
                    <td>Najemca #${umowa.id_najemcy}</td>
                    <td>${dataRozp} do ${dataZak}</td>
                    <td class="fw-bold">${umowa.wartosc_czynszu} PLN</td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Błąd pobierania umów:', error);
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Błąd połączenia z bazą.</td></tr>';
        }
    }

    // ZADANIE 1 & 3: WYSYŁANIE I WALIDACJA WCAG (POST /api/umowy)
    formPanel.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertError.classList.add('d-none');
        alertSuccess.classList.add('d-none');
        alertError.innerHTML = '';

        const idNajemcy = document.getElementById('idNajemcyPanel').value;
        const idDzialki = document.getElementById('idDzialkiPanel').value;
        const dataRozp = document.getElementById('dataStartPanel').value;
        const dataZak = document.getElementById('dataKoniecPanel').value;
        const czynsz = document.getElementById('czynszPanel').value;
        
        // Generujemy losowy numer umowy w JS
        const numerUmowy = 'UM/' + Math.floor(Math.random() * 10000) + '/2026';

        // Walidacja chronologii dat (Zgodność z WCAG)
        if (new Date(dataZak) <= new Date(dataRozp)) {
            alertError.innerHTML = '<strong>Błąd:</strong> Data zakończenia umowy musi być późniejsza niż data rozpoczęcia!';
            alertError.classList.remove('d-none');
            alertError.focus(); // Focus dla czytników ekranowych
            return;
        }

        try {
            const btn = document.getElementById('btnZapiszUmowePanel');
            btn.disabled = true;

            const payload = {
                id_dzialki: parseInt(idDzialki),
                id_najemcy: parseInt(idNajemcy),
                numer_umowy: numerUmowy,
                data_rozpoczecia: dataRozp,
                data_zakonczenia: dataZak,
                wartosc_czynszu: parseFloat(czynsz)
            };

            await API.request('/umowy', 'POST', payload);
            
            alertSuccess.classList.remove('d-none');
            alertSuccess.textContent = 'Umowa została pomyślnie wygenerowana!';
            formPanel.reset();
            loadContracts(); // Odśwież tabelę

        } catch (error) {
            alertError.innerHTML = `<strong>Błąd serwera:</strong> ${error.message}`;
            alertError.classList.remove('d-none');
            alertError.focus();
        } finally {
            document.getElementById('btnZapiszUmowePanel').disabled = false;
        }
    });

    // Uruchomienie pobierania przy załadowaniu strony
    loadContracts();
});