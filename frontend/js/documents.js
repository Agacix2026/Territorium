document.addEventListener('DOMContentLoaded', () => {
    const documentsTableBody = document.getElementById("documentsTableBody");
    const addDocumentBtn = document.getElementById("addDocumentBtn");
    const documentNameInput = document.getElementById("documentName");
    const toggleDocumentsBtn = document.getElementById("toggleDocumentsBtn");
    
    if(!documentsTableBody) return; // Tylko dla podstrony dokumentów

    let documentId = 3;
    let expanded = false;

    // Pobieranie z LocalStorage
    const savedDocuments = localStorage.getItem("documentsTable");
    if (savedDocuments) { documentsTableBody.innerHTML = savedDocuments; }

    function saveDocuments() {
        localStorage.setItem("documentsTable", documentsTableBody.innerHTML);
    }

    // Dodawanie dokumentu (Z naprawionym sprawdzaniem rozwinięcia)
    if (addDocumentBtn) {
        addDocumentBtn.addEventListener("click", () => {
            const documentName = documentNameInput.value.trim();
            if (documentName === "") { alert("Wpisz nazwę dokumentu."); return; }
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${documentId}</td>
                <td>${documentName}</td>
                <td><span class="badge bg-danger">PDF</span></td>
                <td><button class="btn btn-sm btn-primary download-btn">Pobierz</button></td>
            `;

            const aktualnaLiczba = documentsTableBody.querySelectorAll("tr").length;
            // Poprawka dla błędu Madzi:
            if (!expanded && aktualnaLiczba >= 2) {
                row.style.display = "none";
            }

            documentsTableBody.appendChild(row);
            saveDocuments();
            documentId++;
            documentNameInput.value = "";
        });
    }

    // Przycisk Pobierz
    document.addEventListener("click", (event) => {
        if (event.target.classList.contains("download-btn")) {
            alert("Pobieranie dokumentu rozpoczęte.");
        }
    });

    // Pokaż więcej / mniej
    if (toggleDocumentsBtn) {
        const checkVisibility = () => {
            const rows = documentsTableBody.querySelectorAll("tr");
            rows.forEach((row, index) => {
                if (index >= 2) row.style.display = expanded ? "table-row" : "none";
            });
            toggleDocumentsBtn.textContent = expanded ? "Pokaż mniej" : "Pokaż więcej";
        };
        
        checkVisibility(); // Ukryj na start
        
        toggleDocumentsBtn.addEventListener("click", () => {
            expanded = !expanded;
            checkVisibility();
        });
    }
});