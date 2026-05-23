document.addEventListener('DOMContentLoaded', () => {
  const gisMapContainer = document.getElementById('gisMapContainer');
  if (!gisMapContainer) return; // Zabezpieczenie dla SPA!

  const modalElement = document.getElementById('dzialkaModal');
  const dzialkaModal = new bootstrap.Modal(modalElement);
  const toastElement = document.getElementById('copyToast');
  const copyToast = new bootstrap.Toast(toastElement);

  const plotListContainer = document.getElementById('plotListContainer');
  const filterPills = document.querySelectorAll('.filter-pill');
  const btnCopy = document.getElementById('btnCopyPlotNumber');

  const mockDatabase = [
    { id: 'N/101', numer: '45A/1', typ: 'Mieszkalne', pow: '850 m²', cena: '120 000 PLN', status: 'Dostępna', pozycjaY: '15%', pozycjaX: '10%', szerokosc: '140px', kolor: 'primary' },
    { id: 'N/102', numer: '45A/2', typ: 'Usługowe', pow: '1 200 m²', cena: '150 000 PLN', status: 'Aktywna licytacja', pozycjaY: '45%', pozycjaX: '45%', szerokosc: '160px', kolor: 'info' },
    { id: 'N/103', numer: '12/M', typ: 'Przemysłowe', pow: '3 500 m²', cena: '450 000 PLN', status: 'Zarezerwowana', pozycjaY: '25%', pozycjaX: '70%', szerokosc: '140px', kolor: 'dark' }
  ];

  function otworzSzczegoly(daneDzialki) {
    document.getElementById('modalIdPlot').textContent = daneDzialki.id;
    document.getElementById('modalNumerPlot').textContent = daneDzialki.numer;
    document.getElementById('modalAreaPlot').textContent = daneDzialki.pow;
    document.getElementById('modalPricePlot').textContent = daneDzialki.cena;
    document.getElementById('modalStatusPlot').textContent = daneDzialki.status;
    document.getElementById('copyTargetNum').textContent = daneDzialki.numer;

    const typeBadge = document.getElementById('modalTypePlot');
    typeBadge.textContent = daneDzialki.typ;
    typeBadge.className = `badge bg-${daneDzialki.kolor} ${daneDzialki.kolor === 'info' ? 'text-dark' : 'text-white'}`;
    dzialkaModal.show();
  }

  function renderujDzialki(dane) {
    gisMapContainer.innerHTML = '';
    plotListContainer.innerHTML = '';

    dane.forEach(dzialka => {
      const marker = document.createElement('div');
      marker.className = `card map-plot-marker shadow${dzialka.kolor === 'info' ? '' : '-sm'} border-${dzialka.kolor}`;
      marker.style.cssText = `top: ${dzialka.pozycjaY}; left: ${dzialka.pozycjaX}; width: ${dzialka.szerokosc}; cursor: pointer;`;
      marker.dataset.typ = dzialka.typ;
      marker.dataset.status = dzialka.status;
      const czyLicytacja = dzialka.status === 'Aktywna licytacja';
      marker.innerHTML = `
        <div class="card-body p-2 text-center">
          <span class="badge ${czyLicytacja ? 'text-bg-warning text-dark' : `bg-${dzialka.kolor}`} mb-1 shadow-sm fw-bold">
            ${czyLicytacja ? '<i class="bi bi-hammer me-1"></i>Licytacja' : dzialka.typ}
          </span>
          <div class="fw-bold small text-${dzialka.kolor === 'dark' ? 'dark' : dzialka.kolor} mt-1">${dzialka.id}</div>
        </div>
      `;
      marker.addEventListener('click', () => otworzSzczegoly(dzialka));
      gisMapContainer.appendChild(marker);

      const karta = document.createElement('button');
      karta.type = 'button';
      karta.className = `plot-list-card d-flex gap-3 align-items-center ${czyLicytacja ? 'border-info' : ''}`;
      karta.dataset.typ = dzialka.typ;
      karta.dataset.status = dzialka.status;
      karta.innerHTML = `
        <div class="map-miniature ${dzialka.kolor !== 'primary' ? `bg-${dzialka.kolor}-subtle border-${dzialka.kolor}` : ''}"></div>
        <div class="flex-grow-1">
          <div class="fw-bold text-${dzialka.kolor === 'dark' ? 'dark' : dzialka.kolor}">Działka nr ${dzialka.numer}</div>
          <small class="text-muted d-block mb-1">ID: ${dzialka.id} • Pow: ${dzialka.pow}</small>
          <span class="badge ${czyLicytacja ? 'text-bg-warning text-dark' : `bg-${dzialka.kolor}`} rounded-pill small fw-bold">
            ${czyLicytacja ? 'Licytacja' : dzialka.typ}
          </span>
        </div>
      `;
      karta.addEventListener('click', () => otworzSzczegoly(dzialka));
      plotListContainer.appendChild(karta);
    });
    uruchomFiltrowanie();
  }

  async function pobierzDaneZSerwera() {
    gisMapContainer.innerHTML = `<div class="d-flex justify-content-center align-items-center h-100 w-100"><div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div></div>`;
    plotListContainer.innerHTML = `<div class="placeholder-glow mb-3"><div class="placeholder w-100" style="height: 85px; border-radius: 10px;"></div></div><div class="placeholder-glow mb-3"><div class="placeholder w-100" style="height: 85px; border-radius: 10px;"></div></div>`;

    try {
      const pobraneDane = await new Promise(resolve => setTimeout(() => resolve(mockDatabase), 1500));
      renderujDzialki(pobraneDane);
    } catch (error) {
      console.error("Błąd API GIS:", error);
    }
  }

  function uruchomFiltrowanie() {
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const wybranyFiltr = pill.getAttribute('data-filter').toLowerCase().trim();
        const markery = gisMapContainer.querySelectorAll('.map-plot-marker');
        const karty = plotListContainer.querySelectorAll('.plot-list-card');

        markery.forEach(marker => {
          marker.style.display = (wybranyFiltr === 'all' || (marker.dataset.typ || '').toLowerCase() === wybranyFiltr || (marker.dataset.status || '').toLowerCase() === wybranyFiltr) ? 'block' : 'none';
        });

        karty.forEach(karta => {
          karta.style.display = (wybranyFiltr === 'all' || (karta.dataset.typ || '').toLowerCase() === wybranyFiltr || (karta.dataset.status || '').toLowerCase() === wybranyFiltr) ? 'flex' : 'none';
        });
      });
    });
  }

  btnCopy.addEventListener('click', () => {
    const nr = document.getElementById('copyTargetNum').textContent;
    navigator.clipboard.writeText(nr).then(() => { copyToast.show(); }).catch(err => alert('Skopiuj ręcznie: ' + nr));
  });

  pobierzDaneZSerwera();
});