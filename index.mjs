// CC0-1.0 license you're free to do what you want with it
//
// Bot written by @thobi (discord) made to work with Arturo PTCG Bot for the PTCGP Rerollers community
// See here : https://github.com/Arturo-1212/PTCGPB
// Shoutout to @cjlj for Automated ids.txt modifications on the ahk side
//
// To know what to input into config.json file or other setup, check the github / readme file
// https://github.com/TheThobi/PTCGPRerollManager
//

// Imports

import { Octokit } from '@octokit/core';

import {
    token,
    guildID,
    channelID_IDs,
    channelID_UserStats,
    channelID_GPVerificationForum,
    channelID_Webhook,
    channelID_Heartbeat,
    gitToken,
    gitGistID,
    gitGistName,
    missBeforeDead,
    text_verifiedLogo,
    text_deadLogo,
    text_waitingLogo,
    refreshStatsInterval,
} from './config.js';

import {
    sumIntArray, 
    sumFloatArray, 
    roundToOneDecimal, 
    countDigits, 
    extractNumbers, 
    isNumbers, 
    splitMulti, 
    replaceLastOccurrence,
    replaceMissCount,
    sendReceivedMessage, 
    bulkDeleteMessages, 
    colorText, 
    addTextBar,
    localize,
    getOldestMessage,
} from './Dependencies/utils.js';

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
} from './Dependencies/xmlManager.js';

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
} from './Dependencies/xmlConfig.js';

import {
    text_lowTension,
    text_mediumTension,
    text_highTension,
} from './Dependencies/missSentences.js';

import {
    Client,
    Events,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    PermissionsBitField,
} from 'discord.js';

// Global Var

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	]
});

var startIntervalTime = Date.now();

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
            [gitGistName]:{
                content: newContent
            }
        },
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
}

// Functions

function getNexIntervalRemainingTime() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startIntervalTime;
    const timeRemaining = refreshStatsInterval - elapsedTime;
    return timeRemaining/60000;
}

async function getUsersStats( users, members ){

    var usersStats = []

    for (const user of users) {

        var userOutput = `\`\`\`ansi\n`;

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

        userOutput = addTextBar(userOutput, 40);

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
        const text_sessionTime = colorText("running " + sessionTime + "mn", "gray");
        const text_sessionPacks = colorText("w/ " + sessionPacks + " packs", "gray");
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
        userOutput += `\n\`\`\``;

        usersStats.push(userOutput);
    };
    
    return usersStats;
}

async function sendUserStats( guild ){

    await bulkDeleteMessages(guild.channels.cache.get(channelID_UserStats), 20);

    // CACHE MEMBERS
    const m = await guild.members.fetch()

    var activeUsers = await getActiveUsers();
    var activeUsersInfos = await getUsersStats(activeUsers, m);

    // Send users data message by message otherwise it gets over the 2k words limit
    const text_ActiveList = localize("Liste des rerollers actifs", "List of actives rerollers");

    guild.channels.cache.get(channelID_UserStats).send({content:`# ${text_ActiveList} :\n`})
    activeUsersInfos.forEach( activeUserInfos =>{
        guild.channels.cache.get(channelID_UserStats).send({content:activeUserInfos});
    });

    // Update Users (due to RealInstance attribute getting updated) 
    activeUsers = await getActiveUsers();
    const activeInstances = getAttribValueFromUsers(activeUsers, attrib_RealInstances, [0]);
    const instancesAmount = sumIntArray(activeInstances);

    const globalsessionTime = getAttribValueFromUsers(activeUsers, attrib_SessionTime, [0]);
    const globalsessionPacks = getAttribValueFromUsers(activeUsers, attrib_SessionPacksOpened, [0]);
    const accumulatedSessionTime = sumFloatArray(globalsessionTime);
    const accumulatedsessionPacks = sumFloatArray(globalsessionPacks);
    const accumulatedPackSec = roundToOneDecimal((accumulatedsessionPacks/accumulatedSessionTime) * globalsessionPacks.length);

    const text_avgInstances = localize("instances à environ", "instance that run at");
    const text_activeInstances = `## ${instancesAmount} ${text_avgInstances} ${accumulatedPackSec} packs/mn\n\n`; // ENG : ## Running instances

    // Send UserStats
    guild.channels.cache.get(channelID_UserStats).send({ content:`${text_activeInstances}`});
}

async function sendIDs( guild, updateServer = true ){

    var activeUsers = await getActiveUsers();
    const activePocketIDs = getAttribValueFromUsers(activeUsers, attrib_PocketID, "").join('\n');

    const text_contentOf = localize("Contenu de IDs.txt", "Content of IDs.txt");
    const text_activePocketIDs = `*${text_contentOf} :*\n\`\`\`\n${activePocketIDs}\n\`\`\``; // ENG : Content of ids.txt :
    // Send instances and IDs
    guild.channels.cache.get(channelID_IDs).send({ content:`${text_activePocketIDs}`});
    if(updateServer){
        updateGist(activePocketIDs);
    }
}

async function markAsDead( interaction, optionalText = "" ){
    const text_markAsDead = localize("Godpack marqué comme mort","Godpack marked as dud");
        
    const forumPost = client.channels.cache.get(interaction.channelId);
    // Edit a thread
    forumPost.edit({ name: `${forumPost.name.replace(text_waitingLogo, text_deadLogo)}` })
        .catch(console.error);
    
    // forumPost.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneHour);
        
    await sendReceivedMessage(interaction, optionalText + text_deadLogo + ` ` + text_markAsDead);
}

// Events

client.once(Events.ClientReady, async c => {
    console.log(`Logged in as ${c.user.tag}`);

    const guild = client.guilds.cache.get(guildID);

    setInterval(() =>{
        startIntervalTime = Date.now();
        sendUserStats(guild);
    }, refreshStatsInterval);

    // // Clear all guild commands (Warning : also clearupdateGist channels restrictions set on discord)
    // const guild = await client.guilds.fetch(guildID);
    // guild.commands.set([]);

    // Commands Creation

    const playeridDesc = localize("Lie votre code ami à votre pseudo discord unique", "Link your ID Code with you Discord unique username");
    const playeridSCB = new SlashCommandBuilder()
        .setName(`setplayerid`)
        .setDescription(`${playeridDesc}\n`) // ENG : 
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("votre ID SANS TIRET") // ENG : Your ID without any dash
                .setRequired(true)
        );

    const instancesDesc = localize("Renseignez votre nombre d'instance moyen", "Set to your average number of instances");
    const instancesDescAmount = localize("Nombres ronds (ex: pas 5.5 parce que vous etes a 6 et de fois 5)", "Round nombers (ex : not 5.5 if you're running 5 and sometimes 6)");
    const instancesSCB = new SlashCommandBuilder()
        .setName(`setaverageinstances`)
        .setDescription(`${instancesDesc}\n`)
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription(`${instancesDescAmount}`)
                .setRequired(true)
        );

    const addDesc = localize("Vous ajoute dans le doc d'ID", "Add yourself to the active rerollers list");
    const addDescUser = localize("ADMIN ONLY : pour forcer l'ajout de quelqu'un d'autre", "ADMIN ONLY : Only usefull so force add someone else than yourself");
    const addSCB = new SlashCommandBuilder()
        .setName(`add`)
        .setDescription(`${addDesc}`) // ENG : 
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription(`${addDescUser}`) // ENG : 
                .setRequired(false)
        );
    
    const removeDesc = localize("Vous retire du doc d'ID"," Withdraw yourself from the active rerollers list");
    const removeDescUser = localize("ADMIN ONLY : pour forcer le retrait de quelqu'un d'autre", "ADMIN ONLY : Only usefull so force remove someone else than yourself");
    const removeSCB = new SlashCommandBuilder()
        .setName(`remove`)
        .setDescription(`${removeDesc}`)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription(`${removeDescUser}`)
                .setRequired(false)
        );
    
    const refreshDesc = localize("Rafraichit la liste des ids et les envois au server","Refresh the ids.txt and sent them to servers");
    const refreshSCB = new SlashCommandBuilder()
        .setName(`refresh`)
        .setDescription(`${refreshDesc}`);

    const forcerefreshDesc = localize("Rafraichit la liste des Stats instantanément","Refresh the user stats instantly");
    const forcerefreshSCB = new SlashCommandBuilder()
        .setName(`forcerefresh`)
        .setDescription(`${forcerefreshDesc}`);

    const verifiedDesc = localize("Designe pack valide","Flag the post as valid");
    const verifiedSCB = new SlashCommandBuilder()
        .setName(`verified`)
        .setDescription(`${verifiedDesc}`);

    const deadDesc = localize("Designe pack invalide / dud","Flag the post as invalid / dud");
    const deadSCB = new SlashCommandBuilder()
        .setName(`dead`)
        .setDescription(`${deadDesc}`);

    const missDesc = localize("Pour la verification GP, après X fois suivant le nombre de pack cela auto /dead", "For verification purposes, after X times based on pack amount it sends /dead");
    const missSCB = new SlashCommandBuilder()
        .setName(`miss`)
        .setDescription(`${missDesc}`); // ENG : 

    const generateusernamesDesc = localize("Génère liste basé sur suffixe et, facultatif, des mots","Generate a list based on a suffix and, if wanted, keywords");   
    const generateusernamesDescSuffix = localize("Les 3 ou 4 premières lettres premières lettres de votre pseudo","The 3 or 4 firsts letter of your pseudonym");   
    const generateusernamesDescKeyword = localize("Des mots clés qui seront assemblés aléatoirement, espace/virgule = séparation","Some keywords that will be assembled randomly, space or comma are separations");   
    const generateusernamesSCB = new SlashCommandBuilder()
        .setName(`generateusernames`)
        .setDescription(`${generateusernamesDesc}`)
        .addStringOption(option =>
            option
                .setName("suffix")
                .setDescription(`${generateusernamesDescSuffix}`) // ENG : 
                .setRequired(true)
        ).addStringOption(option2 =>
            option2
                .setName("keywords")
                .setDescription(`${generateusernamesDescKeyword}`) // ENG : 
                .setRequired(false)
        );

    const addGPFoundDesc = localize("ADMIN ONLY : Ajoute un GP trouvé à un utilisateur pour les stats","ADMIN ONLY : Add a GP Found to an user for the stats");
    const addGPFoundDescUser = localize("seulement utile pour corriger des erreurs","Only usefull to fix bugs");
    const addGPFoundSCB = new SlashCommandBuilder()
        .setName(`addgpfound`)
        .setDescription(`${addGPFoundDesc}`) // ENG : 
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription(`${addGPFoundDescUser}`) // ENG : 
                .setRequired(false)
        );

    const removeGPFoundDesc = localize("ADMIN ONLY : Retire un GP trouvé à un utilisateur pour les stats","ADMIN ONLY : Remove a GP Found to an user for the stats");
    const removeGPFoundDescUser = localize("seulement utile pour corriger des erreurs","only usefull to fix bugs");
    const removeGPFoundSCB = new SlashCommandBuilder()
    .setName(`removegpfound`)
    .setDescription(`${removeGPFoundDesc}`) // ENG : 
    .addUserOption(option =>
        option
            .setName("user")
            .setDescription(`${removeGPFoundDescUser}`) // ENG : 
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

    const forcerefreshCommand = forcerefreshSCB.toJSON();
    client.application.commands.create(forcerefreshCommand, guildID);
    
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
    var interactionDisplayName = interaction.user.displayName;

    const guild = client.guilds.cache.get(guildID);

    if(!interaction.isChatInputCommand()) return;

    // SET PLAYER ID COMMAND
    if(interaction.commandName === `setplayerid`){
        const id = interaction.options.getString(`id`);

        const text_incorrectID = localize("ID Incorrect pour","ID Incorrect for");
        const text_incorrectReason = localize("Votre code doit être composé de **16 chifres**","Your could should be **16 numbers length**");
        const text_replace = localize("a été remplacé par","have been replaced by");
        const text_for = localize("pour","for");
        const text_set = localize("set pour","set for user");

        if(id.length != 16 || !isNumbers(id)){
            await sendReceivedMessage(interaction, text_incorrectID + ` **<@${interactionUserID}>**, ` + text_incorrectReason);
        }
        else{
            const userPocketID = await getUserAttribValue( client, interactionUserID, attrib_PocketID);
                
            if( userPocketID != undefined ){

                await setUserAttribValue( interactionUserID, interactionUserName, attrib_PocketID, cleanString(id));
                await sendReceivedMessage(interaction, `Code **${userPocketID}** ` + text_replace + ` **${id}** ` + text_for + ` **<@${interactionUserID}>**`);
            }
            else{
                await setUserAttribValue( interactionUserID, interactionUserName, attrib_PocketID, cleanString(id));
                await sendReceivedMessage(interaction, `Code **${id}** ` + text_set + ` **<@${interactionUserID}>**`);
            }
        }
    }

    // ADD COMMAND
    if(interaction.commandName === `add`){

        const text_alreadyIn = localize("est déjà présent dans la liste des rerollers actifs","is already in the active rerollers pool");
        const text_missingPerm = localize("n\'a pas les permissions nécessaires pour changer l\'état de","do not have the permission de edit other user");
        const text_missingFriendCode = localize("Le Player ID est nécéssaire avant de vouloir s'add","The Player ID is needed before you can add yourself");
        const user = interaction.options.getUser(`user`);
        if( user != null){
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return await sendReceivedMessage(interaction, { content: `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, ephemeral: true });
            }
            interactionUserName = user.username;
            interactionUserID = user.id;
            interactionDisplayName = user.displayName;
        }

        if(await doesUserProfileExists(interactionUserID, interactionUserName)){
            if( await getUserAttribValue(client, interactionUserID, attrib_PocketID) == undefined){
                return await sendReceivedMessage(interaction, text_missingFriendCode);
            }
        }
        else{
            return await sendReceivedMessage(interaction, text_missingFriendCode);
        }

        var isPlayerActive = await getUserAttribValue( client, interactionUserID, attrib_Active) === "true";
        
        // Skip if player already active
        if(isPlayerActive == 0){

            await setUserAttribValue( interactionUserID, interactionUserName, attrib_Active, true);
            await setUserAttribValue( interactionUserID, interactionUserName, attrib_LastActiveTime, new Date().toString());
            await sendReceivedMessage(interaction, `\`\`\`diff\n+${interactionDisplayName}\n\`\`\``);
            // Send the list of IDs to an URL and who is Active is the IDs channel
            sendIDs(guild);
        }
        else{
            await sendReceivedMessage(interaction, `**<@${interactionUserID}>** ` + text_alreadyIn);
        }
    }

    // REMOVE COMMAND
    if(interaction.commandName === `remove`){
        
        const text_alreadyOut = localize("est déjà absent de la liste des rerollers actifs","is already out of the active rerollers pool");
        const text_missingPerm = localize("n\'a pas les permissions nécessaires pour changer l\'état de","do not have the permission de edit the other user");
        const text_missingFriendCode = localize("Le Player ID est nécéssaire avant de vouloir se remove","The Player ID is needed before you can remove yourself");
        
        const user = interaction.options.getUser(`user`);
        if( user != null){
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return await sendReceivedMessage(interaction, { content: `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, ephemeral: true });
            }
            interactionUserName = user.username;
            interactionUserID = user.id;
            interactionDisplayName = user.displayName;
        }

        if( await getUserAttribValue(client, interactionUserID, attrib_PocketID) == undefined){
            return await sendReceivedMessage(interaction, text_missingFriendCode);
        }
        
        var isPlayerActive = await getUserAttribValue( client, interactionUserID, attrib_Active) === "true";

        // Skip if player not active
        if(isPlayerActive == 1){

            await setUserAttribValue( interactionUserID, interactionUserName, attrib_Active, false);
            await sendReceivedMessage(interaction, `\`\`\`diff\n-${interactionDisplayName}\n\`\`\``);
            // Send the list of IDs to an URL and who is Active is the IDs channel
            sendIDs(guild);
        }
        else{
            await sendReceivedMessage(interaction, `**<@${interactionUserID}>** ` + text_alreadyOut);
        }
    }

    // REFRESH COMMAND
    if(interaction.commandName === `refresh`){
        
        const refreshTime = roundToOneDecimal(getNexIntervalRemainingTime());
        const text_IDsRefreshedIn = localize("**IDs rafraichis**, rafraichissment des **Stats dans","**IDs refreshed**, reshing the **Stats in");
        const text_see = localize("voir","see");

        const text_listRefreshed = `${text_IDsRefreshedIn} ${refreshTime}mn**, ${text_see} <#${channelID_UserStats}>`;

        // Reading the current players file
        await sendReceivedMessage(interaction, text_listRefreshed);
        sendIDs(guild);
    }

    // FORCE REFRESH COMMAND
    if(interaction.commandName === `forcerefresh`){
    
        const text_listForceRefreshed = localize("**Stats rerollers actifs rafraichies**", "**Active rerollers stats refreshed**");

        // Reading the current players file
        await sendReceivedMessage(interaction, text_listForceRefreshed);
        sendUserStats(guild)
    }
    
    // VERIFIED COMMAND
    if(interaction.commandName === `verified`){
        
        const text_markAsVerified = localize("Godpack marqué comme live","Godpack marked as live");

        const forumPost = client.channels.cache.get(interaction.channelId);
        // Edit a thread
        forumPost.edit({ name: `${forumPost.name.replace(text_waitingLogo, text_verifiedLogo)}` })
            .catch(console.error);

        await sendReceivedMessage(interaction, text_verifiedLogo + ` ` + text_markAsVerified + ` ${forumPost}`);
    }

    // DEAD COMMAND
    if(interaction.commandName === `dead`){

        markAsDead(interaction);
    }

    // MISS COMMAND
    if(interaction.commandName === `miss`){

        const text_markasMiss = localize("Godpack marqué comme mort","Godpack marked as dud");
        const text_notCompatible = localize("Le GP est dans **l'ancien format**, /miss incompatible","The GP is using the **old format**, /miss incompatible");

        const forumPost = client.channels.cache.get(interaction.channelId);
        const initialMessage = await getOldestMessage(forumPost);
        const splitForumContent = splitMulti(initialMessage.content,['[',']']);

        if (splitForumContent.length > 1){

            const numbersMiss = extractNumbers(splitForumContent[1]);
    
            var missAmount = numbersMiss[0];
            var newMissAmount = parseInt(missAmount)+1;
            var missNeeded = numbersMiss[1];

            if(newMissAmount >= missNeeded){
                
                await initialMessage.edit( `${replaceMissCount(initialMessage.content, newMissAmount)}`);

                const text_failed = localize(`C'est finito\n`,`Well rip,`) + ` **[ ${newMissAmount} miss / ${missNeeded} ]**\n`;
                markAsDead(interaction, text_failed);
            }
            else{
                await initialMessage.edit( `${replaceMissCount(initialMessage.content, newMissAmount)}`);
                
                // If miss is <= 50% the amount sentences are """encouraging""" then it gets worst and even more after 75% 
                const text_fitTension = newMissAmount <= missNeeded*0.5 ? text_lowTension(client) : newMissAmount <= missNeeded*0.75 ? text_mediumTension(client) : text_highTension(client);
                await sendReceivedMessage(interaction, `${text_fitTension}\n**[ ${newMissAmount} miss / ${missNeeded}]**`);            
            }
        }
        else{
            await sendReceivedMessage(interaction, text_notCompatible);
        }
    }

    // GENERATE USERNAMES COMMAND
    if(interaction.commandName === `generateusernames`){

        const text_incorrectParameters = localize("Paramètres incorrects, entre suffix ET keywords","Incorrect parameters, write suffix AND keyworks");
        const text_listGenerated = localize("Nouvelle liste d'usernames generé :","New usernames.txt list generated :");

        const suffix = interaction.options.getString(`suffix`);
        var keyWords = interaction.options.getString(`keywords`);

        if(suffix == null || keyWords == null)
        {
            return await sendReceivedMessage(interaction, text_incorrectParameters);
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
        

        await sendReceivedMessage(interaction, text_listGenerated);
        await interaction.channel.send({
            files: [{
                attachment: Buffer.from(content),
                name: 'usernames.txt'
            }]
        })
    }

    // SET AVERAGE INSTANCES COMMAND
    if(interaction.commandName === `setaverageinstances`){
        const amount = interaction.options.getInteger(`amount`);

        const text_instancesSetTo = localize("Nombre d'instance moyenne défini à","Average amount of instances set to");
        const text_incorrectAmount = localize("Pti con va, entre ton vrai nombre d'instances","You lil sneaky boy... input your real number of instances");
        const text_for = localize("pour","for");

        if(amount < 1 || amount > 100){
            await sendReceivedMessage(interaction, text_incorrectAmount);
        }
        else{
            await setUserAttribValue( interactionUserID, interactionUserName, attrib_AverageInstances, amount);
            await sendReceivedMessage(interaction, text_instancesSetTo + ` **${amount}** ` + text_for + ` **<@${interactionUserID}>**`);
        }
    }

    // ADD GP FOUND COMMAND
    if(interaction.commandName === `addgpfound`){
        
        const text_addGP = localize("Ajout d\'un GP pour","Add a GP for");
        const text_missingPerm = localize("n\'a pas les permissions d\'Admin","do not have Admin permissions");
        
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await sendReceivedMessage(interaction, { content: `<@${interactionUserID}> ${text_missingPerm}`, ephemeral: true });
        }

        const user = interaction.options.getUser(`user`);
        if( user != null){
            interactionUserName = user.username;
            interactionUserID = user.id;
        }

        var GPCount = parseInt(await getUserAttribValue( client, interactionUserID, attrib_GodPackFound));
        await setUserAttribValue( interactionUserID, interactionUserName, attrib_GodPackFound, GPCount+1);
        await sendReceivedMessage(interaction, `${text_addGP} **<@${interactionUserID}>**`).then(tempMessage => {
            setTimeout(() => {
                tempMessage.delete()
            }, 5000);
        });
    }

    // REMOVE GP FOUND COMMAND
    if(interaction.commandName === `removegpfound`){

        const text_removeGP = localize("Retrait d\'un GP pour","Remove a GP for");
        const text_minimumGP = localize("Nombre de GP déjà au minimum pour","GP Count already at the minimum value for");
        const text_missingPerm = localize("n\'a pas les permissions d\'Admin","do not have Admin permissions");

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await sendReceivedMessage(interaction, { content: `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, ephemeral: true });
        }

        const user = interaction.options.getUser(`user`);
        if( user != null){
            interactionUserName = user.username;
            interactionUserID = user.id;
        }

        var GPCount = parseInt(await getUserAttribValue( client, interactionUserID, attrib_GodPackFound));
        if (GPCount > 0){
            await setUserAttribValue( interactionUserID, interactionUserName, attrib_GodPackFound, GPCount-1);
            await sendReceivedMessage(interaction, `${text_removeGP} **<@${interactionUserID}>**`).then(tempMessage => {
                setTimeout(() => {
                    tempMessage.delete()
                }, 5000);
            });
        }
        else{
            await sendReceivedMessage(interaction, `${text_minimumGP} **<@${interactionUserID}>**`).then(tempMessage => {
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

            const text_verificationRedirect = localize("Verification ici :","Verification link here :");
            const text_godpackFoundBy = localize("GP trouvé par","GP found by");
            const text_commandTooltip = localize(
                "Écrivez **/miss** si un autre est apparu ou que vous ne l'avez pas\n**/verified** ou **/dead** pour changer l'état du post",
                "Write **/miss** if another one appeared or you didn't saw it\n**/verified** or **/dead** to change post state");
            const text_eligible = localize("**Éligibles :**","**Eligible :**");
            
            var arrayGodpackMessage = splitMulti(message.content, ['<@','>','!','found','(',')']);
            var ownerID = arrayGodpackMessage[1];
            var ownerUsername = (await guild.members.fetch(cleanString(ownerID))).user.username;
            var accountName = arrayGodpackMessage[3];
            var accountID = arrayGodpackMessage[4];
            var text_packAmount = arrayGodpackMessage[7];
            
            const godPackFound = await getUserAttribValue( client, ownerID, attrib_GodPackFound );
            if( godPackFound == undefined ) {
                await setUserAttribValue( ownerID, ownerUsername, attrib_GodPackFound, 1);
            } else {
                await setUserAttribValue( ownerID, ownerUsername, attrib_GodPackFound, parseInt(godPackFound) + 1);
            }
            
            var imageUrl = message.attachments.first().url;
        
            var activeUsersID = getIDFromUsers(await getActiveUsers());
            var tagActiveUsernames = "";

            activeUsersID.forEach((id) =>{
                    tagActiveUsernames += `<@${id}>`
            });

            // Create thread in Webhook channel
            const thread = await message.startThread({
                name: text_verificationRedirect,
            }).then( async thread =>{
                // First line
                const text_foundbyLine = `${text_godpackFoundBy} **<@${ownerID}>**\n`;
                
                // Second line
                var packAmount = extractNumbers(text_packAmount);
                packAmount = Math.max(Math.min(packAmount,3),1); // Ensure that it is only 1 to 3
                const text_miss = `## [ 0 miss / ${missBeforeDead[packAmount-1]} ]`
                const text_missLine = `${text_miss}\n\n`;
                
                // Third line
                const text_eligibleLine = `${text_eligible} ${tagActiveUsernames}\n\n`;
                
                // Fourth line
                const text_metadataLine = `Source: ${message.url}\n${imageUrl}\n\n`;
        
                // Create forum post for verification
                const forum = client.channels.cache.get(channelID_GPVerificationForum);
                const forumPost = forum.threads.create({
                name: `⌛ ${accountName} - ${text_packAmount}`,
                message: {
                    content: text_foundbyLine + text_missLine + text_eligibleLine + text_metadataLine + text_commandTooltip,
                },
                }).then ( async forum =>{
        
                    // Post forum link in webhook thread
                    await thread.send(text_verificationRedirect + ` ${forum}`);
                    // Lock thread
                    await thread.setLocked(true);

                    guild.channels.cache.get(await forum.id).send({content:`${accountID} is the id of the account\n`})
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

            //////////////////////////////////////////////////// TEMPORARY //////////////////////////////////////////////////////////////////
            if(packs == NaN)
            {
                console.log(userUsername + " HAD NAAAAAAAAAAAAAAAAN packs, session was " + time + " time and " + packs + " packs")  
            }
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            packs = packs == NaN ? 0 : packs;

            await setUserAttribValue( userID, userUsername, attrib_HBInstances, instances);
            await setUserAttribValue( userID, userUsername, attrib_SessionTime, time);

            if( time == "0" ){
                var totalPacks = await getUserAttribValue( client, userID, attrib_TotalPacksOpened );
                var sessionPacks = await getUserAttribValue( client, userID, attrib_SessionPacksOpened );
                //////////////////////////////////////////////////// TEMPORARY //////////////////////////////////////////////////////////////////
                if(totalPacks == NaN)
                {
                    console.log(userUsername + " HAD NAAAAAAAAAAAAAAAAN total packs, session was " + time + " time and " + packs + " packs")  
                }
                if(sessionPacks == NaN)
                {
                    console.log(userUsername + " HAD NAAAAAAAAAAAAAAAAN session packs, session was " + time + " time and " + packs + " packs")  
                }
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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