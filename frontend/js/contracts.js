document.addEventListener('DOMContentLoaded', () => {
    const formularz = document.getElementById('formularzUmowy');
    if(!formularz) return; // Zapobiega błędom, gdy jesteśmy na innej podstronie

    const dataStart = document.getElementById('dataStart');
    const dataKoniec = document.getElementById('dataKoniec');
    const bladDaty = document.getElementById('bladDaty');
    const btnZapisz = document.getElementById('btnZapiszUmowe');
    const spinner = document.getElementById('spinnerLadowania');

    formularz.addEventListener('submit', (event) => {
        event.preventDefault();
        let czyPoprawny = true;

        if (dataStart.value && dataKoniec.value) {
            if (new Date(dataKoniec.value) <= new Date(dataStart.value)) {
                czyPoprawny = false;
                dataKoniec.setCustomValidity('Błąd daty'); 
                bladDaty.textContent = 'Data zakończenia musi być późniejsza!';
            } else {
                dataKoniec.setCustomValidity(''); 
            }
        }

        formularz.classList.add('was-validated');
        if (!formularz.checkValidity() || !czyPoprawny) return;

        btnZapisz.disabled = true;
        spinner.classList.remove('d-none');

        setTimeout(() => {
            spinner.classList.add('d-none');
            btnZapisz.disabled = false;
            alert('Sukces! Umowa została wygenerowana.');
            formularz.reset();
            formularz.classList.remove('was-validated');
        }, 1500);
    });
});