const map = L.map('gisMapContainer').setView([50.061, 19.937], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
let leafletGeoJsonLayer = null;
const plotListContainer = document.getElementById('plotListContainer');

function pobierzKolor(typ) {
    switch(typ) {
        case 'Mieszkalne': return 'primary';
        case 'Usługowe': return 'info';
        case 'Przemysłowe': return 'dark';
        default: return 'secondary';
    }
}

async function pobierzDaneZSerwera() {
    try {
        const dane = await API.request('/dzialki', 'GET');
        renderujDzialki(dane);
    } catch (error) {
        console.error('Błąd połączenia z warstwą GIS:', error);
    }
}

function renderujDzialki(daneZ_API) {
    if (!plotListContainer) return;
    plotListContainer.innerHTML = '';
    const adminTableBody = document.getElementById('dzialki-table-body');
    if (adminTableBody) adminTableBody.innerHTML = '';

    const geoJsonData = {
        type: "FeatureCollection",
        features: daneZ_API.map(dzialka => ({
            type: "Feature",
            geometry: dzialka.wspolrzedne,
            properties: {
                id: dzialka.id,
                numer: dzialka.nazwa || `N/${dzialka.id}`,
                typ: dzialka.przeznaczenie,
                pow: `${dzialka.powierzchnia} m²`,
                cena: dzialka.cena ? `${parseFloat(dzialka.cena).toLocaleString('pl-PL')} PLN` : 'Do ustalenia',
                status: dzialka.status || 'Dostępna'
            }
        }))
    };

    if (leafletGeoJsonLayer) map.removeLayer(leafletGeoJsonLayer);

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
            layer.on('click', () => otworzSzczegoly(feature.properties));
        }
    }).addTo(map);

    if (geoJsonData.features.length > 0) map.fitBounds(leafletGeoJsonLayer.getBounds());

    geoJsonData.features.forEach(feature => {
        const dzialka = feature.properties;
        const kolor = pobierzKolor(dzialka.typ);
        const czyLicytacja = (dzialka.status === 'Aktywna licytacja');

        const karta = document.createElement('button');
        karta.type = 'button';
        karta.className = `plot-list-card d-flex gap-3 align-items-center w-100 border-0 bg-white p-3 mb-2 shadow-sm rounded ${czyLicytacja ? 'border border-warning' : ''}`;
        karta.dataset.typ = dzialka.typ;
        karta.dataset.status = dzialka.status;
        karta.innerHTML = `
            <div class="map-miniature p-3 rounded bg-${kolor}-subtle border border-${kolor}"></div>
            <div class="flex-grow-1 text-start">
                <div class="fw-bold text-dark">${dzialka.numer}</div>
                <small class="text-muted d-block mb-1">ID: ${dzialka.id} • Pow: ${dzialka.pow}</small>
                <span class="badge ${czyLicytacja ? 'text-bg-warning text-dark' : `bg-${kolor}`} rounded-pill small fw-bold">${czyLicytacja ? 'Licytacja' : dzialka.typ}</span>
            </div>
        `;
        karta.addEventListener('click', () => otworzSzczegoly(dzialka));
        plotListContainer.appendChild(karta);

        if (adminTableBody) {
            const tr = document.createElement('tr');
            let statusBtn = czyLicytacja 
                ? `<button class="btn btn-sm btn-outline-secondary me-1" onclick="zmienStatusDzialki(${dzialka.id}, 'Dostępna')" title="Wycofaj z licytacji"><i class="bi bi-arrow-down-circle"></i></button>`
                : `<button class="btn btn-sm btn-outline-warning me-1" onclick="zmienStatusDzialki(${dzialka.id}, 'Aktywna licytacja')" title="Wystaw na licytację"><i class="bi bi-hammer text-dark"></i></button>`;

            tr.innerHTML = `
                <td class="fw-bold">${dzialka.numer}</td>
                <td><code class="small text-muted">POLYGON</code></td>
                <td>${dzialka.pow}</td>
                <td><span class="badge bg-${kolor}">${dzialka.typ}</span></td>
                <td class="fw-bold text-dark">${dzialka.cena}</td>
                <td><span class="badge ${czyLicytacja ? 'bg-warning text-dark' : 'bg-success'}">${dzialka.status}</span></td>
                <td class="text-end text-nowrap">${statusBtn}<button class="btn btn-sm btn-outline-danger" onclick="usunDzialke(${dzialka.id})" title="Usuń trwale"><i class="bi bi-trash3-fill"></i></button></td>
            `;
            adminTableBody.appendChild(tr);
        }
    });

    uruchomFiltrowanie(); // Włączamy z powrotem filtry na liście!
}

function uruchomFiltrowanie() {
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.replaceWith(pill.cloneNode(true));
    });
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', function () {
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
        // Zamiast polegać na błędnym data-bs-dismiss html, obsługujemy przejście ręcznie w JS
        actionBtn.onclick = function() {
            localStorage.setItem('selected_auction_id', dzialka.id);
            const myModalEl = document.getElementById('dzialkaModal');
            const modalInstance = bootstrap.Modal.getInstance(myModalEl);
            if (modalInstance) modalInstance.hide();
            window.location.hash = '#aukcje';
        };
    } else {
        actionBtn.classList.add('d-none');
        actionBtn.onclick = null;
    }
    modal.show();
}

window.usunDzialke = async function (id) {
    if (!confirm(`Czy na pewno chcesz usunąć działkę #${id}?`)) return;
    try {
        await API.request(`/dzialki/${id}`, 'DELETE');
        pobierzDaneZSerwera();
    } catch (error) { alert(" ❌ Błąd usuwania: " + error.message); }
};

window.zmienStatusDzialki = async function(id, nowyStatus) {
    if (!confirm(`Czy chcesz zmienić status działki na: "${nowyStatus}"?`)) return;
    try {
        await API.request(`/dzialki/${id}/status`, 'PATCH', { nowyStatus: nowyStatus });
        pobierzDaneZSerwera();
    } catch (error) { alert(" ❌ Błąd zmiany statusu: " + error.message); }
};

const formNowaDzialka = document.getElementById('formNowaDzialka');
if (formNowaDzialka) {
    formNowaDzialka.addEventListener('submit', async (e) => {
        e.preventDefault();
        const coordsEl = document.getElementById('plotCoords');
        try {
            const nowaDzialka = {
                nazwa: document.getElementById('plotName').value,
                geometriaGeoJSON: { type: "Polygon", coordinates: [JSON.parse(coordsEl.value)] },
                powierzchnia: parseFloat(document.getElementById('plotArea').value.replace(/[^0-9.]/g, '')),
                status: "Dostępna",
                przeznaczenie: document.getElementById('plotType').value,
                cena: parseFloat(document.getElementById('plotPrice').value) || 0
            };
            await API.request('/dzialki', 'POST', nowaDzialka);
            alert(' ✅ Nieruchomość została zapisana.');
            formNowaDzialka.reset();
            pobierzDaneZSerwera();
        } catch (error) { alert("Błąd zapisu! Upewnij się że współrzędne zaczynają się od podwójnego nawiasu [["); }
    });
}

document.getElementById('btnCopyPlotNumber')?.addEventListener('click', () => {
    const nr = document.getElementById('copyTargetNum').textContent;
    navigator.clipboard.writeText(nr).then(() => {
        const toast = new bootstrap.Toast(document.getElementById('copyToast'));
        toast.show();
    });
});

window.addEventListener('hashchange', () => { if (window.location.hash === '#mapa' || window.location.hash === '') setTimeout(() => map.invalidateSize(), 200); });
document.addEventListener('DOMContentLoaded', () => { pobierzDaneZSerwera(); setTimeout(() => map.invalidateSize(), 400); });