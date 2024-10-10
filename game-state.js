let currentPhaseIndex;
let currentTurn;
const phases = [
    "Phase de Commandement",
    "Phase de Mouvement",
    "Phase de Tir",
    "Phase de Charge",
    "Phase de Combat"
];
const lexique = {
    "Réserve Stratégique":"vous aurez la possibilité d’arriver sur le champ de bataille même dans la zone de déploiement adverse",
    "Précision":"Chaque fois qu’une " +
        "attaque faite avec une telle arme réussit à blesser une " +
        "unité Attachée (p. 39), si une figurine Personnage" +
        "dans l’unité cible est visible de la figurine attaquante, " +
        "le joueur contrôlant cette dernière peut choisir que " +
        "l’attaque soit allouée à la figurine Personnage au lieu " +
        "de suivre la séquence d’attaque normale.",
    "Bénéfice du Couvert":" On ajoute 1 aux jets de " +
        "sauvegarde d’armure contre les attaques de tir." +
        "■ Ne s’applique pas aux figurines ayant une " +
        "Sauvegarde de 3+ ou meilleure contre des " +
        "attaques ayant une PA de 0." +
        "■ On ne peut pas cumuler plusieurs occurrences."
};

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
    const divActiveElement = document.getElementById('stratagem-active-list');
    let stratagem_id = 1;
    data.forEach(item => {
        const listItem = createStratagemeListItem(item, stratagem_id);
        const activListItem = createStratagemeListItem(item, stratagem_id);
        divElement.appendChild(listItem);
        divActiveElement.appendChild(activListItem);
        stratagem_id = stratagem_id + 1;
    });
    lexiqueSelector();
    updateStratagems();
    updateActiveStratagems();
    // Sélectionne tous les boutons avec la classe stratagem-button
        divElement.querySelectorAll('.stratagem-button')
            .forEach(button => {
                button.addEventListener('click', (e) => stratagemButtonUse(e));
            });

    // Sélectionne tous les boutons avec la classe stratagem-button-cancel
        divElement.querySelectorAll('.stratagem-button-cancel')
            .forEach(button => {
                button.addEventListener('click', (e) => stratagemButtonCancelUse(e));
            });
    divActiveElement.querySelectorAll('button').forEach(button => {
        button.style.display = "none";
    });
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
    updateStratagems();
    updateActiveStratagems();
}

function showSelectedStratagems(query){
    let selected = document.getElementById('stratagem-available-list').querySelectorAll(query);
    selected.forEach(item => {
        item.style.display = 'block';
    })
}

function updateStratagems() {
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
    let selected = document.getElementById('stratagem-available-list')
        .querySelectorAll(".stratagem-card");
    selected.forEach(item => {
        const children = item.children;
        for (let i = 0; i < children.length; i++) {
            children[i].style.opacity = "1";
        }
        item.querySelector('.stratagem-button-cancel').style.display = "none";
        item.querySelector('.stratagem-button').style.display = "block";
        item.style.display = 'none';
    })
    showSelectedStratagems(query_any_any);
    showSelectedStratagems(query_any_current);
    showSelectedStratagems(query_current_any);
    showSelectedStratagems(query_current_current);
}

function updateActiveStratagems(){
    let selected = document.getElementById('stratagem-active-list')
        .querySelectorAll(".stratagem-card");
    selected.forEach(item => {
        item.style.display = 'none';
    })
}

function mettreEnGras(str) {
    return str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
function createStratagemeListItem(item, stratagem_id) {
    const card = document.createElement("div");
    card.classList = "stratagem-id-" + stratagem_id + " stratagem-card stratagem-phase-"
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
    title.innerHTML = mettreEnGras(item.name);
    const stratagem_button = document.createElement('button');
    stratagem_button.classList = "stratagem-button";
    stratagem_button.textContent = "Utiliser";
    const stratagem_button_cancel = document.createElement('button');
    stratagem_button_cancel.classList = "stratagem-button-cancel";
    stratagem_button_cancel.style.display = "none";
    stratagem_button_cancel.textContent = "Annuler";
    stratagem_button.onclick = (event) => stratagemButtonUse(event, stratagem_button_cancel);
    const stratagem_cost = document.createElement('span');
    stratagem_cost.classList= "stratagem-cost";
    stratagem_cost.textContent = item.cost +' PC';
    const stratagem_title = document.createElement('span');
    stratagem_title.textContent = item.title;
    title.appendChild(stratagem_button);
    title.appendChild(stratagem_button_cancel);
    title.appendChild(stratagem_title);
    title.appendChild(stratagem_cost);
    const when = document.createElement("div");
    when.classList = "stratagem-when";
    when.innerHTML = mettreEnGras(item.when);
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
    return card;
}

function stratagemButtonUse(e){
    e.target.style.display = "none";
    e.target.parentNode.querySelector('.stratagem-button-cancel').style.display = "block";
    const elementsToStyle = e.target.parentElement.parentNode.querySelectorAll(
        '.stratagem-target, .stratagem-restrictions, .stratagem-effect, .stratagem-when'
    );

    // Appliquer le style à tous les éléments correspondants
    elementsToStyle.forEach(element => {
        element.style.opacity = "30%";
    });
    let stratagem_id = 0;
    e.target.parentElement.parentNode.classList.forEach((item) => {
        if (item.startsWith("stratagem-id-")){
            stratagem_id = "." + item;
        }
    })
    document.getElementById('stratagem-active-list')
        .querySelector(stratagem_id).style.display = "block";
}

function stratagemButtonCancelUse(e){
    e.target.style.display = "none";
    e.target.parentNode.querySelector('.stratagem-button').style.display = "block";
    const elementsToStyle = e.target.parentElement.parentNode.querySelectorAll(
        '.stratagem-target, .stratagem-restrictions, .stratagem-effect, .stratagem-when'
    );

    // Appliquer le style à tous les éléments correspondants
    elementsToStyle.forEach(element => {
        element.style.opacity = "100%";
    });
    let stratagem_id = 0;
    e.target.parentElement.parentNode.classList.forEach((item) => {
        if (item.startsWith("stratagem-id-")){
            stratagem_id = "." + item;
        }
    })
    document.getElementById('stratagem-active-list')
        .querySelector(stratagem_id).style.display = "none";
}

function lexiqueSelector(){
    let selected = document.querySelectorAll(".stratagem-card");
    selected.forEach(item => {
        Object.keys(lexique).forEach(key => {
            item.innerHTML = item.innerHTML
                .replace(key,"<span class=\"lexique-word\" " +
                    "data-lexique=\""+lexique[key]+"\">"+key+"</span>");
        })
    })
}

function gameReset() {
    localStorage.clear();
    // reload the current page
    window.location.reload();
}