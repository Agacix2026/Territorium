const AppState = {
    _data: { zalogowanyUzytkownik: null, rola: 'Gosc', aktywneAukcje: [] },
    getState() { return this._data; },
    updateState(key, value) {
        if (this._data.hasOwnProperty(key)) {
            this._data[key] = value;
            console.log(`[State Update]: Zmieniono '${key}' na:`, value);
        }
    }
};