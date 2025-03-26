//                    GNU GENERAL PUBLIC LICENSE
//                       Version 3, 29 June 2007
//
//Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
//Everyone is permitted to copy and distribute verbatim copies
//of this license document, but changing it is not allowed.
//
// Bot written by @thobi made to work with Arturo PTCG Bot for the PTCGP Rerollers community
// See here : https://github.com/Arturo-1212/PTCGPB
// Shoutout to @cjlj for Automated ids.txt modifications on the ahk side
//
// Documentation :
// https://github.com/TheThobi/PTCGPRerollManager
//

// Imports

import {
    token,
    guildID,
    channelID_Commands,
    channelID_UserStats,
    channelID_GPVerificationForum,
    channelID_2StarVerificationForum,
    channelID_Webhook,
    channelID_Heartbeat,
    channelID_AntiCheat,
    gitToken,
    gitGistID,
    gitGistGroupName,
    gitGistGPName,
    missBeforeDead,
    missNotLikedMultiplier,
    showPerPersonLive,
    EnglishLanguage,
    AutoKick,
    refreshInterval,
    inactiveTime,
    inactiveInstanceCount,
    inactivePackPerMinCount,
    inactiveIfMainOffline,
    heartbeatRate,
    delayMsgDeleteState,
    backupUserDatasTime,
    min2Stars,
    groupPacksType,
    canPeopleAddOthers,
    canPeopleRemoveOthers,
    canPeopleLeech,
    leechPermGPCount,
    leechPermPackCount,
    resetServerDataFrequently,
    resetServerDataTime,
    safeEligibleIDsFiltering,
    forceSkipMin2Stars,
    forceSkipMinPacks,
    text_verifiedLogo,
    text_likedLogo,
    text_waitingLogo,
    text_notLikedLogo,
    text_deadLogo,
} from './config.js';

import {
    formatMinutesToDays,
    formatNumbertoK,
    sumIntArray, 
    sumFloatArray, 
    roundToOneDecimal,
    roundToTwoDecimals,
    countDigits, 
    extractNumbers,
    extractTwoStarAmount,
    isNumbers,
    convertMnToMs,
    convertMsToMn,
    splitMulti, 
    replaceLastOccurrence,
    replaceMissCount,
    replaceMissNeeded,
    sendReceivedMessage, 
    sendChannelMessage,
    bulkDeleteMessages, 
    colorText, 
    addTextBar,
    formatNumberWithSpaces,
    localize,
    getRandomStringFromArray,
    getOldestMessage,
    wait,
    replaceAnyLogoWith,
    normalizeOCR,
    getLastsAntiCheatMessages,
    updateAverage,
} from './Dependencies/utils.js';

import {
    getGuild, 
    getMemberByID,
    getUsersStats, 
    sendStats, 
    sendIDs,
    sendStatusHeader,
    inactivityCheck,
    extractGPInfo,
    createForumPost,
    markAsDead, 
    updateEligibleIDs,
    updateInactiveGPs,
    setUserState,
    updateServerData,
    updateAntiCheat,
    updateUserDataGPLive,
    addUserDataGPLive,
} from './Dependencies/coreUtils.js';

import {
    checkFileExists,
    checkFileExistsOrCreate,
    writeFile,
    doesUserProfileExists, 
    setUserAttribValue, 
    getUserAttribValue, 
    setAllUsersAttribValue,
    setUserSubsystemAttribValue,
    getUserSubsystemAttribValue,
    getActiveUsers,
    getActiveIDs,
    getAllUsers,
    getUsernameFromUsers, 
    getUsernameFromUser, 
    getIDFromUsers, 
    getIDFromUser,
    getTimeFromGP,
    getAttribValueFromUsers, 
    getAttribValueFromUser, 
    getAttribValueFromUserSubsystems,
    refreshUserActiveState,
    refreshUserRealInstances,
    cleanString,
    addServerGP,
    getServerDataGPs,
    backupFile,
} from './Dependencies/xmlManager.js';

import {
    attrib_PocketID,
    attrib_Prefix,
    attrib_UserState,
    attrib_ActiveState,
    attrib_AverageInstances, 
    attrib_HBInstances, 
    attrib_RealInstances, 
    attrib_SessionTime, 
    attrib_TotalPacksOpened, 
    attrib_TotalPacksFarm, 
    attrib_SessionPacksOpened,
    attrib_DiffPacksSinceLastHB,
    attrib_DiffTimeSinceLastHB,
    attrib_PacksPerMin,
    attrib_GodPackFound, 
    attrib_LastActiveTime, 
    attrib_LastHeartbeatTime,
    attrib_TotalTime,
    attrib_TotalTimeFarm,
    attrib_TotalMiss,
    attrib_AntiCheatUserCount,
    attrib_SelectedPack,
    attrib_Subsystems,
    attrib_Subsystem,
    attrib_eligibleGPs,
    attrib_eligibleGP,
    attrib_liveGPs,
    attrib_liveGP,
    attrib_ineligibleGPs,
    attrib_ineligibleGP,
    pathUsersData,
    pathServerData,
    attrib_GodPackLive,
    attrib_TotalHBTick,
    attrib_TotalAveragePPM,
    attrib_TotalAverageInstances,
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
    ButtonBuilder, 
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
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
var evenTurnShortInterval = false;

function getNexIntervalRemainingTime() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startIntervalTime;
    const timeRemaining = (refreshInterval) - convertMsToMn(elapsedTime);
    return timeRemaining;
}

// var pouetTime = 0;
// var pouetPacks = 0;
// function spamHB(client){

//     const randomNumber = Math.random();
//     if (randomNumber < 0.1) {
//         pouetTime = 0;
//         pouetPacks = 0;
//     }

//     sendChannelMessage(client, channelID_Heartbeat, `181053462098870272
// Online: Main, 1, 2, 3, 4, 5, 6.
// Offline: none.
// Time: ${pouetTime}m Packs: ${pouetPacks} Avg: 0 packs/min
// Type: 5 Pack (Menu Delete)`)
//     pouetTime+=30;
//     pouetPacks+=60;
// }

// Events

client.once(Events.ClientReady, async c => {
    console.log(`✅ Logged in as ${c.user.tag}`);

    const guild = await getGuild(client);

    // Every "refreshInterval/2" mn it will alternate from sendUserStat to inactivityCheck
    setInterval(() =>{
        startIntervalTime = Date.now();
        evenTurnShortInterval = !evenTurnShortInterval;

        if (evenTurnShortInterval) {
            sendStats(client);
        } 
        else if(AutoKick) {
            inactivityCheck(client);
        }

    }, convertMnToMs(refreshInterval/2));

    // Send back the messages with buttons so ppl can switch states easily
    await sendStatusHeader(client)
    setInterval(async() =>{
        await sendStatusHeader(client)
    }, convertMnToMs(60));

    // Reset and Update ServerData every X hours (might disable the loop it if you have over 10k gp or it'll take a while)
    await updateServerData(client, true);
    setInterval(async() =>{
        await updateServerData(client);
    }, convertMnToMs(resetServerDataTime+1));

    // Backup UserData.xml file
    setInterval(async() =>{
        await backupFile(pathUsersData);
    }, convertMnToMs(backupUserDatasTime+1));

    setInterval(async() =>{
        await updateAntiCheat(client);
    }, convertMnToMs(5));

    await updateAntiCheat(client);

    // Backup UserData.xml file
    setInterval(async() =>{
        await updateInactiveGPs(client);
    }, convertMnToMs(60));
    
    await updateInactiveGPs(client);
    
    // setInterval(async() =>{
    //     spamHB(client);
    // }, convertMnToMs(0.02));

    // Clear all guild commands (Warning : also clear channels restrictions set on discord)
    // guild.commands.set([]);

    // Clear a specific guild command
    // const commandId = 'XXXXXXXXXXXXXXXXXXX';
    // await guild.commands.delete(commandId);

    // Commands Creation

    const playeridDesc = localize("Lie votre code ami à votre pseudo discord unique", "Link your ID Code with you Discord unique username");
    const playeridDescId = localize("Votre ID SANS TIRET", "Your ID without any dash");
    const playeridSCB = new SlashCommandBuilder()
        .setName(`setplayerid`)
        .setDescription(`${playeridDesc}\n`) 
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription(`${playeridDescId}`)
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

    const prefixDesc = localize("Renseignez votre préfixe de votre liste de nom d'utilisateur", "Set your prefix from your username list");
    const prefixDescPrefix = localize("Doit être composé de 4 lettres", "Needs to be 4 letters");
    const prefixSCB = new SlashCommandBuilder()
        .setName(`setprefix`)
        .setDescription(`${prefixDesc}\n`)
        .addStringOption(option =>
            option
                .setName("prefix")
                .setDescription(`${prefixDescPrefix}`)
                .setRequired(true)
        );

    const activeDesc = localize("Vous ajoute dans le doc d'ID", "Add yourself to the active rerollers list");
    const activeDescUser = localize("ADMIN ONLY : pour forcer l'ajout de quelqu'un d'autre", "ADMIN ONLY : Only usefull so force add someone else than yourself");
    const activeSCB = new SlashCommandBuilder()
        .setName(`active`)
        .setDescription(`${activeDesc}`)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription(`${activeDescUser}`)
                .setRequired(false)
        );
    
    const inactiveDesc = localize("Vous retire du doc d'ID"," Withdraw yourself from the active rerollers list");
    const inactiveDescUser = localize("ADMIN ONLY : pour forcer le retrait de quelqu'un d'autre", "ADMIN ONLY : Only usefull so force remove someone else than yourself");
    const inactiveSCB = new SlashCommandBuilder()
        .setName(`inactive`)
        .setDescription(`${inactiveDesc}`)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription(`${inactiveDescUser}`)
                .setRequired(false)
        );
        
    const farmDesc = localize("Vous ajoute dans le doc d'ID comme farmer (noMain)", "Add yourself to the active rerollers list as farmer (noMain)");
    const farmDescUser = localize("ADMIN ONLY : pour forcer l'ajout' de quelqu'un d'autre", "ADMIN ONLY : Only usefull so force add someone else than yourself");
    const farmSCB = new SlashCommandBuilder()
        .setName(`farm`)
        .setDescription(`${farmDesc}`)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription(`${farmDescUser}`)
                .setRequired(false)
        );

    const leechDesc = localize("Vous ajoute dans le doc d'ID comme leecher (onlyMain)", "Add yourself to the active rerollers list as leecher (onlyMain)");
    const leechDescUser = localize("ADMIN ONLY : pour forcer l'ajout' de quelqu'un d'autre", "ADMIN ONLY : Only usefull so force add someone else than yourself");
    const leechSCB = new SlashCommandBuilder()
        .setName(`leech`)
        .setDescription(`${leechDesc}`)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription(`${leechDescUser}`)
                .setRequired(false)
        );
    
    const refreshDesc = localize("Rafraichit la liste des Stats instantanément","Refresh the user stats instantly");
    const refreshSCB = new SlashCommandBuilder()
        .setName(`refresh`)
        .setDescription(`${refreshDesc}`);

    const forcerefreshDesc = localize("Rafraichit la liste des ids et les envois au server","Refresh the ids.txt and sent them to servers");
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

    const likedDesc = localize("Designe pack comme liké","Flag the post as liked");
    const likedSCB = new SlashCommandBuilder()
        .setName(`liked`)
        .setDescription(`${likedDesc}`);

    const notLikedDesc = localize("Designe pack comme non liké","Flag the post as not liked");
    const notLikedSCB = new SlashCommandBuilder()
        .setName(`notliked`)
        .setDescription(`${notLikedDesc}`);

    const missDesc = localize("Pour la verification GP, après X fois suivant le nombre de pack cela auto /dead", "For verification purposes, after X times based on pack amount it sends /dead");
    const missSCB = new SlashCommandBuilder()
        .setName(`miss`)
        .setDescription(`${missDesc}`);

    const misscountDesc = localize("Montre le rapport de miss par temps passé à roll", "Show how many miss rerollers have done while active");
    const misscountSCB = new SlashCommandBuilder()
        .setName(`misscount`)
        .setDescription(`${misscountDesc}`);

    const lastactivityDesc = localize("Montre à combien de temps remonte le dernier Heartbeat", "Show how long since the last Heartbeat was");
    const lastactivitySCB = new SlashCommandBuilder()
        .setName(`lastactivity`)
        .setDescription(`${lastactivityDesc}`);

    const generateusernamesDesc = localize("Génère liste basé sur préfixe et, facultatif, des mots","Generate a list based on a prefix and, if wanted, keywords");   
    const generateusernamesDescPrefix = localize("Les 4 premières lettres premières lettres de votre pseudo","The 4 firsts letter of your pseudonym");   
    const generateusernamesDescKeyword = localize("Des mots clés qui seront assemblés aléatoirement, espace/virgule = séparation","Some keywords that will be assembled randomly, space or comma are separations");   
    const generateusernamesSCB = new SlashCommandBuilder()
        .setName(`generateusernames`)
        .setDescription(`${generateusernamesDesc}`)
        .addStringOption(option =>
            option
                .setName("prefix")
                .setDescription(`${generateusernamesDescPrefix}`)
                .setRequired(true)
        ).addStringOption(option2 =>
            option2
                .setName("keywords")
                .setDescription(`${generateusernamesDescKeyword}`)
                .setRequired(false)
        );

    const addGPFoundDesc = localize("ADMIN ONLY : Ajoute un GP trouvé à un utilisateur pour les stats","ADMIN ONLY : Add a GP Found to an user for the stats");
    const addGPFoundDescUser = localize("seulement utile pour corriger des erreurs","Only usefull to fix bugs");
    const addGPFoundSCB = new SlashCommandBuilder()
        .setName(`addgpfound`)
        .setDescription(`${addGPFoundDesc}`)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription(`${addGPFoundDescUser}`)
                .setRequired(false)
        );

    const removeGPFoundDesc = localize("ADMIN ONLY : Retire un GP trouvé à un utilisateur pour les stats","ADMIN ONLY : Remove a GP Found to an user for the stats");
    const removeGPFoundDescUser = localize("seulement utile pour corriger des erreurs","only usefull to fix bugs");
    const removeGPFoundSCB = new SlashCommandBuilder()
    .setName(`removegpfound`)
    .setDescription(`${removeGPFoundDesc}`)
    .addUserOption(option =>
        option
            .setName("user")
            .setDescription(`${removeGPFoundDescUser}`)
            .setRequired(false)
    );

    const playeridCommand = playeridSCB.toJSON();
    client.application.commands.create(playeridCommand, guildID);

    const instancesCommand = instancesSCB.toJSON();
    client.application.commands.create(instancesCommand, guildID);

    const prefixCommand = prefixSCB.toJSON();
    client.application.commands.create(prefixCommand, guildID);

    const activeCommand = activeSCB.toJSON();
    client.application.commands.create(activeCommand, guildID);

    const inactiveCommand = inactiveSCB.toJSON();
    client.application.commands.create(inactiveCommand, guildID);

    const farmCommand = farmSCB.toJSON();
    client.application.commands.create(farmCommand, guildID);

    const leechCommand = leechSCB.toJSON();
    client.application.commands.create(leechCommand, guildID);

    const refreshCommand = refreshSCB.toJSON();
    client.application.commands.create(refreshCommand, guildID);

    const forcerefreshCommand = forcerefreshSCB.toJSON();
    client.application.commands.create(forcerefreshCommand, guildID);
    
    const verifiedCommand = verifiedSCB.toJSON();
    client.application.commands.create(verifiedCommand, guildID);
    
    const deadCommand = deadSCB.toJSON();
    client.application.commands.create(deadCommand, guildID);
    
    const likedCommand = likedSCB.toJSON();
    client.application.commands.create(likedCommand, guildID);
    
    const notLikedCommand = notLikedSCB.toJSON();
    client.application.commands.create(notLikedCommand, guildID);

    const missCommand = missSCB.toJSON();
    client.application.commands.create(missCommand, guildID);    
    
    const misscountCommand = misscountSCB.toJSON();
    client.application.commands.create(misscountCommand, guildID);

    const lastactivityCommand = lastactivitySCB.toJSON();
    client.application.commands.create(lastactivityCommand, guildID);
    
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

    const guild = await getGuild(client);

    // ======================= Buttons =======================
    
    try{

        if (interaction.customId === 'active') {
            await interaction.deferReply();
            setUserState(client, interaction.user, "active", interaction)
        } 
        else if (interaction.customId === 'farm') {
            await interaction.deferReply();
            setUserState(client, interaction.user, "farm", interaction)
        }
        else if (interaction.customId === 'leech') {
            await interaction.deferReply();
            setUserState(client, interaction.user, "leech", interaction)
        }
        else if (interaction.customId === 'inactive') {
            await interaction.deferReply();
            setUserState(client, interaction.user, "inactive", interaction)
        }
        else if (interaction.customId === 'refreshUserStats') {
            await interaction.deferReply();
            const text_listForceRefreshed = localize(`**Stats des rerollers actifs rafraichies dans <#${channelID_UserStats}>**`, `**Active rerollers stats refreshed in <#${channelID_UserStats}>**`);

            await sendReceivedMessage(client, text_listForceRefreshed, interaction, delayMsgDeleteState);
            sendStats(client)
        }

        if(!interaction.isChatInputCommand()) return;

        // SET PLAYER ID COMMAND
        if(interaction.commandName === `setplayerid`){

            await interaction.deferReply();
            const id = interaction.options.getString(`id`);

            const text_incorrectID = localize("ID Incorrect pour","ID Incorrect for");
            const text_incorrectReason = localize("Votre code doit être composé de **16 chifres**","Your could should be **16 numbers length**");
            const text_replace = localize("a été remplacé par","have been replaced by");
            const text_for = localize("pour","for");
            const text_set = localize("set pour","set for user");

            if(id.length != 16 || !isNumbers(id)){
                await sendReceivedMessage(client, text_incorrectID + ` **<@${interactionUserID}>**, ` + text_incorrectReason, interaction);
            }
            else{
                const userPocketID = await getUserAttribValue( client, interactionUserID, attrib_PocketID);
                    
                if( userPocketID != undefined ){

                    await setUserAttribValue( interactionUserID, interactionUserName, attrib_PocketID, cleanString(id));
                    await sendReceivedMessage(client, `Code **${userPocketID}** ` + text_replace + ` **${id}** ` + text_for + ` **<@${interactionUserID}>**`, interaction);
                }
                else{
                    await setUserAttribValue( interactionUserID, interactionUserName, attrib_PocketID, cleanString(id));
                    await sendReceivedMessage(client, `Code **${id}** ` + text_set + ` **<@${interactionUserID}>**`, interaction);
                }
            }
        }

        // ACTIVE COMMAND
        if(interaction.commandName === `active`){

            await interaction.deferReply();
            const text_missingPerm = localize("n\'a pas les permissions nécessaires pour changer l\'état de","do not have the permission de edit other user");
            
            var user = interaction.user;
            const userArg = interaction.options.getUser(`user`);
            
            if( userArg != null ){
                if(!canPeopleAddOthers) {
                    
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interactionUserID != user.id) {
                        return await sendReceivedMessage(client, `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, interaction);
                    }
                }
                var user = userArg;
            }

            setUserState(client, user, "active", interaction)
        }

        // INACTIVE COMMAND
        if(interaction.commandName === `inactive`){

            await interaction.deferReply();
            const text_missingPerm = localize("n\'a pas les permissions nécessaires pour changer l\'état de","do not have the permission de edit the other user");
            
            var user = interaction.user;
            const userArg = interaction.options.getUser(`user`);

            if( userArg != null){
                if(!canPeopleRemoveOthers) {

                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interactionUserID != user.id) {
                        return await sendReceivedMessage(client, `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, interaction);
                    }
                }
                var user = userArg;
            }

            setUserState(client, user, "inactive", interaction)
        }

        // FARM COMMAND
        if(interaction.commandName === `farm`){

            await interaction.deferReply();
            const text_missingPerm = localize("n\'a pas les permissions nécessaires pour changer l\'état de","do not have the permission de edit the other user");
            
            var user = interaction.user;
            const userArg = interaction.options.getUser(`user`);

            if( userArg != null){
                if(!canPeopleRemoveOthers) {

                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interactionUserID != user.id) {
                        return await sendReceivedMessage(client, `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, interaction);
                    }
                }
                var user = userArg;
            }

            setUserState(client, user, "farm", interaction)
        }

        // LEECH COMMAND
        if(interaction.commandName === `leech`){

            await interaction.deferReply();
            const text_missingPerm = localize("n\'a pas les permissions nécessaires pour changer l\'état de","do not have the permission de edit the other user");
            
            var user = interaction.user;
            const userArg = interaction.options.getUser(`user`);

            if( userArg != null){
                if(!canPeopleRemoveOthers) {

                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interactionUserID != user.id) {
                        return await sendReceivedMessage(client, `<@${interactionUserID}> ${text_missingPerm} <@${user.id}>`, interaction);
                    }
                }
                var user = userArg;
            }

            setUserState(client, user, "leech", interaction)
        }

        // REFRESH COMMAND
        if(interaction.commandName === `refresh`){
            
            await interaction.deferReply();
            const text_listForceRefreshed = localize(`**Stats des rerollers actifs rafraichies dans <#${channelID_UserStats}>**`, `**Active rerollers stats refreshed in <#${channelID_UserStats}>**`);

            await sendReceivedMessage(client, text_listForceRefreshed, interaction, delayMsgDeleteState);
            sendStats(client)
        }

        // FORCE REFRESH COMMAND
        if(interaction.commandName === `forcerefresh`){
            
            await interaction.deferReply();
            const refreshTime = roundToOneDecimal(getNexIntervalRemainingTime());
            const text_IDsRefreshedIn = localize("**IDs rafraichis**, rafraichissment des **Stats dans","**IDs refreshed**, reshing the **Stats in");
            const text_see = localize("voir","see");

            const text_listRefreshed = `${text_IDsRefreshedIn} ${refreshTime}mn**, ${text_see} <#${channelID_UserStats}>`;

            await sendReceivedMessage(client, text_listRefreshed, interaction, delayMsgDeleteState);
            sendIDs(client);
        }
        
        // VERIFIED COMMAND
        if(interaction.commandName === `verified`){
            
            await interaction.deferReply();
            const text_markAsVerified = localize("Godpack marqué comme live","Godpack marked as live");
            const text_alreadyVerified = localize("C'est gentil de ta part mais il est déjà vérifié le GodPack","That's kind of you but this GP already is verified");

            const thread = client.channels.cache.get(interaction.channelId);

            if(thread.name.includes(text_verifiedLogo)){
                await sendReceivedMessage(client, `${text_alreadyVerified}`, interaction);
            }
            else{
                const newPostName = replaceAnyLogoWith(thread.name, text_verifiedLogo);
    
                // Edit a thread
                await thread.edit({ name: `${newPostName}` });
                
                await addServerGP(attrib_liveGP, thread);

                await addUserDataGPLive(client, thread);
    
                await sendReceivedMessage(client, `${text_verifiedLogo} ${text_markAsVerified}`, interaction);
            }
        }

        // DEAD COMMAND
        if(interaction.commandName === `dead`){

            await interaction.deferReply();
            await markAsDead(client, interaction);
        }

        // LIKED COMMAND
        if(interaction.commandName === `liked`){
                    
            await interaction.deferReply();
            const text_markAsLiked = localize(`Godpack marqué comme **liké** ${text_likedLogo} beaucoup de chance d'être live`,`Godpack marked as **liked** ${text_likedLogo} likely to be live`);
            const text_alreadyLiked = localize("C'est gentil de ta part mais il est déjà marqué comme liké","That's kind of you but this GP already is already marked as liked");

            const thread = client.channels.cache.get(interaction.channelId);

            if(thread.name.includes(text_likedLogo)){
                await sendReceivedMessage(client, `${text_alreadyLiked}`, interaction);
            }
            else{
                const newPostName = replaceAnyLogoWith(thread.name, text_likedLogo);
                await thread.edit({ name: `${newPostName}` });

                await sendReceivedMessage(client, `${text_markAsLiked}`, interaction);
            }
        }

        // NOT LIKED COMMAND
        if(interaction.commandName === `notliked`){
            
            await interaction.deferReply();
            const text_markAsNotLiked = localize(`Godpack marqué comme **non liké** ${text_notLikedLogo} Peu de chance d'être live\n**Nombre de miss total requis**`,`Godpack marked as **not liked** ${text_notLikedLogo} Unlikely to be live\n**Total amount of miss required**`);
            const text_alreadyNotLiked = localize("C'est gentil de ta part mais il est déjà marqué comme non liké","That's kind of you but this GP already is already marked as not liked");

            const thread = client.channels.cache.get(interaction.channelId);

            if(thread.name.includes(text_notLikedLogo)){
                await sendReceivedMessage(client, `${text_alreadyNotLiked}`, interaction);
            }
            else{
                // Edit the initial message to divide multiplier miss required by missNotLikedMultiplier[numbersTwoStars]
                const initialMessage = await getOldestMessage(thread);
                const splitForumContent = splitMulti(initialMessage.content,['[',']']);

                if (splitForumContent.length > 1){

                    const numbersMiss = extractNumbers(splitForumContent[1]);
                    const numbersTwoStars = extractTwoStarAmount(thread.name);
            
                    var missAmount = parseInt(numbersMiss[0]);
                    var missNeeded = numbersMiss[1];
                    var newMissNeeded = Math.round(parseInt(missNeeded)*missNotLikedMultiplier[numbersTwoStars]);

                    const text_finalNotLiked = text_markAsNotLiked + ` **x${missNotLikedMultiplier[numbersTwoStars]}\n[ ${missAmount} miss / ${newMissNeeded} ]**`
                    
                    // Check if, once modified, the missAmount is greater or equal to the new newMissNeeded
                    if (missAmount>=newMissNeeded){
                        
                        const text_failed = localize(`Po\n`,`Well rip,`) + ` **[ ${newMissAmount} miss / ${missNeeded} ]**\n`;
                        await markAsDead(client, interaction, text_finalNotLiked + localize(`\n\nCependant comportant deja suffisement de Miss pour être considéré comme\n`,`\n\nThought enough misses to be considered as\n`));
                    }
                    else{ // Else, the missAmount is lower to the new newMissNeeded

                        const newPostName = replaceAnyLogoWith(thread.name, text_notLikedLogo);
                        await thread.edit({ name: `${newPostName}` });
                        await initialMessage.edit(`${replaceMissNeeded(initialMessage.content, newMissNeeded)}`);
                        await sendReceivedMessage(client, `${text_finalNotLiked}`, interaction);
                    }
                }
                else{
                    await sendReceivedMessage(client, text_notCompatible, interaction);
                }
            }
        }

        // MISS COMMAND
        if(interaction.commandName === `miss`){

            await interaction.deferReply();
            const text_notCompatible = localize("Le GP est dans **l'ancien format**, /miss incompatible","The GP is using the **old format**, /miss incompatible");
            const text_scam = localize("Oh le petit malin il a essayé de scam un miss 🤡\nVenez voir tout le monde","Little sneaky boy tried to scam a miss 🤡\nCome see everyone");

            const thread = client.channels.cache.get(interaction.channelId);

            // Only add a miss for posts marked as notLiked, Waiting or Liked
            if (thread.name.includes(text_notLikedLogo) || thread.name.includes(text_waitingLogo) || thread.name.includes(text_likedLogo)){

                const initialMessage = await getOldestMessage(thread);
                const splitForumContent = splitMulti(initialMessage.content,['[',']']);

                if (splitForumContent.length > 1){

                    const numbersMiss = extractNumbers(splitForumContent[1]);
            
                    var missAmount = numbersMiss[0];
                    var newMissAmount = parseInt(missAmount)+1;
                    var missNeeded = numbersMiss[1];

                    var totalMiss = await getUserAttribValue( client, interactionUserID, attrib_TotalMiss, 0 );
                    await setUserAttribValue( interactionUserID, interactionUserName, attrib_TotalMiss, parseInt(totalMiss)+1);

                    if(newMissAmount >= missNeeded){
                        
                        await initialMessage.edit( `${replaceMissCount(initialMessage.content, newMissAmount)}`);

                        const text_failed = localize(`C'est finito\n`,`Well rip,`) + ` **[ ${newMissAmount} miss / ${missNeeded} ]**\n`;
                        await markAsDead(client, interaction, text_failed);
                    }
                    else{
                        await initialMessage.edit( `${replaceMissCount(initialMessage.content, newMissAmount)}`);
                        
                        // If miss is <= 50% the amount sentences are """encouraging""" then it gets worst and even more after 75% 
                        const text_fitTension = newMissAmount <= missNeeded*0.5 ? text_lowTension(client) : newMissAmount <= missNeeded*0.75 ? text_mediumTension(client) : text_highTension(client);
                        await sendReceivedMessage(client, `${text_fitTension}\n**[ ${newMissAmount} miss / ${missNeeded} ]**`, interaction);            
                    }
                }
                else{
                    await sendReceivedMessage(client, text_notCompatible, interaction);
                }
            }
            else{
                await sendReceivedMessage(client, text_scam, interaction);
            }
        }

        // MISS COUNT COMMAND
        if(interaction.commandName === `misscount`){

            await interaction.deferReply();

            // text_days = localize("jour","h");
            var activityOutput = "\`\`\`\n";

            const allUsers = await getAllUsers();

            for( var i = 0; i < allUsers.length; i++ ) {
                
                var user = allUsers[i];
                var userID = getIDFromUser(user);
                
                const member = await getMemberByID(client, userID);

                // Skip if member do not exist
                if (member == "") {
                    console.log(`❗️ User ${userID} is no registered on this server`)
                    continue;
                }

                var userDisplayName = member.displayName;
                const totalMiss = getAttribValueFromUser(user, attrib_TotalMiss, 0);
                const totalTime = getAttribValueFromUser(user, attrib_TotalTime, 0);
                const totalTimeHour = parseFloat(totalTime)/60;
                var missPer24Hour = roundToOneDecimal( (parseFloat(totalMiss) / totalTimeHour) * 24 );

                missPer24Hour = isNaN(missPer24Hour) || missPer24Hour == Infinity ? 0 : missPer24Hour;

                activityOutput += addTextBar(`${userDisplayName} `, 20, false) + ` ${missPer24Hour} miss / 24h - ${totalMiss} miss over ${roundToOneDecimal(totalTimeHour)}h\n`
            };

            activityOutput+="\`\`\`";

            await sendReceivedMessage(client, activityOutput, interaction);
        }

        // LAST ACTIVITY COMMAND
        if(interaction.commandName === `lastactivity`){

            await interaction.deferReply();

            // text_days = localize("jour","h");
            var activityOutput = "\`\`\`\n";

            const allUsers = await getAllUsers();

            for( var i = 0; i < allUsers.length; i++ ) {
                
                var userID = getIDFromUser(allUsers[i]);
                const member = await getMemberByID(client, userID);

                // Skip if member do not exist
                if (member == "") {
                    console.log(`❗️ Heartbeat from ID ${userID} is no registered on this server`)
                    continue;
                }

                var userDisplayName = member.displayName;

                const lastHBTime = new Date(getAttribValueFromUser(allUsers[i], attrib_LastHeartbeatTime));
                var diffTime = (Date.now() - lastHBTime) / 60000 / 60;
                diffTime = roundToOneDecimal(diffTime);

                activityOutput += addTextBar(`${userDisplayName} `, 20, false) + ` ${diffTime} h since last hb\n`
            };

            activityOutput+="\`\`\`";

            await sendReceivedMessage(client, activityOutput, interaction);
        }

        // GENERATE USERNAMES COMMAND
        if(interaction.commandName === `generateusernames`){

            await interaction.deferReply();
            const text_incorrectPrefix = localize("Le préfixe doit être composé de 4 Lettres","The prefix needs to be 4 letters");
            const text_incorrectParameters = localize("Paramètres incorrects, entre prefix ET keywords","Incorrect parameters, write prefix AND keyworks");
            const text_listGenerated = localize("Nouvelle liste d'usernames generé :","New usernames.txt list generated :");

            const prefix = interaction.options.getString(`prefix`).toUpperCase();
            var keyWords = interaction.options.getString(`keywords`);

            if(prefix.length != 4)
            {
                return await sendReceivedMessage(client, text_incorrectPrefix, interaction);
            }

            if(prefix == null || keyWords == null)
            {
                return await sendReceivedMessage(client, text_incorrectParameters, interaction);
            }
            
            keyWords = keyWords.replaceAll(`,`, ` `).split(' ');
            const wordsGenerated = 1000;
            const maxNameLength = 14;
            const prefixLength = prefix.length + 1; // Include the underscore in the length calculation

            const forbiddenWords = ["ass","sht","nazi","anus","nig","rape","pede","dic","bitte","hymen","pimp","shto","ugly","bch","nun","tara","wth","bastard","baka","cono"];

            var content = "";

            for (let i = 0; i < wordsGenerated; i++) {
                
                var generatedWord = "";

                for (let attempts = 0; attempts < 50; attempts++) {

                    // Break if maxNameLength-1 is hit
                    if (prefixLength + generatedWord.length >= maxNameLength-1) {break;}

                    const randomIndex = Math.floor(Math.random() * keyWords.length);
                    var keyWord = keyWords[randomIndex];
                    // Remove all special characters
                    keyWord = keyWord.replaceAll(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');

                    if (prefixLength + (generatedWord + keyWord).length > maxNameLength) {
                        continue;
                    } 
                    else {
                        generatedWord = generatedWord + keyWord;
                    }
                }

                const fullName = prefix + "O" + generatedWord; // I = separator as it seems adbShell.StdIn.WriteLine can't input special characters 
                if (!forbiddenWords.some(word => fullName.includes(word))) {
                    content = content + fullName + " \n";
                }
            }

            await sendReceivedMessage(client, text_listGenerated, interaction);
            await interaction.channel.send({
                files: [{
                    attachment: Buffer.from(content),
                    name: 'usernames_default.txt'
                }]
            })
        }

        // SET AVERAGE INSTANCES COMMAND
        if(interaction.commandName === `setaverageinstances`){

            await interaction.deferReply();
            const amount = interaction.options.getInteger(`amount`);

            const text_instancesSetTo = localize("Nombre d'instance moyenne défini à","Average amount of instances set to");
            const text_incorrectAmount = localize("Petit clown va, entre ton vrai nombre d'instances","You little clown, enter your real number of instances");
            const text_for = localize("pour","for");

            if(amount < 1 || amount > 100){
                await sendReceivedMessage(client, text_incorrectAmount, interaction);
            }
            else{
                await setUserAttribValue( interactionUserID, interactionUserName, attrib_AverageInstances, amount);
                await sendReceivedMessage(client, text_instancesSetTo + ` **${amount}** ` + text_for + ` **<@${interactionUserID}>**`, interaction);
            }
        }

        // ADD GP FOUND COMMAND
        if(interaction.commandName === `addgpfound`){

            await interaction.deferReply();        
            const text_addGP = localize("Ajout d\'un GP pour","Add a GP for");
            const text_missingPerm = localize("n\'a pas les permissions d\'Admin","do not have Admin permissions");
            
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return await sendReceivedMessage(client, `<@${interactionUserID}> ${text_missingPerm}`, interaction);
            }

            const user = interaction.options.getUser(`user`);
            if( user != null){
                interactionUserName = user.username;
                interactionUserID = user.id;
            }

            var GPCount = parseInt(await getUserAttribValue( client, interactionUserID, attrib_GodPackFound));
            await setUserAttribValue( interactionUserID, interactionUserName, attrib_GodPackFound, GPCount+1);
            await sendReceivedMessage(client, `${text_addGP} **<@${interactionUserID}>**`, interaction);
        }

        // REMOVE GP FOUND COMMAND
        if(interaction.commandName === `removegpfound`){

            await interaction.deferReply();
            const text_removeGP = localize("Retrait d\'un GP pour","Remove a GP for");
            const text_minimumGP = localize("Nombre de GP déjà au minimum pour","GP Count already at the minimum value for");
            const text_missingPerm = localize("n\'a pas les permissions d\'Admin","do not have Admin permissions");

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return await sendReceivedMessage(client, `<@${interactionUserID}> ${text_missingPerm}`, interaction);
            }

            const user = interaction.options.getUser(`user`);
            if( user != null){
                interactionUserName = user.username;
                interactionUserID = user.id;
            }

            var GPCount = parseInt(await getUserAttribValue( client, interactionUserID, attrib_GodPackFound));
            if (GPCount > 0){
                await setUserAttribValue( interactionUserID, interactionUserName, attrib_GodPackFound, GPCount-1);
                await sendReceivedMessage(client, `${text_removeGP} **<@${interactionUserID}>**`, interaction);
            }
            else{
                await sendReceivedMessage(client, `${text_minimumGP} **<@${interactionUserID}>**`, interaction);
            }
        }

        // SET PREFIX COMMAND
        if(interaction.commandName === `setprefix`){

            await interaction.deferReply();
            const prefix = interaction.options.getString(`prefix`).toUpperCase();

            const text_instancesSetTo = localize("Préfixe défini à","Prefix set to");
            const text_incorrectLength = localize("Le Préfixe doit être composé d'exactement 4 lettres","The Prefix must consist of exactly 4 letters");
            const text_otherPrefixe = localize("L'autre préfixe existant","The other existing prefix");
            const text_tooSimilar = localize("s'apparente trop à","is too similar to");
            const text_for = localize("pour","for");

            if(prefix.length != 4){
                await sendReceivedMessage(client, text_incorrectLength, interaction);
            }
            else{
                const allUsers = await getAllUsers();
                const othersPrefix = getAttribValueFromUsers(allUsers, attrib_Prefix, [0]);

                for(let i = 0; i < othersPrefix.length; i++){

                    const otherPrefix = othersPrefix[i];

                    if(otherPrefix == undefined || otherPrefix == 0 ){continue;}

                    if(normalizeOCR(otherPrefix).toUpperCase() == normalizeOCR(prefix)){
                        await sendReceivedMessage(client, `${text_otherPrefixe} **\"${otherPrefix}\"** ${text_tooSimilar} **\"${prefix}\"**`, interaction);
                        return;
                    }
                }

                await setUserAttribValue( interactionUserID, interactionUserName, attrib_Prefix, prefix);
                await sendReceivedMessage(client, text_instancesSetTo + ` \"**${prefix}**\" ` + text_for + ` **<@${interactionUserID}>**`, interaction);
            }
        }
    }
    catch(error){
        console.error('❌ ERROR - Crash Prevented\n', error);
    }
});

client.on("messageCreate", async (message) => {

    const guild = await getGuild(client);

    // Do never continue if the author is the bot, that should not filter webhooks
    if (message.author.id === client.user.id) return;

    if (message.channel.id === channelID_Webhook)
    {
        //Execute when screen is posted
        if (message.attachments.first() != undefined && !message.content.toLowerCase().includes("invalid") && message.content.toLowerCase().includes("god pack found") ) {

            var GPInfo = extractGPInfo(message.content);

            var ownerID = GPInfo.ownerID;
            var accountName = GPInfo.accountName;
            var accountID = GPInfo.accountID;
            var twoStarsRatio = GPInfo.twoStarRatio;
            var packAmount = GPInfo.packAmount;

            var titleName = `${accountName} [${packAmount}P][${twoStarsRatio}/5]`;
            
            if(twoStarsRatio <= forceSkipMin2Stars && packAmount > forceSkipMinPacks){return;}

            await createForumPost(client, message, channelID_GPVerificationForum, "GodPack", titleName, ownerID, accountID, packAmount);
        }

        //Execute when screen is posted
        else if (message.attachments.first() != undefined && !message.content.toLowerCase().includes("invalid") && message.content.toLowerCase().includes("double") ) {

            if(channelID_2StarVerificationForum == ""){return;}

            var GPInfo = extractGPInfo(message.content);

            var ownerID = GPInfo.ownerID;
            var accountName = GPInfo.accountName;
            var accountID = GPInfo.accountID;
            var packAmount = GPInfo.packAmount;

            var titleName = `${accountName} [${packAmount}P]`;

            await createForumPost(client, message, channelID_2StarVerificationForum, "Double 2Star", titleName, ownerID, accountID, packAmount);
        }

        else if (message.author.bot && message.content.toLowerCase().includes("invalid")) {
            await addServerGP(attrib_ineligibleGP, message);
        }
    }

    if (message.channel.id === channelID_Heartbeat)
    {
        const text_WrongHB = localize("Quelqu'un a mal configuré ses paramètres Heartbeat","Someone missed up their Heartbeat settings");
        const text_CorrectInput = localize(
            "Veuillez vérifier que vous avez bien entré votre **DiscordID** sur le script AHK dans l'onglet Discord Heartbeat Name, ca devrait ressembler ca : \`\`\`0123456789012345\`\`\` Pour votre PC principal et \`\`\`0123456789012345_YOURPCNAME\`\`\` Pour les autre ordinateurs si vous souhaitez en utiliser plusieurs",
            "Please verify you had input your **DiscordID** in the AHK script under Discord Heartbeat Name, it should look like this : \`\`\`0123456789012345\`\`\` For your main PC and \`\`\`0123456789012345_YOURPCNAME\`\`\` For others computers if you wish to use multiple"
        );

        var heartbeatDatas = message.content.split("\n");
        const firstLine = heartbeatDatas[0];
        const firstLineSplit = firstLine.split("_");
        const userID = firstLineSplit[0];

        // I At this time it seems that discordID are 17 to 19 length but it costs nothing to keep a little margin
        if(userID.length < 17 || userID.length > 20 || !isNumbers(userID)){
            return await message.reply(`${text_WrongHB} **( ${userID} )**\n${text_CorrectInput}`);
        }

        const member = await getMemberByID(client, userID);

        // Skip if member do not exist
        if (member == "") {
            console.log(`❗️ Heartbeat from ID ${userID} is no registered on this server`)
            return;
        }

        var userUsername = member.user.username;
        
        if(firstLineSplit.length <= 1 ) { // If ID do not have underscore

            if(await doesUserProfileExists(userID, userUsername)){

                var instances = 0;
                var timeAndPacks = 0;
                var selectedPacks = "";

                heartbeatDatas.forEach((heartbeatData) =>{
                    if (heartbeatData.includes("Online:")){
                        instances = extractNumbers(heartbeatData).length;
                    }
                    else if (heartbeatData.includes("Packs:")){
                        timeAndPacks = extractNumbers(heartbeatData);
                    }
                    else if (heartbeatData.includes("Select:")){
                        selectedPacks = heartbeatData.replace("Select: ","");
                    }
                });
                
                await setUserAttribValue( userID, userUsername, attrib_SelectedPack, selectedPacks);

                const time = timeAndPacks[0];
                var packs = parseInt(timeAndPacks[1]);

                var sessionPacks = parseInt(await getUserAttribValue( client, userID, attrib_SessionPacksOpened, 0 ));
                var diffPacks = Math.max(packs-sessionPacks,0);

                var userState = await getUserAttribValue( client, userID, attrib_UserState, 0 );

                if( time == "0" ){
                    var totalTime = await getUserAttribValue( client, userID, attrib_TotalTime, 0 );
                    var sessionTime = await getUserAttribValue( client, userID, attrib_SessionTime, 0 );
                    await setUserAttribValue( userID, userUsername, attrib_TotalTime, parseFloat(totalTime) + parseFloat(sessionTime));

                    var totalPacks = await getUserAttribValue( client, userID, attrib_TotalPacksOpened, 0 );
                    await setUserAttribValue( userID, userUsername, attrib_TotalPacksOpened, parseInt(totalPacks) + sessionPacks);
                }
                else{
                    if(userState == "farm"){
                        var totalTimeFarm = await getUserAttribValue( client, userID, attrib_TotalTimeFarm, 0 );
                        var totalPacksFarm = await getUserAttribValue( client, userID, attrib_TotalPacksFarm, 0 );
                        var sessionTime = await getUserAttribValue( client, userID, attrib_SessionTime, 0 );
                        var diffTime = Math.max( parseFloat(time) - parseFloat(sessionTime), 0 );
                        await setUserAttribValue( userID, userUsername, attrib_TotalTimeFarm, parseFloat(totalTimeFarm) + diffTime);
                        await setUserAttribValue( userID, userUsername, attrib_TotalPacksFarm, parseFloat(totalPacksFarm) + diffPacks);
                    }

                    var totalHBTick = parseInt( await getUserAttribValue( client, userID, attrib_TotalHBTick, 0 ) ) + 1;
                    await setUserAttribValue( userID, userUsername, attrib_TotalHBTick, totalHBTick);

                    var packPerMin = parseFloat( await getUserAttribValue( client, userID, attrib_PacksPerMin, 0 ) );
                    var totalAvgPackPerMin = parseFloat( await getUserAttribValue( client, userID, attrib_TotalAveragePPM, 0 ) );
                    await setUserAttribValue( userID, userUsername, attrib_TotalAveragePPM, updateAverage(totalAvgPackPerMin, totalHBTick, packPerMin));

                    var realInstances = parseFloat( await getUserAttribValue( client, userID, attrib_RealInstances, 0 ) );
                    var totalAvgInstances = parseFloat( await getUserAttribValue( client, userID, attrib_TotalAverageInstances, 0 ) );
                    await setUserAttribValue( userID, userUsername, attrib_TotalAverageInstances, updateAverage(totalAvgInstances, totalHBTick, realInstances));
                }

                const lastHBTime = new Date(await getUserAttribValue( client, userID, attrib_LastHeartbeatTime, 0 ));
                var diffHBTime = (Date.now() - lastHBTime) / 60000;
                await setUserAttribValue( userID, userUsername, attrib_DiffTimeSinceLastHB, diffHBTime);

                await setUserAttribValue( userID, userUsername, attrib_DiffPacksSinceLastHB, diffPacks);
                await setUserAttribValue( userID, userUsername, attrib_SessionTime, time);
                await setUserAttribValue( userID, userUsername, attrib_SessionPacksOpened, packs);
                await setUserAttribValue( userID, userUsername, attrib_HBInstances, instances);
                await setUserAttribValue( userID, userUsername, attrib_LastHeartbeatTime, new Date().toString());

                console.log(`💚 HB ${userUsername}`);
                
                const mainInactive = heartbeatDatas[2].toLowerCase().includes("main");
                
                if(AutoKick){

                    if(mainInactive && inactiveIfMainOffline && !userState == "farm"){
                        await setUserAttribValue( userID, userUsername, attrib_UserState, "inactive");
                        sendIDs(client);
                        // And prevent him that he have been kicked
                        const text_haveBeenKicked = localize("a été kick des rerollers actifs car son Main est Offline"," have been kicked out of active rerollers due to Main being Offline");
                        sendChannelMessage(client, channelID_Commands, `<@${userID}> ${text_haveBeenKicked}`)
                        console.log(`✖️ Kicked ${userUsername} - Main was Offline`);
                    }
                }
            }
        }
        else{ // If ID have underscore

            const subSystemName = firstLineSplit[1];

            if(await doesUserProfileExists(userID, userUsername)){
            
                var instances = 0;
                var timeAndPacks = 0;
                var selectedPacks = "";

                heartbeatDatas.forEach((heartbeatData) =>{
                    if (heartbeatData.includes("Online:")){
                        instances = extractNumbers(heartbeatData).length;
                    }
                    else if (heartbeatData.includes("Packs:")){
                        timeAndPacks = extractNumbers(heartbeatData);
                    }
                    else if (heartbeatData.includes("Select:")){
                        selectedPacks = heartbeatData.replace("Select: ","");
                    }
                });
                
                await setUserSubsystemAttribValue( userID, userUsername, subSystemName, attrib_SelectedPack, selectedPacks);

                const time = timeAndPacks[0];
                var packs = parseInt(timeAndPacks[1]);

                var sessionSubsystemPacks = parseInt(await getUserSubsystemAttribValue( client, userID, subSystemName, attrib_SessionPacksOpened, 0 ));
                var diffPacks = Math.max(packs-sessionSubsystemPacks,0);

                var userState = await getUserAttribValue( client, userID, attrib_UserState, 0 );
                
                if( time == "0" ){
                    var totalPacks = await getUserAttribValue( client, userID, attrib_TotalPacksOpened, 0 );
                    await setUserAttribValue( userID, userUsername, attrib_TotalPacksOpened, parseInt(totalPacks) + parseInt(sessionSubsystemPacks));
                }
                else{
                    if(userState == "farm"){
                        var totalPacksFarm = await getUserAttribValue( client, userID, attrib_TotalPacksFarm, 0 );
                        await setUserAttribValue( userID, userUsername, attrib_TotalPacksFarm, parseFloat(totalPacksFarm) + diffPacks);
                    }
                }
                
                await setUserSubsystemAttribValue( userID, userUsername, subSystemName, attrib_DiffPacksSinceLastHB, diffPacks);
                await setUserSubsystemAttribValue( userID, userUsername, subSystemName, attrib_SessionTime, time);
                await setUserSubsystemAttribValue( userID, userUsername, subSystemName, attrib_SessionPacksOpened, packs);
                await setUserSubsystemAttribValue( userID, userUsername, subSystemName, attrib_HBInstances, instances);
                await setUserSubsystemAttribValue( userID, userUsername, subSystemName, attrib_LastHeartbeatTime, new Date().toString());
                
                console.log(`🩵 HB ${userUsername} subsystem ${subSystemName}`);

                const mainInactive = heartbeatDatas[2].toLowerCase().includes("main");
                
                if(AutoKick){
                    
                    if(mainInactive && inactiveIfMainOffline && !userState == "farm"){
                        await setUserAttribValue( userID, userUsername, attrib_UserState, "inactive");
                        sendIDs(client);
                        // And prevent him that he have been kicked
                        const text_haveBeenKicked = localize("a été kick des rerollers actifs car son Main est Offline"," have been kicked out of active rerollers due to Main being Offline");
                        sendChannelMessage(client, channelID_Commands, `<@${userID}> ${text_haveBeenKicked}`)
                        console.log(`✖️ Kicked ${userUsername} - Main was Offline`);
                    }
                }
            }
        }
    }
});

client.login(token);