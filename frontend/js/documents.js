document.addEventListener('DOMContentLoaded', () => {
    const documentsTableBody = document.getElementById("documentsTableBody");
    const addDocumentBtnUrzednik = document.getElementById("addDocumentBtnUrzednik");

    function isAdmin() {
        const userString = localStorage.getItem('user_data');
        if (!userString) return false;
        try { return JSON.parse(userString).rola === 'Admin'; } catch(e) { return false; }
    }

    window.loadDocuments = async function () {
        if (!documentsTableBody) return;
        try {
            const theadTr = documentsTableBody.parentElement.querySelector('thead tr');
            const czyAdmin = isAdmin();

            if (theadTr) {
                theadTr.innerHTML = `
                    <th style="width: 80px;">ID</th>
                    <th>Nazwa Dokumentu i Powiązanie</th>
                    <th style="width: 150px;">Format</th>
                    ${czyAdmin ? '<th style="width: 200px;" class="text-end">Akcja</th>' : ''}
                `;
            }

            documentsTableBody.innerHTML = `<tr><td colspan="${czyAdmin ? 4 : 3}" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Ładowanie dokumentacji...</td></tr>`;

            const docs = await API.request('/dokumenty', 'GET');
            documentsTableBody.innerHTML = '';

            if (docs.length === 0) {
                documentsTableBody.innerHTML = `<tr><td colspan="${czyAdmin ? 4 : 3}" class="text-center text-muted py-4">Brak dokumentów technicznych w systemie.</td></tr>`;
                return;
            }

            docs.forEach(doc => {
                const tr = document.createElement('tr');
                let actionButtonsCell = '';
                if (czyAdmin) {
                    actionButtonsCell = `
                        <td class="text-end text-nowrap">
                            <button class="btn btn-sm btn-outline-primary shadow-sm border-0" onclick="pokazPowiadomienie('Pobieranie pliku PDF zostało rozpoczęte.', 'primary')">
                                <i class="bi bi-download"></i> Pobierz
                            </button>
                            <button class="btn btn-sm btn-outline-danger shadow-sm border-0 ms-1" onclick="usunDokument(${doc.id}, '${doc.nazwa}')" title="Usuń trwale">
                                <i class="bi bi-trash3-fill"></i>
                            </button>
                        </td>
                    `;
                }

                tr.innerHTML = `
                    <td class="fw-bold">${doc.id}</td>
                    <td>${doc.nazwa} <br><small class="text-muted">(Powiązanie: ${doc.obiekt_typ.toUpperCase()} #${doc.obiekt_id})</small></td>
                    <td><span class="badge bg-danger"><i class="bi bi-file-earmark-pdf me-1"></i>${doc.typ_pliku}</span></td>
                    ${actionButtonsCell}
                `;
                documentsTableBody.appendChild(tr);
            });
        } catch (error) {
            const cols = isAdmin() ? 4 : 3;
            documentsTableBody.innerHTML = `<tr><td colspan="${cols}" class="text-danger text-center"><i class="bi bi-exclamation-triangle me-2"></i>Błąd pobierania dokumentów: ${error.message}</td></tr>`;
        }
    }

    window.usunDokument = async function (id, nazwa) {
        if (!(await potwierdzAkcje(`Czy na pewno chcesz usunąć dokument "${nazwa}"?`))) return;
        try {
            await API.request(`/dokumenty/${id}`, 'DELETE');
            pokazPowiadomienie('Dokument został trwale usunięty.', 'success');
            loadDocuments(); 
        } catch (error) {
            pokazPowiadomienie('Błąd usuwania: ' + error.message, 'danger');
        }
    };

    if (addDocumentBtnUrzednik) {
        addDocumentBtnUrzednik.addEventListener("click", async () => {
            const nazwa = document.getElementById('documentNameUrzednik').value;
            const obiektId = document.getElementById('documentObiektIdUrzednik').value;
            const obiektTyp = document.getElementById('documentObiektTypUrzednik').value;

            if (!nazwa || !obiektId) {
                return pokazPowiadomienie('Wypełnij nazwę dokumentu oraz ID powiązanego zasobu!', 'warning');
            }

            try {
                addDocumentBtnUrzednik.disabled = true;
                addDocumentBtnUrzednik.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Wysyłanie...';

                await API.request('/dokumenty', 'POST', {
                    nazwa: nazwa,
                    typ_pliku: 'PDF',
                    obiekt_id: parseInt(obiektId),
                    obiekt_typ: obiektTyp
                });

                pokazPowiadomienie('Dokument zapisany w bazie PostgreSQL.', 'success');
                document.getElementById('formularzDokumentuUrzednik').reset();
                loadDocuments(); 

            } catch (error) {
                pokazPowiadomienie('Błąd zapisu: ' + error.message, 'danger');
            } finally {
                addDocumentBtnUrzednik.disabled = false;
                addDocumentBtnUrzednik.innerHTML = '<i class="bi bi-cloud-arrow-up me-1"></i> Wyślij do bazy';
            }
        });
    }

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#dokumenty' || window.location.hash === '#panel-urzednika') loadDocuments();
    });

    if (window.location.hash === '#dokumenty' || window.location.hash === '#panel-urzednika' || !window.location.hash) {
        loadDocuments();
    }
});