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

  // NOWA IMPLEMENTACJA: Renderowanie geometrii na mapie oraz pętla dla sidebaru
  function renderujDzialki(daneZ_API) {
    plotListContainer.innerHTML = '';
    
    // Konwertujemy płaską listę z bazy danych na pełnoprawny format GeoJSON akceptowany przez Leafleta
    const geoJsonData = {
      type: "FeatureCollection",
      features: daneZ_API.map(dzialka => {
        // Ponieważ w specyfikacji tabeli Nieruchomosci z bazy nie ma pól 'numer' i 'cena' (cena jest w Aukcjach),
        // mapujemy je bezpiecznie na unikalne identyfikatory lub teksty informacyjne.
        return {
          type: "Feature",
          geometry: dzialka.wspolrzedne, // Nasz obiekt geometrii z PostGIS sparsowany przez backend do JSONa
          properties: {
            id: dzialka.id,
            numer: `D/${dzialka.id}`, 
            typ: dzialka.przeznaczenie, // Z bazy pobieramy 'przeznaczenie', mapujemy na frontendowy 'typ'
            pow: `${dzialka.powierzchnia} m²`,
            cena: dzialka.status === 'Aktywna licytacja' ? 'Sprawdź panel aukcji' : 'Niedostępna',
            status: dzialka.status
          }
        };
      })
    };

    // Tworzymy dynamiczną warstwę GeoJSON w Leaflet
    leafletGeoJsonLayer = L.geoJSON(geoJsonData, {
      style: function (feature) {
        const kolorBootstrap = pobierzKolor(feature.properties.typ);
        
        // Mapujemy nazwy stylów Bootstrapa na rzeczywiste kolory HEX dla mapy
        let kolorHex = "#3388ff"; // Domyślny niebieski (Mieszkalne)
        if (kolorBootstrap === 'info') kolorHex = "#0dcaf0"; // Jasnoniebieski (Usługowe)
        if (kolorBootstrap === 'dark') kolorHex = "#212529"; // Czarny (Przemysłowe)
        if (feature.properties.status === 'Aktywna licytacja') kolorHex = "#ffc107"; // Żółty ostrzegawczy dla licytacji

        return {
          color: kolorHex,
          weight: 2,
          fillColor: kolorHex,
          fillOpacity: 0.35
        };
      },
      onEachFeature: function (feature, layer) {
        // Po kliknięciu w dowolny narysowany kształt (poligon) na mapie, uruchamiamy Wasz modal
        layer.on('click', () => {
          otworzSzczegoly(feature.properties);
        });
      }
    }).addTo(map);

    // Automatyczne dopasowanie kamery mapy, aby wyśrodkowała się i objęła wszystkie działki z bazy
    if (geoJsonData.features.length > 0) {
      map.fitBounds(leafletGeoJsonLayer.getBounds());
    }

    // Renderowanie listy nieruchomości w bocznym panelu (Sidebar)
    geoJsonData.features.forEach(feature => {
      const dzialka = feature.properties;
      const czyLicytacja = dzialka.status === 'Aktywna licytacja';
      const kolor = pobierzKolor(dzialka.typ);

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
});