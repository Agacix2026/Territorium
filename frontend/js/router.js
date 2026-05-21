function handleRouting() {
    // Zmieniono domyślny hash z '#kataster' na '#mapa'
    const hash = window.location.hash || '#mapa'; 
    const viewName = hash.substring(1); 

    const allViews = document.querySelectorAll('.route-view');
    allViews.forEach(view => {
        view.style.display = 'none';
    });

    const activeView = document.getElementById(viewName);
    if (activeView) {
        activeView.style.display = 'block';
    } else {
        // Opcjonalnie: jeśli ktoś wpisze zły adres, przekieruj na mapę
        document.getElementById('mapa').style.display = 'block';
    }
}