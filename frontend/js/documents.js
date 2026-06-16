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
                    <th style="width: 50px;">Lp.</th>
                    <th>${czyAdmin ? 'Nazwa Dokumentu i Powiązanie' : 'Nazwa Dokumentu'}</th>
                    <th style="width: 150px;">Format</th>
                    <th class="text-center" style="width: 200px;">Plik</th>
                `;
            }

            documentsTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Ładowanie dokumentacji...</td></tr>`;

            const docs = await API.request('/dokumenty', 'GET');

            documentsTableBody.innerHTML = '';
            if (docs.length === 0) {
                documentsTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Brak dokumentów technicznych w systemie.</td></tr>`;
                return;
            }

            docs.forEach((doc, index) => {
                const tr = document.createElement('tr');
                
                let actionButtonsCell = `
                    <a href="${doc.url || '#'}" target="_blank" class="btn btn-sm btn-outline-primary shadow-sm border-0">
                        <i class="bi bi-download"></i> Pobierz
                    </a>
                `;

                if (czyAdmin) {
                    actionButtonsCell += `
                        <button class="btn btn-sm btn-outline-danger shadow-sm border-0 ms-1" onclick="usunDokument(${doc.id}, '${doc.nazwa}')" title="Usuń trwale">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    `;
                }

                const nazwaDokumentu = `<span class="fw-bold">${doc.nazwa}</span>`;
                const opisDom = doc.opis ? `<br><small class="text-muted">${doc.opis}</small>` : '';
                
                // ZMIANA: Powiązanie widoczne tylko dla admina
                const powiazanieDom = czyAdmin ? `<br><small class="text-muted">(Powiązanie: ${doc.obiekt_typ.toUpperCase()} #${doc.obiekt_id} | Tech ID: ${doc.id})</small>` : '';

                let badgeColor = 'bg-secondary';
                let iconClass = 'bi-file-earmark';

                if (doc.typ_pliku === 'PDF') { badgeColor = 'bg-danger'; iconClass = 'bi-file-earmark-pdf'; }
                else if (doc.typ_pliku === 'DOCX') { badgeColor = 'bg-primary'; iconClass = 'bi-file-earmark-word'; }
                else if (doc.typ_pliku === 'XLSX') { badgeColor = 'bg-success'; iconClass = 'bi-file-earmark-excel'; }
                else if (doc.typ_pliku === 'JPG') { badgeColor = 'bg-warning text-dark'; iconClass = 'bi-file-earmark-image'; }

                tr.innerHTML = `
                    <th scope="row">${index + 1}</th>
                    <td>
                        ${nazwaDokumentu} ${opisDom} ${powiazanieDom}
                    </td>
                    <td><span class="badge ${badgeColor}"><i class="bi ${iconClass} me-1"></i>${doc.typ_pliku}</span></td>
                    <td class="text-center text-nowrap">${actionButtonsCell}</td>
                `;
                documentsTableBody.appendChild(tr);
            });
        } catch (error) {
            documentsTableBody.innerHTML = `<tr><td colspan="4" class="text-danger text-center"><i class="bi bi-exclamation-triangle me-2"></i>Błąd pobierania dokumentów: ${error.message}</td></tr>`;
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
            const opis = document.getElementById('documentOpisUrzednik') ? document.getElementById('documentOpisUrzednik').value : '';
            const url = document.getElementById('documentUrlUrzednik').value;
            const typPliku = document.getElementById('documentFileTypeUrzednik').value;
            const obiektId = document.getElementById('documentObiektIdUrzednik').value;
            const obiektTyp = document.getElementById('documentObiektTypUrzednik').value;

            if (!nazwa || !url || !obiektId) {
                return pokazPowiadomienie('Wypełnij nazwę, adres URL oraz ID powiązanego zasobu!', 'warning');
            }

            try {
                addDocumentBtnUrzednik.disabled = true;
                addDocumentBtnUrzednik.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Wysyłanie...';

                await API.request('/dokumenty', 'POST', {
                    nazwa: nazwa,
                    opis: opis,
                    url: url,
                    typ_pliku: typPliku,
                    obiekt_id: parseInt(obiektId),
                    obiekt_typ: obiektTyp
                });

                pokazPowiadomienie('Dokument i link zapisane w bazie PostgreSQL.', 'success');
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