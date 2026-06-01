document.addEventListener('DOMContentLoaded', () => {
    // Tabela w widoku ogólnym (dla mieszkańca)
    const documentsTableBody = document.getElementById("documentsTableBody");
    const toggleDocumentsBtn = document.getElementById("toggleDocumentsBtn");
    
    // Pola formularza dedykowane dla Panelu Urzędnika
    const addDocumentBtnUrzednik = document.getElementById("addDocumentBtnUrzednik");
    const documentNameUrzednik = document.getElementById("documentNameUrzednik");
    const documentObiektIdUrzednik = document.getElementById("documentObiektIdUrzednik");
    const documentObiektTypUrzednik = document.getElementById("documentObiektTypUrzednik");

    let expanded = false;

    // 1. Obsługa ukrywania/pokazywania nadmiarowych wierszy tabeli (Zasada limitu wierszy Madzi)
    const checkVisibility = () => {
        if (!documentsTableBody) return;
        const rows = documentsTableBody.querySelectorAll("tr");
        rows.forEach((row, index) => {
            if (index >= 2) {
                row.style.display = expanded ? "table-row" : "none";
            } else {
                row.style.display = "table-row";
            }
        });
        if (toggleDocumentsBtn) {
            toggleDocumentsBtn.textContent = expanded ? "Pokaż mniej" : "Pokaż więcej";
        }
    };

    // 2. Funkcja pomocnicza budująca wiersz w tabeli dla mieszkańca
    function renderDocumentRow(doc) {
        if (!documentsTableBody) return;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${doc.id}</td>
            <td>
                <div class="fw-bold">${doc.nazwa}</div>
                <div class="text-muted small">Przypisano do: ${doc.obiekt_typ === 'dzialka' ? 'Działka' : 'Budynek'} (ID: ${doc.obiekt_id})</div>
            </td>
            <td><span class="badge bg-danger">${doc.typ_pliku || 'PDF'}</span></td>
            <td><button class="btn btn-sm btn-primary download-btn" data-id="${doc.id}"><i class="bi bi-download me-1"></i>Pobierz</button></td>
        `;
        documentsTableBody.appendChild(row);
    }

    // 3. ZADANIE: Pobieranie i dynamiczne renderowanie danych z bazy (GET)
    async function loadDocuments() {
        if (!documentsTableBody) return; // Zapobiega błędom na innych widokach

        try {
            console.log("Aplication debug: Uruchamiam loadDocuments i strzelam do API...");
            documentsTableBody.innerHTML = ""; 
            
            // Poprawione z '/api/dokumenty' na '/dokumenty' (unikamy błędu api/api/dokumenty)
            const documents = await API.request('/dokumenty', 'GET');
            console.log("Aplication debug: API zwróciło pomyślnie dokumenty:", documents);

            if (!documents || documents.length === 0) {
                documentsTableBody.innerHTML = `<tr><td colspan="4" class="text-muted text-center py-3">Brak wdrożonych plików PDF w repozytorium mienia.</td></tr>`;
                if (toggleDocumentsBtn) toggleDocumentsBtn.style.display = "none";
                return;
            }

            if (toggleDocumentsBtn) toggleDocumentsBtn.style.display = "inline-block";

            // Renderowanie pętli danych
            documents.forEach(doc => {
                renderDocumentRow(doc);
            });

            // Ukrycie dokumentów powyżej indeksu 2
            checkVisibility();

        } catch (error) {
            console.error("Aplication debug: Napotkano błąd podczas pobierania przez API:", error);
            documentsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-danger text-center py-3">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>Błąd połączenia katastralnego z bazą danych PostGIS.
                    </td>
                </tr>`;
        }
    }

    // Odpalenie ładowania bazy od razu na start
    loadDocuments();

    // 4. ZADANIE: Ożywienie formularza w Panelu Urzędnika (POST)
    if (addDocumentBtnUrzednik) {
        addDocumentBtnUrzednik.addEventListener("click", async () => {
            const nazwaPliku = documentNameUrzednik.value.trim();
            const obiektId = documentObiektIdUrzednik.value;
            const obiektTyp = documentObiektTypUrzednik.value;

            if (nazwaPliku === "") {
                alert("Urzędniku! Wprowadź oficjalną nazwę dokumentu technicznego przed dodaniem.");
                return;
            }

            const payload = {
                nazwa: nazwaPliku,
                typ_pliku: "PDF",
                obiekt_id: parseInt(obiektId),
                obiekt_typ: obiektTyp
            };

            try {
                console.log("Aplication debug: Próba zapisu nowego dokumentu (POST)... Payload:", payload);
                
                // Poprawione z '/api/dokumenty' na '/dokumenty'
                await API.request('/dokumenty', 'POST', payload);

                alert("Urzędnik: Dokument został pomyślnie zwalidowany i zapisany w rejestrze!");
                documentNameUrzednik.value = ""; // Czyszczenie inputa
                
                // Automatyczne odświeżenie tabeli po stronie mieszkańca
                await loadDocuments();

            } catch (error) {
                console.error("Aplication debug: API odrzuciło operację zapisu formularza:", error);
                alert(`Błąd zapisu na serwerze: ${error.message}`);
            }
        });
    }

    // 5. Obsługa kliknięcia "Pobierz" w tabeli
    document.addEventListener("click", (event) => {
        const target = event.target.closest(".download-btn");
        if (target) {
            const docId = target.getAttribute("data-id");
            alert(`Pobieranie dokumentu o ID bazy: ${docId}. Plik PDF został pobrany z dysku sieciowego.`);
        }
    });

    // 6. Przełącznik rozwijania wierszy tabeli (Pokaż więcej / mniej)
    if (toggleDocumentsBtn) {
        toggleDocumentsBtn.addEventListener("click", () => {
            expanded = !expanded;
            checkVisibility();
        });
    }
});