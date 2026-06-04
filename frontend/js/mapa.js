document.addEventListener('DOMContentLoaded', () => {
  const gisMapContainer = document.getElementById('gisMapContainer');
  if (!gisMapContainer) return; // Zabezpieczenie dla Single Page Application (SPA)!

  // 1. INICJALIZACJA MAPY LEAFLET (Zastępuje starą makietę opartą na divach i procentach CSS)
  // Ustawiamy domyślny widok (np. współrzędne Krakowa [50.0614, 19.9366]). Możesz zmienić na swoją gminę.
  const map = L.map('gisMapContainer').setView([50.0614, 19.9366], 13);

  // 2. PODPIĘCIE DARMOWYCH KAFELKÓW OPENSTREETMAP (Zgodnie z wymaganiem "Should Have")
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let leafletGeoJsonLayer = null; // Zmienna globalna modułu do przechowywania warstwy działek

  // Pobranie istniejących elementów UI z Waszego kodu
  const modalElement = document.getElementById('dzialkaModal');
  const dzialkaModal = new bootstrap.Modal(modalElement);
  const toastElement = document.getElementById('copyToast');
  const copyToast = new bootstrap.Toast(toastElement);

  const plotListContainer = document.getElementById('plotListContainer');
  const filterPills = document.querySelectorAll('.filter-pill');
  const btnCopy = document.getElementById('btnCopyPlotNumber');

  // Funkcja pomocnicza dopasowująca klasy kolorów Bootstrapa do typów nieruchomości z bazy danych
  function pobierzKolor(typ) {
    if (typ === 'Mieszkalne') return 'primary';
    if (typ === 'Usługowe') return 'info';
    if (typ === 'Przemysłowe') return 'dark';
    return 'secondary';
  }

  // Zachowujemy Waszą oryginalną funkcję otwierania szczegółów w modalu Bootstrapa
  function otworzSzczegoly(daneDzialki) {
    document.getElementById('modalIdPlot').textContent = daneDzialki.id;
    document.getElementById('modalNumerPlot').textContent = daneDzialki.numer;
    document.getElementById('modalAreaPlot').textContent = daneDzialki.pow;
    document.getElementById('modalPricePlot').textContent = daneDzialki.cena;
    document.getElementById('modalStatusPlot').textContent = daneDzialki.status;
    document.getElementById('copyTargetNum').textContent = daneDzialki.numer;

    const kolor = pobierzKolor(daneDzialki.typ);
    const typeBadge = document.getElementById('modalTypePlot');
    typeBadge.textContent = daneDzialki.typ;
    typeBadge.className = `badge bg-${kolor} ${kolor === 'info' ? 'text-dark' : 'text-white'}`;
    dzialkaModal.show();
  }

  function renderujDzialki(daneZ_API) {
    // 1. Czyszczenie kontenerów przed renderowaniem
    plotListContainer.innerHTML = '';
    const adminTableBody = document.getElementById('dzialki-table-body');
    if (adminTableBody) adminTableBody.innerHTML = '';

    // 2. Przygotowanie danych GeoJSON dla mapy Leaflet
    const geoJsonData = {
        type: "FeatureCollection",
        features: daneZ_API.map(dzialka => {
            return {
                type: "Feature",
                geometry: dzialka.wspolrzedne, 
                properties: {
                    id: dzialka.id,
                    numer: `D/${dzialka.id}`, 
                    typ: dzialka.przeznaczenie,
                    pow: `${dzialka.powierzchnia} m²`,
                    cena: dzialka.cena ? `${parseFloat(dzialka.cena).toLocaleString('pl-PL')} PLN` : 'Do ustalenia',
                    status: dzialka.status
                }
            };
        })
    };

    // 3. Renderowanie na mapie
    if (leafletGeoJsonLayer) map.removeLayer(leafletGeoJsonLayer);
    
    leafletGeoJsonLayer = L.geoJSON(geoJsonData, {
        style: function (feature) {
            const kolorBootstrap = pobierzKolor(feature.properties.typ);
            let kolorHex = "#3388ff"; 
            if (kolorBootstrap === 'info') kolorHex = "#0dcaf0"; 
            if (kolorBootstrap === 'dark') kolorHex = "#212529"; 
            if (feature.properties.status === 'Aktywna licytacja') kolorHex = "#ffc107"; 

            return { color: kolorHex, weight: 2, fillColor: kolorHex, fillOpacity: 0.35 };
        },
        onEachFeature: function (feature, layer) {
            layer.on('click', () => otworzSzczegoly(feature.properties));
        }
    }).addTo(map);

    if (geoJsonData.features.length > 0) map.fitBounds(leafletGeoJsonLayer.getBounds());

    // 4. Renderowanie Sidebaru i Tabeli Urzędnika
    geoJsonData.features.forEach(feature => {
        const dzialka = feature.properties;
        const kolor = pobierzKolor(dzialka.typ);
        const czyLicytacja = dzialka.status === 'Aktywna licytacja';

        // --- RENDEROWANIE KARTY (SIDEBAR) ---
        const karta = document.createElement('button');
        karta.type = 'button';
        karta.className = `plot-list-card d-flex gap-3 align-items-center ${czyLicytacja ? 'border-warning' : ''}`;
        karta.dataset.typ = dzialka.typ;
        karta.dataset.status = dzialka.status;
        karta.innerHTML = `
            <div class="map-miniature ${kolor !== 'primary' ? `bg-${kolor}-subtle border-${kolor}` : 'bg-primary-subtle border-primary'}"></div>
            <div class="flex-grow-1 text-start">
                <div class="fw-bold text-dark">Działka nr ${dzialka.numer}</div>
                <small class="text-muted d-block mb-1">ID: ${dzialka.id} • Pow: ${dzialka.pow}</small>
                <span class="badge ${czyLicytacja ? 'text-bg-warning text-dark' : `bg-${kolor}`} rounded-pill small fw-bold">
                    ${czyLicytacja ? 'Licytacja' : dzialka.typ}
                </span>
            </div>
        `;
        karta.addEventListener('click', () => otworzSzczegoly(dzialka));
        plotListContainer.appendChild(karta);

        // --- RENDEROWANIE WIERSZA (TABELA URZĘDNIKA) ---
        if (adminTableBody) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold">#${dzialka.id}</td>
                <td><code class="small text-muted">POLYGON</code></td>
                <td>${dzialka.pow}</td>
                <td><span class="badge bg-${kolor}">${dzialka.typ}</span></td>
                <td>
                    <span class="badge ${czyLicytacja ? 'bg-warning text-dark' : 'bg-success'}">
                        ${dzialka.status}
                    </span>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="usunDzialke(${dzialka.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            adminTableBody.appendChild(tr);
        }
    });

    uruchomFiltrowanie();
}

  // POŁĄCZENIE Z BACKENDEM: Pobieranie danych za pomocą obiektu API Oliwii
  async function pobierzDaneZSerwera() {
    // Pokazujemy Wasze szkielety ładowania (placeholdery) na czas trwania zapytania HTTP
    plotListContainer.innerHTML = `
      <div class="placeholder-glow mb-3"><div class="placeholder w-100" style="height: 85px; border-radius: 10px;"></div></div>
      <div class="placeholder-glow mb-3"><div class="placeholder w-100" style="height: 85px; border-radius: 10px;"></div></div>
    `;

    try {
      // Wywołanie endpointu GET /api/dzialki skonfigurowanego w js/api.js
      const pobraneDane = await API.request('/dzialki');
      renderujDzialki(pobraneDane);
    } catch (error) {
      console.error("Błąd API GIS podczas komunikacji z bazą PostgreSQL:", error);
      plotListContainer.innerHTML = `<div class="alert alert-danger small">Błąd połączenia z bazą danych katastru.</div>`;
    }
  }

  // ZMODYFIKOWANE FILTROWANIE: Teraz filtruje jednocześnie sidebar oraz warstwy na mapie Leaflet
  function uruchomFiltrowanie() {
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        const wybranyFiltr = pill.getAttribute('data-filter').toLowerCase().trim();
        const karty = plotListContainer.querySelectorAll('.plot-list-card');

        // 1. Ukrywanie/Pokazywanie kart w bocznym menu
        karty.forEach(karta => {
          const typKarty = (karta.dataset.typ || '').toLowerCase();
          const statusKarty = (karta.dataset.status || '').toLowerCase();
          
          const pasuje = wybranyFiltr === 'all' || 
                         typKarty === wybranyFiltr || 
                         statusKarty === wybranyFiltr ||
                         (wybranyFiltr === 'aktywna licytacja' && statusKarty === 'aktywna licytacja');
                         
          karta.style.display = pasuje ? 'flex' : 'none';
        });

        // 2. Dynamiczne dodawanie/usuwanie wielokątów z mapy w zależności od wybranego pilla
        if (leafletGeoJsonLayer) {
          leafletGeoJsonLayer.eachLayer(layer => {
            const typWarstwy = (layer.feature.properties.typ || '').toLowerCase();
            const statusWarstwy = (layer.feature.properties.status || '').toLowerCase();

            const pasujeMapie = wybranyFiltr === 'all' || 
                                typWarstwy === wybranyFiltr || 
                                statusWarstwy === wybranyFiltr ||
                                (wybranyFiltr === 'aktywna licytacja' && statusWarstwy === 'aktywna licytacja');

            if (pasujeMapie) {
              layer.addTo(map); // Przywróć na mapę
            } else {
              layer.remove();  // Usuń tymczasowo z widoku mapy
            }
          });
        }
      });
    });
  }

  // Zachowujemy Waszą funkcję kopiowania do schowka
  btnCopy.addEventListener('click', () => {
    const nr = document.getElementById('copyTargetNum').textContent;
    navigator.clipboard.writeText(nr).then(() => { copyToast.show(); }).catch(err => alert('Skopiuj ręcznie: ' + nr));
  });

  pobierzDaneZSerwera();

  // --- OBSŁUGA DODAWANIA NOWEJ DZIAŁKI (PANEL URZĘDNIKA) ---
const formNowaDzialka = document.getElementById('formNowaDzialka');

if (formNowaDzialka) {
    formNowaDzialka.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Pobranie danych z pól formularza
        const coordsRaw = document.getElementById('plotCoords').value;
        const powierzchnia = document.getElementById('plotArea').value.replace(/[^0-9.]/g, '');
        const przeznaczenie = document.getElementById('plotType').value;
        const status = "Dostępna"; 
        const cena = 0; // Domyślna cena, dopóki nie dodacie pola w formularzu [cite: 59]

        // 2. Parsowanie współrzędnych do formatu GeoJSON [cite: 59]
        let geometria;
        try {
            const parsedCoords = JSON.parse(coordsRaw);
            geometria = {
                type: "Polygon",
                coordinates: [parsedCoords] 
            };
        } catch (err) {
            alert("Błąd formatu współrzędnych! Wprowadź dane jako tablicę, np: [[19.9, 50.0], [19.91, 50.0], [19.9, 50.0]]");
            return;
        }

        // 3. Przygotowanie obiektu do wysyłki [cite: 59]
        const nowaDzialka = {
            geometriaGeoJSON: geometria,
            powierzchnia: parseFloat(powierzchnia),
            status: status,
            przeznaczenie: przeznaczenie,
            cena: cena
        };

        // --- POPRAWIONA SEKCJA W mapa.js ---
        try {
          // 4. Wysłanie żądania POST za pomocą modułu API Oliwii
          const wynik = await API.request('/dzialki', 'POST', nowaDzialka);

          // 5. Sukces: Moduł API.request wyrzuca Error automatycznie, jeśli status nie jest 2xx.
          // Jeśli kod doszedł tutaj, oznacza to sukces.
          alert('✅ ' + (wynik.wiadomosc || 'Nieruchomość została pomyślnie dodana!'));
          formNowaDzialka.reset();
    
          // Zamknięcie collapse'a formularza (Bootstrap)
          const collapseEl = document.getElementById('collapseFormDzialka');
          const bsCollapse = bootstrap.Collapse.getInstance(collapseEl) || new bootstrap.Collapse(collapseEl);
          bsCollapse.hide();

          // 6. KLUCZOWE: Odświeżenie mapy i listy bez przeładowania strony 
          if (leafletGeoJsonLayer) {
            map.removeLayer(leafletGeoJsonLayer);
          }
    
          // Ponowne pobranie danych z bazy (wyświetli już nową działkę) [cite: 29]
          pobierzDaneZSerwera(); 

        } catch (error) {
          console.error("Błąd podczas dodawania działki:", error);
          alert("❌ Nie udało się dodać działki: " + error.message);
        }
    });
  }
});