import {
    localize,
    getRandomStringFromArray,
} from './utils.js';

var emoji_Copium = ``;
var emoji_Bedge = ``;
var emoji_KEKW = ``;
var emoji_KEKWait = ``;
var emoji_OkaygeBusiness = ``;
var emoji_PeepoClown = ``;
var emoji_Prayge = ``;
var emoji_Sadge = ``;

function findEmoji( myClient, name){

    const emoji = myClient.emojis.cache.find(emoji => emoji.name == name)

    if (emoji == undefined){
        return ``;
    }

    return emoji
}

function initEmojis( client ){
    emoji_Copium = findEmoji(client, 'Copium');
    emoji_Bedge = findEmoji(client, 'Bedge');
    emoji_KEKW = findEmoji(client, 'KEKW');
    emoji_KEKWait = findEmoji(client, 'KEKWait');
    emoji_OkaygeBusiness = findEmoji(client, 'OkaygeBusiness');
    emoji_PeepoClown = findEmoji(client, 'PeepoClown');
    emoji_Prayge = findEmoji(client, 'Prayge');
    emoji_Sadge = findEmoji(client, 'Sadge');
}

function text_lowTension(client){

    initEmojis(client);

    return localize(
    getRandomStringFromArray([
        `Tranquille c\'est le début, on y croit`,
        `C\'est rien c\'est rien il arrive après le GP`,
        `C\'est que le début`,
        `10% c\'est 100% ${emoji_Bedge}`,
        `De toute manière il est pourri ce GP ${emoji_Bedge}`,
        `Je suis sur que t'as déjà toutes les 2star ${emoji_Bedge}`,
        `T\'as pas le droit de nous faire perdre espoir comme ca...`,
        `MAIS C\'ÉTAIT SUR EN FAIT, C\'ÉTAIT SUUUUR`,
        `Pas de bras, pas de chocolat ${emoji_KEKWait}`,
        `Avoir un gp, c\’est comme essayer de faire 3 fois face avec Ondine, impossible. ${emoji_KEKWait}`,
        `La légende raconte que quelqu\’un, quelque part, a déjà vu un God Pack... Mais pas toi ${emoji_KEKW}`,
        `Raté... C'est comme chercher un Shiny sans Charme Chroma ${emoji_Sadge}`,
        `Aïe aïe aïe`,
        `Y\'a R ${emoji_Copium}`]),
    getRandomStringFromArray([
        `It\'s fine, we just started`,
        `10% = 100% ${emoji_Bedge}`,
        `Nah we\'re good, the gp is on his way ${emoji_Copium}`])
    );
}
function text_mediumTension(client){

    initEmojis(client);

    return localize(
    getRandomStringFromArray([
        `Il commence à y avoir une petite odeur la non ${emoji_KEKWait}?`,
        `C\'est terrible ce qui se passe ${emoji_Sadge}`,
        `Petit ${emoji_Prayge} et ca passe tranquille`,
        `Plus rien ne va... ${emoji_Sadge}`,
        `Si c\'est vraiment dead on vire l\'host en même temps que son pack ${emoji_KEKW}`,
        `Qu\'est-ce qu\'on t\'a fait pour mériter ça ${emoji_KEKWait}`,
        `Attendre d'avoir un gp alive, c'est comme attendre avec l'envie de caguer sans jamais pouvoir y aller ${emoji_KEKWait}`,
        `À ce rythme, tu vas écrire un livre : 1001 façons de ne PAS choper un God Pack ${emoji_PeepoClown}`,
        `Moi j\'y crois encore tkt ${emoji_Copium}`]),
    getRandomStringFromArray([
        `Forget about it, next one is GP ${emoji_Prayge}`,
        `Damn that stinks for sure`])
    );
} 
function text_highTension(client){

    initEmojis(client);

    return localize(
    getRandomStringFromArray([
        `OOF ${emoji_Sadge}`,
        `UUUUUUUUUUUUUUUUUUSTRE`,
        `Un GP de moins ici c\'est du karma en plus ${emoji_OkaygeBusiness}`,
        `Ca fait beaucoup là, non... ?`,
        `TU ES TILTÉ BOUBOU ! TU AS BESOIN DE BOL ! ${emoji_KEKW}`,
        `T'as mieux fait de perdre celui la que de rater le pick d'un 4/5`,
        `C'est ciao.`,
        `Oh pinaise un gp invalide Marge fourre moi le donut sucré au sucre`,
        `Tout espoir est perdu ${emoji_Sadge}`,
        `Le prochain GP c'est le bon ${emoji_Copium}`,
        `"Quoient... Encore un gp dead...`,
        `Rentrons il commence à pleuvoir...`]),
        getRandomStringFromArray([
        `It was at this moment that he knew... The gp was fucked up`,
        `EMOTIONAL DAMAGE`,
        `ALRIGHT EVERYBODY WAKE UP IT\'S NOT DEAD I PROMISE, RNJESUS TOLD ME ${emoji_Copium}`,
        `Let\'s just forget about it...`])
    );
}

export{
    text_lowTension,
    text_mediumTension,
    text_highTension,
}