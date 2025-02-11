// No creative commons or anything, do what you want with that bot
//
// Bot written by @thobi (discord) made to work with Arturo PTCG Bot for the PTCGP Rerollers community
// See here : https://github.com/Arturo-1212/PTCGPB
// Automated ids.txt modifications thanks to CJ and Arturo
//
// What to input into Config.json file ?
//
// token : You need to create an application on the discord developper portal, if you don't know how to do it, check tutorials about how to create an app
// guildID : In developper mode,  In developper mode, right click your server then > copy ID
// channelID_IDSync : In developper mode, right click the channel on your server where have their webhook linked then > copy ID
// channelID_GPVerificationForum : In developper mode, right click the channel where you want to GP to be re-posted as forum post (which are a lot more easily readable to track what account do you need to test) then > copy ID
// channelID_Webhook : In developper mode, right click the channel on your server where have their webhook linked then > copy ID
//
// for the git stuff check https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#update-a-gist
// You need to create a Gist on GitGist, create a token on github and allow it to read/write your Gists

// Imports

import { Octokit } from '@octokit/core';

import {
    token,
    guildID,
    channelID_IDSync,
    channelID_GPVerificationForum,
    channelID_Webhook,
    channelID_Heartbeat,
    gitToken,
    gitGistID,
} from './config.js';

import {
    attrib_PocketID,
    attrib_Active,
    attrib_AverageInstances,
    attrib_HBInstances,
    attrib_RealInstances,
    attrib_SessionTime,
    attrib_TotalPacksOpened, 
    attrib_SessionPacksOpened,
    attrib_GodPackFound,
    attrib_LastActiveTime,
    attrib_LastHeartbeatTime,
} from './xmlConfig.js';

import {
    Client,
    Events,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    ThreadAutoArchiveDuration,
    Routes,
    PermissionsBitField,
    time,
} from 'discord.js';

import {
    doesUserProfileExists,
    setUserAttribValue,
    getUserAttribValue,
    getActiveUsers,
    getUsernameFromUsers, 
    getUsernameFromUser, 
    getIDFromUsers, 
    getIDFromUser, 
    getAttribValueFromUsers,
    getAttribValueFromUser,
    cleanString,
} from './xmlManager.js';

// Global Var

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	]
});

const rest = new REST().setToken(token);
const GitGistName = "FrenchiesIDs.txt"

const text_verifiedLogo = "✅";
const text_deadLogo = "💀";
const text_waitingLogo = "⌛";

// ID GitGist Management

const octokit = new Octokit({
    auth: gitToken
})

async function updateGist( newContent ){

    console.log("================ Update GistGit ================")

    await octokit.request(`PATCH /gists/${gitGistID}`,{
        gist_id: 'gitGistID',
        description: '',
        files:{
            [GitGistName]:{
                content: newContent
            }
        },
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
}

// async function updateGist( newContent ){
//     console.log("================ Update GistGit ================")
// }

// Functions

function sumIntArray( arrayNumbers ) {
    return arrayNumbers.reduce((accumulator, currentValue) => parseInt(accumulator) + parseInt(currentValue), 0);
}

function sumFloatArray( arrayNumbers ) {
    return arrayNumbers.reduce((accumulator, currentValue) => parseFloat(accumulator) + parseFloat(currentValue), 0);
}

function roundToOneDecimal(num) {
    return parseFloat(num.toFixed(1));
}

function countDigits(str) {
    return (str.match(/\d/g) || []).length;
}

function extractNumbers(str) {
    return (str.match(/\d+/g) || []).map(Number);
}

function isNumbers( input ){
    var isNumber = true;
    for (let i = 0; i < input.length; i++) {
        if(!/^\d+$/.test(input.charAt(i))){
            isNumber = false;
        }
    }
    return isNumber;
}

function splitMulti(str, tokens){
    var tempChar = tokens[0]; // We can use the first token as a temporary join character
    for(var i = 1; i < tokens.length; i++){
        str = str.split(tokens[i]).join(tempChar);
    }
    str = str.split(tempChar);
    return str;
}

async function bulkDeleteMessages(channel, numberOfMessages) {
    try {
        let messagesToDelete = [];
        let totalDeleted = 0;

        // Fetch messages in batches of 100
        while (totalDeleted < numberOfMessages) {
            const messages = await channel.messages.fetch({ limit: 100 });
            const messagesToDelete = messages.filter(msg => !msg.pinned);

            if (messagesToDelete.length === 0) {
                break;
            }

            await channel.bulkDelete(messagesToDelete);
            totalDeleted += messagesToDelete.length;
        }
    } catch (error) {
        console.error('Error deleting messages:', error);
    }
}

function colorText( text, color ){
    
    if(color == "gray")
        return `[2;30m${text}[0m`

    if(color == "red")
        return `[2;31m${text}[0m`

    if(color == "green")
        return `[2;32m${text}[0m`

    if(color == "yellow")
        return `[2;33m${text}[0m`

    if(color == "blue")
        return `[2;34m${text}[0m`

    if(color == "pink")
        return `[2;35m${text}[0m`

    if(color == "cyan")
        return `[2;36m${text}[0m`
}

function addBar(str, targetLength) {
    const currentLength = str.length;
    // Calculate the number of spaces needed to reach the target length
    const spacesNeeded = Math.max(targetLength - currentLength - 1,0);
    // Create a string of spaces
    const spaces = ' '.repeat(spacesNeeded);
    // Return the string with the spaces and the bar added
    return str + spaces + colorText('|', "gray");
}

async function usersInfos( users, members ){

    var usersInfos = []

    for (const user of users) {

        var usersOutput = `\`\`\`ansi\n`;
        var userOutput = "";

        const id = getIDFromUser(user);
        const username = getUsernameFromUser(user);
        var visibleUsername = username;

        // Activity check
        members.forEach( member =>{
            if(username === member.user.username) {
                visibleUsername = member.displayName;
            }
        });

        const lastActiveTime = new Date(getAttribValueFromUser(user, attrib_LastActiveTime));
        const lastHBTime = new Date(getAttribValueFromUser(user, attrib_LastHeartbeatTime));
        const currentTime = new Date();
        const diffActiveTime = (currentTime - lastActiveTime) / 60000;
        const diffHBTime = (currentTime - lastHBTime) / 60000;

        var activeState = 0; // 0=missing - 1=waiting - 2=valid

        if(diffActiveTime < 31) { // If player added less than 31mn ago (might still not have received HB)
            if(diffHBTime < 31){ // If less than 31mn since last HB
                userOutput += colorText(visibleUsername, "green");
                activeState = 2;
            }
            else{
                userOutput += colorText(visibleUsername, "yellow") + " - started";
                activeState = 1;
            }
        }
        else{ // If player added more than 31mn ago (HB have been received)
            if(diffHBTime < 31){ // If less than 31mn since last HB
                userOutput += colorText(visibleUsername, "green");
                activeState = 2;
            }
            else{
                userOutput += colorText(visibleUsername, "red") + " - inactive";
            }
        }

        userOutput = addBar(userOutput, 40);

        // Instances
        var instances = "0";
        if( activeState == 2 ){
            instances = getAttribValueFromUser(user, attrib_HBInstances, 0);
        }
        else{
            instances = getAttribValueFromUser(user, attrib_AverageInstances, 0);
        }
        userOutput += colorText(` ${instances} instances\n`, "gray");
        await setUserAttribValue( id, username, attrib_RealInstances, instances );

        // Session stats
        var sessionTime = roundToOneDecimal(parseFloat(getAttribValueFromUser(user, attrib_SessionTime)));
        var sessionPacks = parseFloat(getAttribValueFromUser(user, attrib_SessionPacksOpened));


        const text_Session = colorText("Session:", "gray");
        const text_sessionTime = colorText("running for " + sessionTime + " mn", "gray");
        const text_sessionPacks = colorText("with " + sessionPacks + " packs", "gray");
        var sessionAvgPackMn = roundToOneDecimal(sessionPacks/sessionTime);
        sessionAvgPackMn = sessionTime == 0 || sessionPacks == 0 ? 0 : sessionAvgPackMn;
        const text_avgPackMn = colorText(sessionAvgPackMn, "blue");

        userOutput += `    ${text_Session} ${text_avgPackMn} packs/mn  ${text_sessionTime} ${text_sessionPacks}\n`

        // Pack stats
        const totalPack = parseInt(getAttribValueFromUser(user, attrib_TotalPacksOpened));
        const sessionPack = parseInt(getAttribValueFromUser(user, attrib_SessionPacksOpened));
        const totalGodPack = parseInt(getAttribValueFromUser(user, attrib_GodPackFound));
        const avgGodPack = roundToOneDecimal(totalGodPack >= 1 ? (totalPack+sessionPack)/totalGodPack : (totalPack+sessionPack));

        const text_GPAvg = colorText("GP Avg:", "gray");
        const text_Packs = colorText("Packs:", "gray");
        const text_GP = colorText("GP:", "gray");
        const text_TotalPack = colorText(totalPack + sessionPack, "blue");
        const text_TotalGodPack = colorText(totalGodPack, "blue");
        const text_GPRatio = totalGodPack >= 1 ? '1/' : '0/';
        const text_AvgGodPack = colorText(`${text_GPRatio}${avgGodPack}`, `blue`);

        userOutput += `    ${text_Packs} ${text_TotalPack}  ${text_GP} ${text_TotalGodPack}  ${text_GPAvg} ${text_AvgGodPack} packs`

        usersOutput += userOutput + `\n\`\`\``;
        usersInfos.push(usersOutput);
    };

    
    return usersInfos;
}

async function sendUpdatedListOfIds( guild, update_server ){

    await bulkDeleteMessages(guild.channels.cache.get(channelID_IDSync), 20);

    // CACHE MEMBERS
    const m = await guild.members.fetch()

    var activeUsers = await getActiveUsers();
    var activeUsersInfos = await usersInfos(activeUsers, m);

    // Send users data message by message otherwise it gets over the 2k words limit
    guild.channels.cache.get(channelID_IDSync).send({content:`# Liste des rerollers actifs :\n`}) // ENG : ## List of active rerollers
    activeUsersInfos.forEach( activeUserInfos =>{
        guild.channels.cache.get(channelID_IDSync).send({content:activeUserInfos});
    });

    // Update Users
    activeUsers = await getActiveUsers();
    const activePocketIDs = getAttribValueFromUsers(activeUsers, attrib_PocketID, "").join('\n');
    const activeInstances = getAttribValueFromUsers(activeUsers, attrib_RealInstances, [0]);
    const instancesAmount = sumIntArray(activeInstances);

    const globalsessionTime = getAttribValueFromUsers(activeUsers, attrib_SessionTime, [0]);
    const globalsessionPacks = getAttribValueFromUsers(activeUsers, attrib_SessionPacksOpened, [0]);
    const accumulatedSessionTime = sumFloatArray(globalsessionTime);
    const accumulatedsessionPacks = sumFloatArray(globalsessionPacks);
    const accumulatedPackSec = roundToOneDecimal((accumulatedsessionPacks/accumulatedSessionTime) * globalsessionPacks.length);

    const text_activeInstances = `## ${instancesAmount} Instances à environ ${accumulatedPackSec} packs/mn\n\n`; // ENG : ## Running instances
    const text_activePocketIDs = `*Contenu de IDs.txt :*\n\`\`\`\n${activePocketIDs}\n\`\`\``; // ENG : Content of ids.txt :

    // Send instances and IDs
    guild.channels.cache.get(channelID_IDSync).send({ content:`${text_activeInstances}${text_activePocketIDs}`});
    if(update_server){
        updateGist(activePocketIDs);
    }
}

// Events

client.once(Events.ClientReady, async c => {
    console.log(`Logged in as ${c.user.tag}`);

    const guild = client.guilds.cache.get(guildID);

    const interval = 960000; // in ms = 16mn
    setInterval(() => sendUpdatedListOfIds(guild, false), interval);

    // // Clear all guild commands (Warning : also clearupdateGist channels restrictions set on discord)
    // const guild = await client.guilds.fetch(guildID);
    // guild.commands.set([]);

    // Commands Creation

    const playeridSCB = new SlashCommandBuilder()
        .setName(`setplayerid`)
        .setDescription(`Lie votre code ami à votre pseudo discord unique\n`) // ENG : Link your ID Code with you Discord unique username
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("votre ID SANS TIRET") // ENG : Your ID without any dash
                .setRequired(true)
        );

    const instancesSCB = new SlashCommandBuilder()
        .setName(`setaverageinstances`)
        .setDescription(`Renseignez votre nombre d'instance moyen, sert à savoir combien d'instances tournent\n`) // ENG : Set to your average number of instances, used to know how many instances running at current time
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Nombres ronds (ex: pas 5.5 parce que vous etes a 6 et de fois 5)") // ENG : Round nombers (ex : not 5.5 if you're running 5 and sometimes 6)
                .setRequired(true)
        );

    const addSCB = new SlashCommandBuilder()
        .setName(`add`)
        .setDescription(`Vous ajoute dans le doc d'ID`) // ENG : Add yourself from the active rerollers list
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("ADMIN ONLY : seulement utile pour renseigner quelqu'un d'autre que soit") // ENG : Only usefull so add someone else than yourself
                .setRequired(false)
        );

    const removeSCB = new SlashCommandBuilder()
        .setName(`remove`)
        .setDescription(`Vous retire dans le doc d'ID`) // ENG : Withdraw yourself from the active rerollers list
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("ADMIN ONLY : seulement utile pour renseigner quelqu'un d'autre que soit") // ENG : ADMIN ONLY : Only usefull so remove someone else than yourself
                .setRequired(false)
        );

    const refreshSCB = new SlashCommandBuilder()
        .setName(`refresh`)
        .setDescription(`Rafraichit la liste des codes actifs`); // ENG : Refresh the codes of actives people rerolling

    const verifiedSCB = new SlashCommandBuilder()
        .setName(`verified`)
        .setDescription(`Designe pack valide, 1 god pack = 10% chance d'apparaître dans WP`); // ENG : Set the post as valid

    const deadSCB = new SlashCommandBuilder()
        .setName(`dead`)
        .setDescription(`Designe pack invalide, 1 god pack = 10% chance d'apparaître dans WP`); // ENG : Set the post as invalid / dud

    const missSCB = new SlashCommandBuilder()
        .setName(`miss`)
        .setDescription(`Pour la verif, après X fois suivant le nombre de pack cela auto /dead`); // ENG : For verification purposes, after X times based on pack amount it sends /dead

    const generateusernamesSCB = new SlashCommandBuilder()
        .setName(`generateusernames`)
        .setDescription(`Génère liste basé sur suffixe et, facultatif, des mots `) // ENG : Generate a list based on a suffix and, if wanted, keywords
        .addStringOption(option =>
            option
                .setName("suffix")
                .setDescription("Les 3 ou 4 premières lettres premières lettres de votre pseudo") // ENG : The 3 or 4 firsts letter of your pseudo
                .setRequired(true)
        ).addStringOption(option2 =>
            option2
                .setName("keywords")
                .setDescription("Des mots clés qui seront assemblés aléatoirement, espace/virgule = séparation") // ENG : Some keywords that will be assembled randomly, space or comma are separations
                .setRequired(false)
        );

    const addGPFoundSCB = new SlashCommandBuilder()
        .setName(`addgpfound`)
        .setDescription(`Ajoute un GP trouvé à un utilisateur pour les stats`) // ENG : Add a GP Found to an user for the stats
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("ADMIN ONLY : seulement utile pour corriger des erreurs") // ENG : Only usefull to fix bugs
                .setRequired(false)
        );
        
    const removeGPFoundSCB = new SlashCommandBuilder()
    .setName(`removegpfound`)
    .setDescription(`Retire un GP trouvé à un utilisateur pour les stats`) // ENG : Remove a GP Found to an user for the stats
    .addUserOption(option =>
        option
            .setName("user")
            .setDescription("ADMIN ONLY : seulement utile pour corriger des erreurs") // ENG : Only usefull to fix bugs
            .setRequired(false)
    );

    const playeridCommand = playeridSCB.toJSON();
    client.application.commands.create(playeridCommand, guildID);

    const instancesCommand = instancesSCB.toJSON();
    client.application.commands.create(instancesCommand, guildID);

    const addCommand = addSCB.toJSON();
    client.application.commands.create(addCommand, guildID);

    const removeCommand = removeSCB.toJSON();
    client.application.commands.create(removeCommand, guildID);

    const refreshCommand = refreshSCB.toJSON();
    client.application.commands.create(refreshCommand, guildID);
    
    const verifiedCommand = verifiedSCB.toJSON();
    client.application.commands.create(verifiedCommand, guildID);
    
    const deadCommand = deadSCB.toJSON();
    client.application.commands.create(deadCommand, guildID);

    const missCommand = missSCB.toJSON();
    client.application.commands.create(missCommand, guildID);
    
    const generateusernamesCommand = generateusernamesSCB.toJSON();
    client.application.commands.create(generateusernamesCommand, guildID);

    const addGPFoundCommand = addGPFoundSCB.toJSON();
    client.application.commands.create(addGPFoundCommand, guildID);

    const removeGPFoundCommand = removeGPFoundSCB.toJSON();
    client.application.commands.create(removeGPFoundCommand, guildID);
});

client.on(Events.InteractionCreate, async interaction => {

    var interactionUserName = interaction.user.username;
    var interactionUserID = interaction.user.id;

    const guild = client.guilds.cache.get(guildID);

    if(!interaction.isChatInputCommand()) return;

    // SET PLAYER ID COMMAND
    if(interaction.commandName === `setplayerid`){
        const id = interaction.options.getString(`id`);

        const text_incorrectID = "ID Incorrect pour"; // ENG : ID Incorrect for
        const text_incorrectReason = "Votre code doit être composé de **16 chifres**"; // ENG : Your could should be 16 numbers length
        const text_replace = "a été remplacé par"; // ENG : have been replaced by
        const text_for = "pour"; // ENG : for
        const text_set = "set pour"; // ENG : set for user

        if(id.length != 16 || !isNumbers(id)){
            interaction.reply(text_incorrectID + ` **<@${interactionUserID}>**, ` + text_incorrectReason);
        }
        else{
            const userPocketID = await getUserAttribValue( client, interactionUserID, attrib_PocketID);
                
            if( userPocketID != undefined ){

                await setUserAttribValue( interactionUserID, interactionUserName, attrib_PocketID, cleanString(id));
                interaction.reply(`Code **${userPocketID}** ` + text_replace + ` **${id}** ` + text_for + ` **<@${interactionUserID}>**`);
            }
            else{
                await setUserAttribValue( interactionUserID, interactionUserName, attrib_PocketID, cleanString(id));
                interaction.reply(`Code **${id}** ` + text_set + ` **<@${interactionUserID}>**`);
            }
        }
    }

    // ADD COMMAND
    if(interaction.commandName === `add`){

        const text_addID = "Ajout de l'ID de"; // ENG : Add the ID of user
        const text_toRerollers = `aux rerollers actifs, voir <#${channelID_IDSync}>`; // ENG : to the active rerollers pool
        const text_alreadyIn = "est déjà présent dans la liste des rerollers actifs"; // ENG : is already in the active rerollers pool
        const text_missingPerm = "n\'a pas les permissions nécessaires pour changer l\'état de"; // ENG : do not have the permission de edit the user
        const text_missingFriendCode = "Le Player ID est nécéssaire avant de vouloir s'add"; // ENG : The Player ID is needed before you can add yourself 
        const user = interaction.options.getUser(`user`);
        if( user != null){
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, ephemeral: true });
            }
            interactionUserName = user.username;
            interactionUserID = user.id;
        }

        if(await doesUserProfileExists(interactionUserID, interactionUserName)){
            if( await getUserAttribValue(client, interactionUserID, attrib_PocketID) == undefined){
                return interaction.reply(text_missingFriendCode);
            }
        }
        else{
            return interaction.reply(text_missingFriendCode);
        }

        var isPlayerActive = await getUserAttribValue( client, interactionUserID, attrib_Active) === "true";
        
        // Skip if player already active
        if(isPlayerActive == 0){

            await setUserAttribValue( interactionUserID, interactionUserName, attrib_Active, true);
            await setUserAttribValue( interactionUserID, interactionUserName, attrib_LastActiveTime, new Date().toString());
            interaction.reply(text_addID + ` **<@${interactionUserID}>** ` + text_toRerollers);
            // Send the list of IDs to an URL and who is Active is the Channel Sync
            sendUpdatedListOfIds(guild, true);
        }
        else{
            interaction.reply(`**<@${interactionUserID}>** ` + text_alreadyIn);
        }
    }

    // REMOVE COMMAND
    if(interaction.commandName === `remove`){
        
        const text_removeID = "Retrait de l'ID de"; // ENG : Add the ID of user
        const text_toRerollers = `des rerollers actifs, voir <#${channelID_IDSync}>`; // ENG : to the active rerollers pool
        const text_alreadyOut = "est déjà absent de la liste des rerollers actifs"; // ENG : is already out of the active rerollers pool
        const text_missingPerm = "n\'a pas les permissions nécessaires pour changer l\'état de"; // ENG : do not have the permission de edit the user
        const text_missingFriendCode = "Le Player ID est nécéssaire avant de vouloir se remove"; // ENG : The Player ID is needed before you can remove yourself
        
        const user = interaction.options.getUser(`user`);
        if( user != null){
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, ephemeral: true });
            }
            interactionUserName = user.username;
            interactionUserID = user.id;
        }

        if( await getUserAttribValue(client, interactionUserID, attrib_PocketID) == undefined){
            return interaction.reply(text_missingFriendCode);
        }
        
        var isPlayerActive = await getUserAttribValue( client, interactionUserID, attrib_Active) === "true";

        // Skip if player not active
        if(isPlayerActive == 1){

            await setUserAttribValue( interactionUserID, interactionUserName, attrib_Active, false);
            interaction.reply(text_removeID + ` **<@${interactionUserID}>** ` + text_toRerollers);
            // Send the list of IDs to an URL and who is Active is the Channel Sync
            sendUpdatedListOfIds(guild, true);
        }
        else{
            interaction.reply(`**<@${interactionUserID}>** ` + text_alreadyOut);
        }
    }

    // REFRESH COMMAND
    if(interaction.commandName === `refresh`){
        
        const text_listRefreshed = `Liste rafraichie, voir <#${channelID_IDSync}>`; // ENG : List refreshed, see 

        // Reading the current players file
        interaction.reply(text_listRefreshed);
        sendUpdatedListOfIds(guild, true);
    }

    // VERIFIED COMMAND
    if(interaction.commandName === `verified`){
        
        const text_markAsVerified = "Godpack marqué comme vérifié"; // ENG : Marked as verified

        const forumPost = client.channels.cache.get(interaction.channelId);
        // Edit a thread
        forumPost.edit({ name: `${forumPost.name.replace(text_waitingLogo, text_verifiedLogo)}` })
            .catch(console.error);

        interaction.reply( text_verifiedLogo + ` ` + text_markAsVerified + ` ${forumPost}`);
    }

    // DEAD COMMAND
    if(interaction.commandName === `dead`){

        const text_markAsDead = "Godpack marqué comme mort"; // ENG : Marked as dud
        
        const forumPost = client.channels.cache.get(interaction.channelId);
        // Edit a thread
        forumPost.edit({ name: `${forumPost.name.replace(text_waitingLogo, text_deadLogo)}` })
            .catch(console.error);
        
        // forumPost.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneHour);
            
        interaction.reply(text_deadLogo + ` ` + text_markAsDead);

    }

    // MISS COMMAND
    if(interaction.commandName === `miss`){

        // COMING UP FOR THE NEXT UPDATE, I DON'T HAVE THE TIME THIS EVENING

        interaction.reply("coming up for the next update");

        // var PacksAmount = 0;

        // var missNeeded = 0
        // var missAmount = 0;

        // if(missAmount >= missNeeded){

        //     const text_reply = `C'est mon ultime bafouille, **${missAmount} / ${missNeeded} miss**`; // ENG : Marked as dud
            
            
        // }
        // else{
            
        //     const text_reply = `**${missAmount} / ${missNeeded}**`; // ENG : Marked as dud

        // }

        
        // const forumPost = client.channels.cache.get(interaction.channelId);
        // // Edit a thread
        // forumPost.edit({ name: `${forumPost.name.replace(text_waitingLogo, text_deadLogo)}` })
        //     .catch(console.error);
        
        // // forumPost.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneHour);
            
        // interaction.reply(text_deadLogo + ` ` + text_markAsDead);

    }

    // GENERATE USERNAMES COMMAND
    if(interaction.commandName === `generateusernames`){

        const text_incorrectParameters = "Paramètres incorrects, entre suffix ET keywords"; // ENG : "Incorrect parameters, write suffix AND keyworks"

        const suffix = interaction.options.getString(`suffix`);
        var keyWords = interaction.options.getString(`keywords`);

        if(suffix == null || keyWords == null)
        {
            return interaction.reply(text_incorrectParameters);
        }
        
        keyWords = keyWords.replaceAll(`,`,` `).split(' ');
        const wordsGenerated = 1000;
        const maxNameLength = 14;
        const suffixLenth = suffix.length;

        var content = "";
        
        for (let i = 0; i < wordsGenerated; i++){
            
            var generatedWord = "";

            for(let j = 0; j < 100; j++){

                const randomIndex = Math.floor(Math.random() * keyWords.length);
                var keyWord = keyWords[randomIndex];
                //Remove all special characters... my god i hate regex
                keyWord = keyWord.replaceAll(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');

                if( (generatedWord + keyWord).length + suffixLenth > maxNameLength ){
                    break;
                }
                else{
                    generatedWord = generatedWord + keyWord;
                }
            }
            if(generatedWord.length > 0){
                content = content + generatedWord + suffix.toUpperCase() + " \n";
            }
        }
        
        interaction.reply(`New usernames.txt list generated :\n`);
        interaction.channel.send({
            files: [{
                attachment: Buffer.from(content),
                name: 'usernames.txt'
            }]
        })
    }

    // SET AVERAGE INSTANCES COMMAND
    if(interaction.commandName === `setaverageinstances`){
        const amount = interaction.options.getInteger(`amount`);

        const text_instancesSetTo = "Nombre d'instance moyenne défini à"; // ENG : Average amount of instances set to
        const text_incorrectAmount = "Connard entre ton vrai nombre d'instances moyenne"; // ENG : Duh... input your real number of instances
        const text_for = "pour"; // ENG : for

        if(amount < 1 || amount > 100){
            interaction.reply(text_incorrectAmount);
        }
        else{
            await setUserAttribValue( interactionUserID, interactionUserName, attrib_AverageInstances, amount);
            interaction.reply(text_instancesSetTo + ` **${amount}** ` + text_for + ` **<@${interactionUserID}>**`);
        }
    }

    // ADD GP FOUND COMMAND
    if(interaction.commandName === `addgpfound`){
        
        const text_addGP = "Ajout d\'un GP pour"; // ENG : Add a GP for
        const text_missingPerm = "n\'a pas les permissions nécessaires pour changer l\'état de"; // ENG : do not have the permission de edit the user
        
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, ephemeral: true });
        }

        const user = interaction.options.getUser(`user`);
        if( user != null){
            interactionUserName = user.username;
            interactionUserID = user.id;
        }

        var GPCount = parseInt(await getUserAttribValue( client, interactionUserID, attrib_GodPackFound));
        await setUserAttribValue( interactionUserID, interactionUserName, attrib_GodPackFound, GPCount+1);
        interaction.reply(`${text_addGP} **<@${interactionUserID}>**`).then(tempMessage => {
            setTimeout(() => {
                tempMessage.delete()
            }, 5000);
        });
    }

    // REMOVE GP FOUND COMMAND
    if(interaction.commandName === `removegpfound`){

        const text_removeGP = "Retrait d\'un GP pour"; // ENG : Remove a GP for
        const text_minimumGP = "Nombre de GP déjà au minimum pour"; // ENG : GP Count already at the minimum value for
        const text_missingPerm = "n\'a pas les permissions nécessaires pour changer l\'état de"; // ENG : do not have the permission de edit the user

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, ephemeral: true });
        }

        const user = interaction.options.getUser(`user`);
        if( user != null){
            interactionUserName = user.username;
            interactionUserID = user.id;
        }

        var GPCount = parseInt(await getUserAttribValue( client, interactionUserID, attrib_GodPackFound));
        if (GPCount > 0){
            await setUserAttribValue( interactionUserID, interactionUserName, attrib_GodPackFound, GPCount-1);
            interaction.reply(`${text_removeGP} **<@${interactionUserID}>**`).then(tempMessage => {
                setTimeout(() => {
                    tempMessage.delete()
                }, 5000);
            });
        }
        else{
            interaction.reply(`${text_minimumGP} **<@${interactionUserID}>**`).then(tempMessage => {
                setTimeout(() => {
                    tempMessage.delete()
                }, 5000);
            });
        }
    }        
});

client.on("messageCreate", async (message) => {

    const guild = await client.guilds.fetch(guildID);

    if (message.channel.id === channelID_Webhook)
    {
        //Execute when screen is posted
        if (message.attachments.first() != undefined && !message.content.includes("invalid") && message.content.includes("God Pack") ) {

            const text_verificationRedirect = "Verification ici :" // ENG : Verification link here :
            const text_godpackFoundBy = "GodPack trouvé par" // ENG : GodPack found by
            const text_commandTooltip = "**Écrivez /verified ou /dead dans le poste pour le signaler comme live ou non**" // ENG : Write /verified or /dead in the post to mark it at live or dud
            const text_eligible = "**Éligibles :**" // ENG : Eligible :
            
            var arrayGodpackMessage = splitMulti(message.content, ['<@','>','!','found','(',')']);
            var ownerID = arrayGodpackMessage[1];
            var ownerUsername = (await guild.members.fetch(cleanString(ownerID))).user.username;
            var accountName = arrayGodpackMessage[3];
            var packAmount = arrayGodpackMessage[7];
                        
            const godPackFound = await getUserAttribValue( client, ownerID, attrib_GodPackFound );
            if( godPackFound == undefined ) {
                await setUserAttribValue( ownerID, ownerUsername, attrib_GodPackFound, 1);
            } else {
                await setUserAttribValue( ownerID, ownerUsername, attrib_GodPackFound, parseInt(godPackFound) + 1);
            }
            
            var imageUrl = message.attachments.first().url;
        
            var activeUsersID = getIDFromUsers(await getActiveUsers());
            var tagActiveUsernames = "";

            // CACHE MEMBERS
            // const m = await guild.members.fetch()
            // let members = m.map(u => u.user.id)

            activeUsersID.forEach((id) =>{

                    // var id = "";
                    // m.forEach((member) =>{

                    //     if(member.user.username == username){
                    //         id = member.user.id;
                    //     }
                    // });
                    tagActiveUsernames += `<@${id}>`
            });

            // Create thread in Webhook channel
            const thread = await message.startThread({
                name: text_verificationRedirect,
            }).then( async thread =>{
        
                // Create forum post for verification
                const forum = client.channels.cache.get(channelID_GPVerificationForum);
                const forumPost = forum.threads.create({
                name: `⌛ ${accountName} - ${packAmount}`,
                message: {
                    content: text_godpackFoundBy + ` **<@${ownerID}>**\n\nSource: ${message.url}\n${imageUrl}\n\n` + text_eligible + " " + tagActiveUsernames + `\n\n` + text_commandTooltip,
                },
                }).then ( async forum =>{
        
                    // Post forum link in webhook thread
                    await thread.send(text_verificationRedirect + ` ${forum}`);
                    // Lock thread
                    await thread.setLocked(true);
                })
            });
        }
    }

    if (message.channel.id === channelID_Heartbeat)
    {
        var heartbeatDatas = message.content.split("\n");
        const userID = heartbeatDatas[0];
        
        var userUsername = (await guild.members.fetch(cleanString(userID))).user.username;

        if(await doesUserProfileExists(userID, userUsername)){

            const instances = countDigits(heartbeatDatas[1]);
            const timeAndPacks = extractNumbers(heartbeatDatas[3]);
            const time = timeAndPacks[0];
            var packs = timeAndPacks[1];

            // const lastHeartbeatTime = new Date(await getUserAttribValue( client, userID, attrib_LastHeartbeatTime ));
            // const currentTime = new Date();
            // const diffActiveTime = (currentTime - lastHeartbeatTime) / 60000;

            // console.log("lastActiveTime " + lastActiveTime);
            // console.log("currentTime " + currentTime);
            // console.log("diffActiveTime " + lastHeartbeatTime);

            if(packs == NaN)
            {
                console.log(userUsername + " HAD NAAAAAAAAAAAAAAAAN packs, session was " + time + " time and " + packs + " packs")  
            }
            packs = packs == NaN ? 0 : packs;

            await setUserAttribValue( userID, userUsername, attrib_HBInstances, instances);
            await setUserAttribValue( userID, userUsername, attrib_SessionTime, time);
            if( time === "0" ){
                var totalPacks = await getUserAttribValue( client, userID, attrib_TotalPacksOpened );
                var sessionPacks = await getUserAttribValue( client, userID, attrib_SessionPacksOpened );
                if(totalPacks == NaN)
                {
                    console.log(userUsername + " HAD NAAAAAAAAAAAAAAAAN total packs, session was " + time + " time and " + packs + " packs")  
                }
                if(sessionPacks == NaN)
                {
                    console.log(userUsername + " HAD NAAAAAAAAAAAAAAAAN session packs, session was " + time + " time and " + packs + " packs")  
                }
                totalPacks = totalPacks == NaN ? 0 : totalPacks;
                sessionPacks = sessionPacks == NaN ? 0 : sessionPacks;
                await setUserAttribValue( userID, userUsername, attrib_TotalPacksOpened, parseInt(totalPacks) + parseInt(sessionPacks));
            }
            await setUserAttribValue( userID, userUsername, attrib_SessionPacksOpened, packs);

            await setUserAttribValue( userID, userUsername, attrib_LastHeartbeatTime, new Date().toString());
        }
    }
});

client.login(token);