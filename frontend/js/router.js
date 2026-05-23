// router.js - Odpowiada za ścieżki i przełączanie widoków

function handleRouting() {
    // 1. Pobieramy hasz z adresu URL. Domyślnie ustawiamy '#mapa'
    const hash = window.location.hash || '#mapa'; 
    const viewName = hash.substring(1); 

    // 2. Pobieramy wszystkie widoki (moduły)
    const allViews = document.querySelectorAll('.route-view');
    
    // 3. Ukrywamy wszystkie widoki za pomocą Bootstrapa
    allViews.forEach(view => {
        view.classList.add('d-none');
        view.style.display = ''; 
    });

    // 4. Pokazujemy tylko ten widok, który jest aktualnie w adresie URL
    const activeView = document.getElementById(viewName);
    if (activeView) {
        activeView.classList.remove('d-none');
    } else {
        const defaultView = document.getElementById('mapa');
        if (defaultView) defaultView.classList.remove('d-none');
    }

    // 5. NAPRAWA SKAKANIA: Wymuszamy powrót na samą górę strony natychmiast po zmianie widoku!
    window.scrollTo(0, 0);
}

// Uruchamiamy router przy starcie strony i po każdym kliknięciu w link
window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', handleRouting);