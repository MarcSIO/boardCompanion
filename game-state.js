let currentPhaseIndex;
let currentTurn;
const phases = [
    "Phase de Commandement",
    "Phase de Mouvement",
    "Phase Psychique",
    "Phase de Tir",
    "Phase de Charge",
    "Phase de Combat",
    "Phase de Moral"
];

document.addEventListener('DOMContentLoaded', async () => {
    loadDataToSelect('units_of_astra_militarum.json', 'unit-select');
    loadDataToSelect('optis_of_astra_militarum.json', 'optis-select');
    loadDataToStratagems('stratagems_of_astra_militarum.json', 'stratagem-available-list');
    document.getElementById("unit-select")
        .addEventListener("change", (e) => activateSelectButtonOnChange(e, "add-unit-button"));
    document.getElementById("optis-select")
        .addEventListener("change", (e) => activateSelectButtonOnChange(e, "add-opti-button"));

    restoreListFromLocalStorage('army', 'army-list', removeUnit);
    restoreListFromLocalStorage('optimisations', 'optis-list', removeOpti);
    currentPhaseIndex = localStorage.getItem('currentPhaseIndex') || 0;
    currentTurn = localStorage.getItem('currentTurn') || 'Moi';

    if (localStorage.getItem('beginner')) {
        showGameView();
    }
});

function activateSelectButtonOnChange(event, button_id) {
    if (event.target.value) {
        document.getElementById(button_id).disabled = false;
    } else {
        document.getElementById(button_id).disabled = true;
    }
}

function loadDataToSelect(url, selectId) {
    fetch(url)
        .then(response => response.json())
        .then(data => populateSelect(data, selectId))
        .catch(error => console.error(`Erreur lors du chargement de ${url}:`, error));
}

function loadDataToStratagems(url, divId) {
    fetch(url)
        .then(response => response.json())
        .then(data => populateSratagems(data, divId))
        .catch(error => console.error(`Erreur lors du chargement de ${url}:`, error));
}

function populateSelect(data, selectId) {
    const selectElement = document.getElementById(selectId);
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.name;
        selectElement.appendChild(option);
    });
}

function populateSratagems(data, divId) {
    const divElement = document.getElementById(divId);
    data.forEach(item => {
        const listItem = createStratagemeListItem(item)
        divElement.appendChild(listItem);
    });
    updateStratagems();
}

function restoreListFromLocalStorage(key, listId, removeCallback) {
    const items = JSON.parse(localStorage.getItem(key)) || [];
    items.forEach(item => {
        const listItem = createListItem(item, removeCallback);
        document.getElementById(listId).appendChild(listItem);
    });
}

function addSelectedItemToList(selectId, listId, storageKey, removeCallback) {
    const selectElement = document.getElementById(selectId);
    const itemName = selectElement.value;
    if (itemName) {
        const listItem = createListItem(itemName, removeCallback);
        document.getElementById(listId).appendChild(listItem);
        addListItemInLocalStorage(storageKey, itemName);
        selectElement.selectedIndex = 0; // Reset the select
    }
    this.event.target.disabled = true;
}

function createListItem(name, removeCallback) {
    const listItem = document.createElement('li');
    listItem.textContent = name;
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Supprimer';
    deleteButton.className = 'delete-button';
    deleteButton.onclick = () => {
        listItem.remove();
        removeCallback(name);
    };
    listItem.appendChild(deleteButton);
    return listItem;
}

function addListItemInLocalStorage(key, item) {
    let items = JSON.parse(localStorage.getItem(key)) || [];
    items.push(item);
    localStorage.setItem(key, JSON.stringify(items));
}

function removeUnit(unitName) {
    removeListItemFromLocalStorage('army', unitName);
}

function removeOpti(optiName) {
    removeListItemFromLocalStorage('optimisations', optiName);
}

function removeListItemFromLocalStorage(key, itemName) {
    let items = JSON.parse(localStorage.getItem(key)) || [];
    items = items.filter(item => item !== itemName);
    localStorage.setItem(key, JSON.stringify(items));
}

function resetArmy() {
    localStorage.removeItem('army');
    localStorage.removeItem('optimisations');
    document.getElementById('army-list').innerHTML = '';
    document.getElementById('optis-list').innerHTML = '';
}

// Gestion des phases
function saveWinner() {
    const winnerSelect = document.getElementById('winner-select');
    const winnerName = winnerSelect.value;

    if (winnerName) {
        // Enregistrer le gagnant dans le localStorage
        localStorage.setItem('beginner', winnerName);
        currentTurn = winnerName;
        localStorage.setItem('currentTurn', currentTurn);

        // Masquer la vue du jet de dé et afficher la vue principale du jeu
        showGameView();
    } else {
        alert('Veuillez sélectionner un gagnant.');
    }
}

function showDiceView() {
    // Masquer la section de configuration de l'armée
    document.getElementById('army-selection-view').style.display = 'none';
    document.getElementById('game-view').style.display = 'none';
    document.getElementById('dice-view').style.display = 'block';
}

function showGameView() {
    // Masquer la section de configuration de l'armée
    document.getElementById('army-selection-view').style.display = 'none';
    document.getElementById('dice-view').style.display = 'none';
    document.getElementById('game-view').style.display = 'block';
    updateTurnDisplay();
}

function updateTurnDisplay() {
    document.getElementById('current-turn-value').textContent = currentTurn;
    document.getElementById('current-phase-value').textContent = phases[currentPhaseIndex];
}

function nextPhase() {
    // ligne ajoutée suite à un bug incompréhensible et non reproduit 5mn plus tard
    const oldCurrentIndex = currentPhaseIndex;
    currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
    // if ajouté suite à un bug incompréhensible et non reproduit 5mn plus tard
    if(oldCurrentIndex == currentPhaseIndex){
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
    }
    currentTurn = (currentPhaseIndex === 0) ? (currentTurn === 'Moi' ? 'L\'adversaire' : 'Moi') : currentTurn;
    document.getElementById('current-turn-value').textContent = currentTurn;
    document.getElementById('current-phase-value').textContent = phases[currentPhaseIndex];
    localStorage.setItem('currentPhaseIndex', currentPhaseIndex);
    localStorage.setItem('currentTurn', currentTurn);
    console.log('current phase index');
    console.log(currentPhaseIndex);
    updateStratagems();
}

function showSelector(query){
    console.log(query);
    let selected = document.querySelectorAll(query);
    selected.forEach(item => {
        item.style.display = 'block';
    })
}

function updateStratagems() {
    console.log("updateStratagems");
    let query_any_any = ".stratagem-turn-any.stratagem-phase-any";
    let query_any_current = ".stratagem-turn-any.stratagem-phase-" + currentPhaseIndex;
    let query_current_any;
    let query_current_current;
    if(currentTurn == "Moi"){
        query_current_any = ".stratagem-turn-me.stratagem-phase-any";
        query_current_current = ".stratagem-turn-me.stratagem-phase-" + currentPhaseIndex;
    }
    else {
        query_current_any = ".stratagem-turn-opponent.stratagem-phase-any";
        query_current_current = ".stratagem-turn-opponent.stratagem-phase-" + currentPhaseIndex;
    }
    let selected = document.querySelectorAll(".stratagem-card");
    selected.forEach(item => {
        item.style.display = 'none';
    })
    showSelector(query_any_any);
    showSelector(query_any_current);
    showSelector(query_current_any);
    showSelector(query_current_current);
}

function mettreEnGras(str) {
    return str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
function createStratagemeListItem(item) {
    const card = document.createElement("div");
    card.classList = "stratagem-card stratagem-phase-"
    if(item?.phaseIndex || item.phaseIndex===0) {
        card.classList += item.phaseIndex;
    }
    else {
        card.classList += "any";
    }
    card.classList += " stratagem-turn-"
    if(item?.turn) {
        card.classList += item.turn;
    }
    else {
        card.classList += "any";
    }
    const title = document.createElement("div");
    title.classList = "stratagem-title";
    title.textContent = mettreEnGras(item.name);
    title.innerHTML += ' <span class="stratagem-cost">'+item.cost+' PC</span> ';
    const when = document.createElement("div");
    when.classList = "stratagem-when";
    when.textContent = item.when;
    const target = document.createElement("div");
    target.classList = "stratagem-target";
    target.innerHTML = "<strong>Cible</strong> : "+mettreEnGras(item.target);
    const effect = document.createElement("div");
    effect.classList = "stratagem-effect";
    effect.innerHTML = mettreEnGras(item.effect);
    let restrictions;
    if(item?.restrictions){
        restrictions = document.createElement("div");
        restrictions.classList = "stratagem-restrictions";
        restrictions.innerHTML = mettreEnGras(item.restrictions);
    }
    card.appendChild(title);
    card.appendChild(when);
    card.appendChild(target);
    card.appendChild(effect);
    if(item?.restrictions) {
        card.appendChild(restrictions);
    }
    card.style.display = 'none';
    return card;
}

function gameReset() {
    localStorage.clear();
    // reload the current page
    window.location.reload();
}