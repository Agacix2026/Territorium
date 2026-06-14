// frontend/js/documents.js - Pełna integracja modułu dokumentacji (Opcja usuwania dla Admina)
document.addEventListener('DOMContentLoaded', () => {
    const documentsTableBody = document.getElementById("documentsTableBody");
    const addDocumentBtnUrzednik = document.getElementById("addDocumentBtnUrzednik");

    // Funkcja sprawdzająca czy zalogowany jest Admin
    function isAdmin() {
        const userString = localStorage.getItem('user_data');
        if (!userString) return false;
        try {
            return JSON.parse(userString).rola === 'Admin';
        } catch(e) {
            return false;
        }
    }

    // Dynamiczne pobieranie dokumentów z API
    window.loadDocuments = async function() {
        if (!documentsTableBody) return;
        try {
            documentsTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Ładowanie dokumentacji...</td></tr>';
            
            const docs = await API.request('/dokumenty', 'GET');
            documentsTableBody.innerHTML = '';
            
            if (docs.length === 0) {
                documentsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Brak dokumentów technicznych w systemie.</td></tr>';
                return;
            }

            const czyAdmin = isAdmin();

            docs.forEach(doc => {
                const tr = document.createElement('tr');
                
                // Przyciski akcji
                let actionButtons = `
                    <button class="btn btn-sm btn-outline-primary" onclick="alert('Trwa generowanie bezpiecznego linku pobierania dla pliku ${doc.nazwa}...')">
                        <i class="bi bi-download"></i> Pobierz
                    </button>
                `;

                // Jeśli to Admin, dokładamy przycisk usuwania
                if (czyAdmin) {
                    actionButtons += `
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="usunDokument(${doc.id}, '${doc.nazwa}')" title="Usuń trwale">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    `;
                }

                tr.innerHTML = `
                    <td class="fw-bold">${doc.id}</td>
                    <td>${doc.nazwa} <br><small class="text-muted">(Powiązanie: ${doc.obiekt_typ.toUpperCase()} #${doc.obiekt_id})</small></td>
                    <td><span class="badge bg-danger"><i class="bi bi-file-earmark-pdf me-1"></i>${doc.typ_pliku}</span></td>
                    <td>${actionButtons}</td>
                `;
                documentsTableBody.appendChild(tr);
            });
        } catch (error) {
            documentsTableBody.innerHTML = `<tr><td colspan="4" class="text-danger text-center"><i class="bi bi-exclamation-triangle me-2"></i>Błąd pobierania dokumentów: ${error.message}</td></tr>`;
        }
    }

    // Funkcja globalna do usuwania dokumentów
    window.usunDokument = async function(id, nazwa) {
        if (!confirm(`Czy na pewno chcesz usunąć dokument "${nazwa}"?`)) return;
        try {
            await API.request(`/dokumenty/${id}`, 'DELETE');
            loadDocuments(); // Odśwież tabelę po usunięciu
        } catch (error) {
            alert(' ❌ Błąd usuwania: ' + error.message);
        }
    };

    // Dodawanie dokumentu przez Panel Urzędnika
    if (addDocumentBtnUrzednik) {
        addDocumentBtnUrzednik.addEventListener("click", async () => {
            const nazwa = document.getElementById('documentNameUrzednik').value;
            const obiektId = document.getElementById('documentObiektIdUrzednik').value;
            const obiektTyp = document.getElementById('documentObiektTypUrzednik').value;

            if (!nazwa || !obiektId) {
                return alert('Wypełnij nazwę dokumentu oraz ID powiązanego zasobu!');
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
                
                alert(' ✅ Dokument został dodany pomyślnie i zapisany w bazie PostgreSQL.');
                document.getElementById('formularzDokumentuUrzednik').reset();
                loadDocuments(); // Odśwież tabelę w tle
                
            } catch (error) {
                alert(' ❌ Brak uprawnień lub błąd zapisu: ' + error.message);
            } finally {
                addDocumentBtnUrzednik.disabled = false;
                addDocumentBtnUrzednik.innerHTML = '<i class="bi bi-cloud-arrow-up me-1"></i> Wyślij do bazy';
            }
        });
    }

    // Śledzenie zmian widoków w SPA, aby odświeżyć dane
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#dokumenty' || window.location.hash === '#panel-urzednika') {
            loadDocuments();
        }
    });

    // Inicjalizacja przy pierwszym załadowaniu strony
    if (window.location.hash === '#dokumenty' || window.location.hash === '#panel-urzednika' || !window.location.hash) {
        loadDocuments();
    }
});