function handleRouting() {
    const hash = window.location.hash || '#mapa'; 
    const viewName = hash.substring(1); 

    let rola = 'Gosc';
    const userDataString = localStorage.getItem('user_data');
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            rola = userData.rola || 'Gosc';
        } catch (e) {
            console.error('Błąd parsowania danych użytkownika', e);
        }
    }

    if (viewName === 'panel-urzednika' && rola !== 'Admin') {
        alert('Brak uprawnień. Ten panel jest dostępny tylko dla urzędników.');
        window.location.hash = '#mapa'; 
        return; 
    }

    const linkPanelUrzednika = document.querySelector('a[href="#panel-urzednika"]');
    if (linkPanelUrzednika) {
        if (rola === 'Admin') {
            linkPanelUrzednika.parentElement.classList.remove('d-none');
        } else {
            linkPanelUrzednika.parentElement.classList.add('d-none');
        }
    }

    const allViews = document.querySelectorAll('.route-view');
    allViews.forEach(view => {
        view.classList.add('d-none');
        view.style.display = ''; 
    });

    const activeView = document.getElementById(viewName);
    if (activeView) {
        activeView.classList.remove('d-none');
        
        if (viewName === 'mapa' && typeof window.map !== 'undefined') {
            setTimeout(() => {
                window.map.invalidateSize();
            }, 100);
        }
    } else {
        const defaultView = document.getElementById('mapa');
        if (defaultView) defaultView.classList.remove('d-none');
    }

    window.scrollTo(0, 0);
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', handleRouting);