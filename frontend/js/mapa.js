// frontend/js/mapa.js - Kompletny moduł Katastru i Mapy GIS (Integracja Tydzień 6)
// Autorzy: Beata (Logika GIS) + Agata (Stabilna integracja)

// 1. Inicjalizacja mapy Leaflet wyśrodkowanej na przykładowe współrzędne
const map = L.map('gisMapContainer').setView([50.061, 19.937], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let leafletGeoJsonLayer = null;
const plotListContainer = document.getElementById('plotListContainer');

// Pomocnicza funkcja do mapowania kolorów Bootstrapa na podstawie przeznaczenia terenu
function pobierzKolor(typ) {
    switch(typ) {
        case 'Mieszkalne': return 'primary';
        case 'Usługowe': return 'info';
        case 'Przemysłowe': return 'dark';
        default: return 'secondary';
    }
}

// 2. POBIERANIE DANYCH (Zadanie Beaty: GET /api/dzialki)
async function pobierzDaneZSerwera() {
    try {
        const dane = await API.request('/dzialki', 'GET');
        renderujDzialki(dane);
    } catch (error) {
        console.error('Błąd połączenia z warstwą GIS:', error);
        if (plotListContainer) {
            plotListContainer.innerHTML = '<div class="alert alert-danger border-0 shadow-sm">Błąd pobierania warstwy katastralnej.</div>';
        }
    }
}

// 3. RENDEROWANIE POLIGONÓW I STRUKTURY UI
function renderujDzialki(daneZ_API) {
    if (!plotListContainer) return;
    plotListContainer.innerHTML = '';
    
    const adminTableBody = document.getElementById('dzialki-table-body');
    if (adminTableBody) adminTableBody.innerHTML = '';

    // Transformacja obiektów z bazy PostgreSQL na standard GeoJSON dla Leafleta
    const geoJsonData = {
      type: "FeatureCollection",
      features: daneZ_API.map(dzialka => ({
          type: "Feature",
          geometry: dzialka.wspolrzedne,
          properties: {
            id: dzialka.id,
            numer: `N/${dzialka.id}`,
            typ: dzialka.przeznaczenie,
            pow: `${dzialka.powierzchnia} m²`,
            cena: dzialka.cena ? `${parseFloat(dzialka.cena).toLocaleString('pl-PL')} PLN` : 'Do ustalenia',
            status: dzialka.status || 'Dostępna'
          }
      }))
    };

    if (leafletGeoJsonLayer) map.removeLayer(leafletGeoJsonLayer);
    
    // Rysowanie geometrii na mapie
    leafletGeoJsonLayer = L.geoJSON(geoJsonData, {
      style: function (feature) {
        const kolorBootstrap = pobierzKolor(feature.properties.typ);
        let kolorHex = "#0d6efd"; 
        if (kolorBootstrap === 'info') kolorHex = "#0dcaf0"; 
        if (kolorBootstrap === 'dark') kolorHex = "#212529";
        if (feature.properties.status === 'Aktywna licytacja' || feature.properties.status === 'Aktywna aukcja') kolorHex = "#ffc107"; 
        return { color: kolorHex, weight: 2, fillColor: kolorHex, fillOpacity: 0.35 };
      },
      onEachFeature: function (feature, layer) {
        // Kliknięcie w wielokąt na mapie otwiera szczegóły działki
        layer.on('click', () => otworzSzczegoly(feature.properties));
      }
    }).addTo(map);

    // Automatyczne dopasowanie kamery do narysowanych działek
    if (geoJsonData.features.length > 0) map.fitBounds(leafletGeoJsonLayer.getBounds());

    // Dynamiczne budowanie elementów interfejsu użytkownika
    geoJsonData.features.forEach(feature => {
        const dzialka = feature.properties;
        const kolor = pobierzKolor(dzialka.typ);
        const czyLicytacja = (dzialka.status === 'Aktywna licytacja' || dzialka.status === 'Aktywna aukcja');

        // A. Generowanie kart w panelu bocznym obok mapy (Dla Mieszkańców)
        const karta = document.createElement('button');
        karta.type = 'button';
        karta.className = `plot-list-card d-flex gap-3 align-items-center w-100 border-0 bg-white p-3 mb-2 shadow-sm rounded ${czyLicytacja ? 'border border-warning' : ''}`;
        karta.dataset.typ = dzialka.typ;
        karta.dataset.status = dzialka.status;
        karta.innerHTML = `
            <div class="map-miniature p-3 rounded ${kolor !== 'primary' ? `bg-${kolor}-subtle border border-${kolor}` : 'bg-primary-subtle border border-primary'}"></div>
            <div class="flex-grow-1 text-start">
                <div class="fw-bold text-dark">Zasób ${dzialka.numer}</div>
                <small class="text-muted d-block mb-1">ID: ${dzialka.id} • Pow: ${dzialka.pow}</small>
                <span class="badge ${czyLicytacja ? 'text-bg-warning text-dark' : `bg-${kolor}`} rounded-pill small fw-bold">
                    ${czyLicytacja ? 'Licytacja' : dzialka.typ}
                </span>
            </div>
        `;
        karta.addEventListener('click', () => otworzSzczegoly(dzialka));
        plotListContainer.appendChild(karta);

        // B. Generowanie wierszy tabeli w Panelu Urzędnika (Dla Administratora)
        if (adminTableBody) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold">${dzialka.numer}</td>
                <td><code class="small text-muted">POLYGON</code></td>
                <td>${dzialka.pow}</td>
                <td><span class="badge bg-${kolor}">${dzialka.typ}</span></td>
                <td class="fw-bold text-dark">${dzialka.cena}</td>
                <td><span class="badge ${czyLicytacja ? 'bg-warning text-dark' : 'bg-success'}">${dzialka.status}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger shadow-sm border-0" onclick="usunDzialke(${dzialka.id})" title="Usuń trwale">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </td>
            `;
            adminTableBody.appendChild(tr);
        }
    });
    uruchomFiltrowanie();
}

// 4. WYŚWIETLANIE MODALA (Karta Geodezyjna Nieruchomości)
function otworzSzczegoly(dzialka) {
    const modal = new bootstrap.Modal(document.getElementById('dzialkaModal'));
    document.getElementById('modalIdPlot').textContent = dzialka.id;
    document.getElementById('modalNumerPlot').textContent = dzialka.numer;
    document.getElementById('modalTypePlot').textContent = dzialka.typ;
    document.getElementById('modalTypePlot').className = `badge bg-${pobierzKolor(dzialka.typ)} text-white`;
    document.getElementById('modalAreaPlot').textContent = dzialka.pow;
    document.getElementById('modalPricePlot').textContent = dzialka.cena;
    document.getElementById('modalStatusPlot').textContent = dzialka.status;
    document.getElementById('copyTargetNum').textContent = dzialka.numer;

    const actionBtn = document.getElementById('modalActionBtn');
    if (dzialka.status === 'Aktywna aukcja' || dzialka.status === 'Aktywna licytacja') {
        actionBtn.classList.remove('d-none');
    } else {
        actionBtn.classList.add('d-none');
    }
    modal.show();
}

// Kopiowanie numeru ewidencyjnego do schowka
document.getElementById('btnCopyPlotNumber')?.addEventListener('click', () => {
    const nr = document.getElementById('copyTargetNum').textContent;
    navigator.clipboard.writeText(nr).then(() => {
        const toast = new bootstrap.Toast(document.getElementById('copyToast'));
        toast.show();
    });
});

// 5. USUWANIE DZIAŁKI (Zadanie Beaty: DELETE /api/dzialki/:id)
window.usunDzialke = async function(id) {
    if (!confirm(`Czy na pewno chcesz usunąć działkę #${id}?`)) return;
    try {
        const wynik = await API.request(`/dzialki/${id}`, 'DELETE');
        alert('✅ ' + (wynik.wiadomosc || 'Działka usunięta z zasobów katastralnych.'));
        pobierzDaneZSerwera(); // Dynamiczne odświeżenie mapy i tabeli na żywo
    } catch (error) {
        alert("❌ Błąd usuwania: " + error.message);
    }
};

// 6. OBSŁUGA FILTRÓW MAPY
function uruchomFiltrowanie() {
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.replaceWith(pill.cloneNode(true));
    });

    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', function() {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            const filtr = this.getAttribute('data-filter');
            document.querySelectorAll('.plot-list-card').forEach(karta => {
                const isLicytacjaCard = karta.dataset.status === 'Aktywna licytacja' || karta.dataset.status === 'Aktywna aukcja';
                if (filtr === 'all' || karta.dataset.typ === filtr || (filtr === 'Aktywna licytacja' && isLicytacjaCard)) {
                    karta.style.setProperty('display', 'flex', 'important');
                } else {
                    karta.style.setProperty('display', 'none', 'important');
                }
            });
        });
    });
}

// 7. DODAWANIE NOWEJ DZIAŁKI (Zadanie Beaty: POST /api/dzialki)
const formNowaDzialka = document.getElementById('formNowaDzialka');
if (formNowaDzialka) {
    formNowaDzialka.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const coordsEl = document.getElementById('plotCoords');
        const areaEl = document.getElementById('plotArea');
        const typeEl = document.getElementById('plotType');
        const priceEl = document.getElementById('plotPrice');

        let geometria;
        try {
            const parsedCoords = JSON.parse(coordsEl.value);
            geometria = { type: "Polygon", coordinates: [parsedCoords] };
        } catch (err) {
            alert("Błąd formatu geometrii! Podaj tablicę punktów, np: [[19.94,50.06],[19.95,50.06],[19.95,50.05],[19.94,50.05],[19.94,50.06]]");
            return;
        }

        const nowaDzialka = {
            geometriaGeoJSON: geometria,
            powierzchnia: parseFloat(areaEl.value.replace(/[^0-9.]/g, '')),
            status: "Dostępna",
            przeznaczenie: typeEl.value,
            cena: priceEl.value ? parseFloat(priceEl.value) : 0.00
        };

        try {
            const wynik = await API.request('/dzialki', 'POST', nowaDzialka);
            alert('✅ ' + (wynik.wiadomosc || 'Nieruchomość gruntowa została zapisana w bazie PostgreSQL.'));
            formNowaDzialka.reset();
            
            const collapseEl = document.getElementById('collapseFormDzialka');
            const bsCollapse = bootstrap.Collapse.getInstance(collapseEl);
            if(bsCollapse) bsCollapse.hide();

            pobierzDaneZSerwera();
        } catch (error) {
            alert("Nie udało się zapisać działki: " + error.message);
        }
    });
}

// 8. FIX DLA ZAKŁADEK SPA (Automatyczne odświeżanie siatki kafelków Leaflet)
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#mapa' || window.location.hash === '') {
        setTimeout(() => map.invalidateSize(), 200);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    pobierzDaneZSerwera();
    setTimeout(() => map.invalidateSize(), 400);
});