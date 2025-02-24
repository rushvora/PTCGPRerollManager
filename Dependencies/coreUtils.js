import {
    token,
    guildID,
    channelID_IDs,
    channelID_UserStats,
    channelID_GPVerificationForum,
    channelID_2StarVerificationForum,
    channelID_Webhook,
    channelID_Heartbeat,
    gitToken,
    gitGistID,
    gitGistGroupName,
    gitGistGPName,
    missBeforeDead,
    EnglishLanguage,
    AutoKick,
    refreshInterval,
    inactiveTime,
    inactiveInstanceCount,
    inactivePackPerMinCount,
    inactiveIfMainOffline,
    heartbeatRate,
    delayMsgDeleteState,
    canPeopleAddOthers,
    canPeopleRemoveOthers,
    canPeopleLeech,
    leechPermGPCount,
    leechPermPackCount,
    text_verifiedLogo,
    text_deadLogo,
    text_waitingLogo,
} from '../config.js';

import {
    sumIntArray, 
    sumFloatArray, 
    roundToOneDecimal, 
    countDigits, 
    extractNumbers, 
    isNumbers,
    convertMnToMs,
    convertMsToMn,
    splitMulti, 
    replaceLastOccurrence,
    replaceMissCount,
    sendReceivedMessage, 
    sendChannelMessage,
    bulkDeleteMessages, 
    colorText, 
    addTextBar,
    localize,
    getRandomStringFromArray,
    getOldestMessage,
    wait,
} from './utils.js';

import {
    doesUserProfileExists,
    setUserAttribValue,
    getUserAttribValue,
    setUserSubsystemAttribValue,
    getUserSubsystemAttribValue,
    getActiveUsers,
    getActiveIDs,
    getAllUsers,
    getUsernameFromUsers, 
    getUsernameFromUser, 
    getIDFromUsers, 
    getIDFromUser, 
    getAttribValueFromUsers,
    getAttribValueFromUser,
    getAttribValueFromUserSubsystems,
    refreshUserActiveState,
    refreshUserRealInstances,
    cleanString,
} from './xmlManager.js';

import {
    attrib_PocketID,
    attrib_UserState,
    attrib_AverageInstances,
    attrib_HBInstances,
    attrib_RealInstances,
    attrib_SessionTime,
    attrib_TotalPacksOpened, 
    attrib_SessionPacksOpened,
    attrib_DiffPacksSinceLastHB,
    attrib_PacksPerMin,
    attrib_GodPackFound,
    attrib_LastActiveTime,
    attrib_LastHeartbeatTime,
    attrib_TotalTime,
    attrib_TotalMiss,
} from './xmlConfig.js';

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

import {
    updateGist,
} from './uploadUtils.js';

// Core Functions

async function getGuild( client ){
    return await client.guilds.fetch(guildID);
}

async function getMemberByID(client, id){

    const guild = await getGuild(client);

    try{
        return await guild.members.fetch(cleanString(id));
    }
    catch{
        return ""
    }
}

async function getUsersStats(users, members){

    var usersStats = []

    for (const user of users) {

        var userOutput = `\`\`\`ansi\n`;

        const currentTime = new Date();
        const id = getIDFromUser(user);
        const username = getUsernameFromUser(user);
        var visibleUsername = username;

        // Check for State

        const userState = getAttribValueFromUser(user, attrib_UserState, "inactive");

        // Subsystems stats
        const instancesSubsystems = getAttribValueFromUserSubsystems(user, attrib_HBInstances, 0);
        const sessionTimeSubsystems = getAttribValueFromUserSubsystems(user, attrib_SessionTime, 0);
        const sessionPacksSubsystems = getAttribValueFromUserSubsystems(user, attrib_SessionPacksOpened, 0);
        const lastHBTimeSubsystems = getAttribValueFromUserSubsystems(user, attrib_LastHeartbeatTime, 0);
        const diffPacksSinceLastHBSubsystems = getAttribValueFromUserSubsystems(user, attrib_DiffPacksSinceLastHB, 0);

        var session_PacksSubsystems = 0;
        var total_PacksSinceLastHbSubsystems = 0;
        var total_PacksSubsystems = 0;
        var total_diffPacksSinceLastHBSubsystems = 0;
        var biggerSessionTimeSubsystems = 0;

        for (let i = 0; i < lastHBTimeSubsystems.length; i++){

            const diffHBSubsystem = (currentTime - new Date(lastHBTimeSubsystems[i])) / 60000;
            
            if(diffHBSubsystem < parseFloat(heartbeatRate+1)){ // If last HB less than Xmn then count instances and session time
                biggerSessionTimeSubsystems = Math.max(biggerSessionTimeSubsystems, sessionTimeSubsystems[i]);
                session_PacksSubsystems += parseFloat(sessionPacksSubsystems[i]);
                total_diffPacksSinceLastHBSubsystems += parseFloat(diffPacksSinceLastHBSubsystems[i]);
            }
            total_PacksSubsystems += parseFloat(sessionPacksSubsystems[i]);
        }

        // Activity check
        members.forEach( member =>{
            if(username === member.user.username) {
                visibleUsername = member.displayName;
            }
        });

        const userActiveState = await refreshUserActiveState(user);
        const activeState = userActiveState[0];
        var inactiveTime = userActiveState[1];

        var barOffset = 50;
        
        if(userState == "active"){
            if(activeState == "active")
            {
                userOutput += colorText(visibleUsername, "green");
            }
            else if (activeState == "waiting") {
                userOutput += colorText(visibleUsername, "yellow") + " - started";
            }
            else{ // Inactive
                inactiveTime = Math.round(parseFloat(inactiveTime));
                userOutput += colorText(visibleUsername, "red") + ` - inactive for ${colorText(inactiveTime,"red")}mn`;
                barOffset += 11; // 11 more because coloring the text adds 11 hidden characters
            }
        }
        else if(userState == "farm"){
            userOutput += colorText(visibleUsername, "cyan");
        }
        else if(userState == "leech"){
            userOutput += colorText(visibleUsername, "pink");
        }

        userOutput = addTextBar(userOutput, barOffset);

        // Instances
        
        var instances = await refreshUserRealInstances(user, activeState);
        userOutput += colorText(` ${instances} instances\n`, "gray");

        // Session stats       

        var sessionTime = getAttribValueFromUser(user, attrib_SessionTime)
        sessionTime = roundToOneDecimal( parseFloat( Math.max(sessionTime, biggerSessionTimeSubsystems) ) );
        var sessionPackF = parseFloat(getAttribValueFromUser(user, attrib_SessionPacksOpened)) + session_PacksSubsystems;

        const text_Session = colorText("Session:", "gray");
        const text_sessionTime = colorText("running " + sessionTime + "mn", "gray");
        const text_sessionPackF = colorText("w/ " + sessionPackF + " packs", "gray");

        // Calculate packs/mn
        var diffPacksSinceLastHb = parseFloat(getAttribValueFromUser(user, attrib_DiffPacksSinceLastHB)) + total_diffPacksSinceLastHBSubsystems;
        var avgPackMn = roundToOneDecimal(diffPacksSinceLastHb/heartbeatRate);
        avgPackMn = isNaN(avgPackMn) ? 0 : avgPackMn;
        await setUserAttribValue( id, username, attrib_PacksPerMin, avgPackMn);
        const text_avgPackMn = colorText(avgPackMn, "blue");

        userOutput += `    ${text_Session} ${text_avgPackMn} packs/mn  ${text_sessionTime} ${text_sessionPackF}\n`

        // Pack stats
        const totalPack = parseInt(getAttribValueFromUser(user, attrib_TotalPacksOpened));
        var sessionPackI = parseInt(getAttribValueFromUser(user, attrib_SessionPacksOpened)) + total_PacksSubsystems;

        const totalGodPack = parseInt(getAttribValueFromUser(user, attrib_GodPackFound));
        const avgGodPack = roundToOneDecimal(totalGodPack >= 1 ? (totalPack+sessionPackI)/totalGodPack : (totalPack+sessionPackI));

        const text_GPAvg = colorText("GP Avg:", "gray");
        const text_Packs = colorText("Packs:", "gray");
        const text_GP = colorText("GP:", "gray");
        const text_TotalPack = colorText(totalPack + sessionPackI, "blue");
        const text_TotalGodPack = colorText(totalGodPack, "blue");
        const text_GPRatio = totalGodPack >= 1 ? '1/' : '0/';
        const text_AvgGodPack = colorText(`${text_GPRatio}${avgGodPack}`, `blue`);

        userOutput += `    ${text_Packs} ${text_TotalPack}  ${text_GP} ${text_TotalGodPack}  ${text_GPAvg} ${text_AvgGodPack} packs`
        userOutput += `\n\`\`\``;

        usersStats.push(userOutput);
    };
    
    return usersStats;
}

async function sendUserStats(client){

    console.log("===== Update Users Stats =====")
    
    const guild = await getGuild(client);

    await bulkDeleteMessages(guild.channels.cache.get(channelID_UserStats), 50);

    // CACHE MEMBERS
    const m = await guild.members.fetch()

    var activeUsers = await getActiveUsers(true, true);
    // Exit if 0 activeUsers
    if (activeUsers == "" || activeUsers.length == 0) {return};

    var activeUsersInfos = await getUsersStats(activeUsers, m);

    // Send users data message by message otherwise it gets over the 2k words limit
    const text_ServerStats = localize("Stats Serveur", "Server Stats");
    const text_UserStats = localize("Stats Rerollers Actifs", "Actives Rerollers Stats");

    // Re-update Users (due to somes attribute getting updated right before) 
    activeUsers = await getActiveUsers( true, false);
    const activeInstances = getAttribValueFromUsers(activeUsers, attrib_RealInstances, [0]);
    const instancesAmount = sumIntArray(activeInstances);
    const avginstances = roundToOneDecimal(instancesAmount/activeUsers.length)
    
    const globalPacksPerMin = getAttribValueFromUsers(activeUsers, attrib_PacksPerMin, [0]);
    const accumulatedPacksPerMin = sumFloatArray(globalPacksPerMin);
    const avgPacksPerMin = roundToOneDecimal(accumulatedPacksPerMin/activeUsers.length)

    // const text_activeInstances = `## ${instancesAmount} ${text_avgInstances} ${accumulatedPacksPerMin} packs/mn\n\n`;

    const embedUserStats = new EmbedBuilder()
        .setColor('#f02f7e') // Couleur en hexadécimal
        .setTitle('Summary')
        .addFields(
            { name: `👥 Rerollers :            ‎`, value: `${activeUsers.length}`, inline: true },
            { name: `🔄 Instances :`, value: `${instancesAmount}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: `🔥 PackPerMin :           ‎`, value: `${roundToOneDecimal(accumulatedPacksPerMin)}`, inline: true },
            { name: `🔥 PackPerHour :`, value: `${roundToOneDecimal(accumulatedPacksPerMin*60)}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: '\u200B', value: '\u200B' },
            { name: `📊 Avg Instance/Ppl :     ‎`, value: `${avginstances}`, inline: true },
            { name: `📊 Avg PPM/Ppl :`, value: `${avgPacksPerMin}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
        );

    // Send UserStats
    guild.channels.cache.get(channelID_UserStats).send({content:`## ${text_ServerStats} :\n`})
    guild.channels.cache.get(channelID_UserStats).send({ embeds: [embedUserStats] });
    guild.channels.cache.get(channelID_UserStats).send({content:`## ${text_UserStats} :\n`})
    
    activeUsersInfos.forEach( activeUserInfos =>{
        guild.channels.cache.get(channelID_UserStats).send({content:activeUserInfos});
    });
}

async function sendIDs(client, updateServer = true){
        
    const activePocketIDs = await getActiveIDs();

    const text_contentOf = localize("Contenu de IDs.txt", "Content of IDs.txt");
    const text_activePocketIDs = `*${text_contentOf} :*\n\`\`\`\n${activePocketIDs}\n\`\`\``;
    // Send instances and IDs
    const sentMessage = 
    
    sendChannelMessage(client, channelID_IDs, text_activePocketIDs, delayMsgDeleteState);
    
    if(updateServer){
        updateGist(await getActiveIDs());
    }
}

async function sendStatusHeader(client){
        
    const guild = await getGuild(client);
    const channel_IDs = guild.channels.cache.get(channelID_IDs);

    const embedStatusChange = new EmbedBuilder()
        .setColor('#f02f7e')
        .setTitle('Click to change your status')
        .setDescription('It works similar to /add /remove /farm or /leech');

    const buttonActive = new ButtonBuilder()
        .setCustomId('active')
        .setLabel('Active')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success);

    const buttonFarm = new ButtonBuilder()
        .setCustomId('farm')
        .setLabel('Farm (noMain)')
        .setEmoji('⚡')
        .setStyle(ButtonStyle.Primary)

    const buttonLeech = new ButtonBuilder()
        .setCustomId('leech')
        .setLabel('Leech (onlyMain)')
        .setEmoji('🩸')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!canPeopleLeech);
    
    const buttonInactive = new ButtonBuilder()
        .setCustomId('inactive')
        .setLabel('Inactive')
        .setEmoji('💀')
        .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder().addComponents(buttonActive, buttonInactive);
    const row2 = new ActionRowBuilder().addComponents(buttonFarm, buttonLeech);

    await channel_IDs.send({ embeds: [embedStatusChange], components: [row1, row2] });
}

async function inactivityCheck(client){

    console.log("===== Check inactivity =====")

    const guild = await getGuild(client);
    
    var inactiveCount = 0;
    
    var activeUsers = await getActiveUsers(); // Get current active users
    // Exit if 0 activeUsers
    if (activeUsers == "" || activeUsers.length == 0) {return};

    for ( var i = 0; i < activeUsers.length; i++ ) {
        
        const user = activeUsers[i];

        // Check user active state
        const userActiveState = await refreshUserActiveState(user);
        // Check user instances count
        const userInstances = await refreshUserRealInstances(user, userActiveState[0]);
        // Check user pack per min & sessionTime
        const userPackPerMin = await getAttribValueFromUser(user, attrib_PacksPerMin, 10);
        const sessionTime = await getAttribValueFromUser(user, attrib_SessionTime, 0);
        
        // Check if kickable and prevent him if he have been kicked
        var text_haveBeenKicked = ""
        if( userActiveState == "inactive" ){
            text_haveBeenKicked = localize(`a été kick des rerollers actifs pour inactivité depuis plus de ${inactiveTime}mn`,` have been kicked out of active rerollers for inactivity for more than ${inactiveTime}mn`);
            console.log(`✖️ Kicked ${getUsernameFromUser(user)} - inactivity for more than ${inactiveTime}mn`);
        } 
        else if ( userInstances <= parseInt(inactiveInstanceCount) ){
            text_haveBeenKicked = localize(`a été kick des rerollers actifs pour car il a ${userInstances} instances en cours`,` have been kicked out of active rerollers for inactivity because he had ${userInstances} instances running`);
            console.log(`✖️ Kicked ${getUsernameFromUser(user)} - ${userInstances} instances running`);
        }
        else if ( 
            parseFloat(userPackPerMin) < parseFloat(inactivePackPerMinCount) && 
            parseFloat(userPackPerMin) > 0 && 
            parseFloat(sessionTime) > parseInt(heartbeatRate)+1 ){
            
            text_haveBeenKicked = localize(`a été kick des rerollers actifs pour avoir fait ${userPackPerMin} packs/mn`,` have been kicked out of active rerollers for inactivity because made ${userPackPerMin} packs/mn`);
            console.log(`✖️ Kicked ${getUsernameFromUser(user)} - made ${userPackPerMin} packs/mn`);
        }
        else{
            continue;
        }

        // Then we can kick the user if continue didn't triggered
        await setUserAttribValue( getIDFromUser(user), getUsernameFromUser(user), attrib_UserState, "inactive");
        sendIDs(client);
        guild.channels.cache.get(channelID_IDs).send({ content:`<@${getIDFromUser(user)}> ${text_haveBeenKicked}`});
    };

    if(inactiveCount >= 1){
        updateGist(await getActiveIDs());
    }
}

async function createForumPost(client, message, channelID, packName, titleName, ownerID, accountID, packAmount){

    const guild = await getGuild(client);

    const text_verificationRedirect = localize("Verification ici :","Verification link here :");
    const text_godpackFoundBy = localize(`${packName} trouvé par`,`${packName} found by`);
    const text_commandTooltip = localize(
        "Écrivez **/miss** si un autre est apparu ou que vous ne l'avez pas\n**/verified** ou **/dead** pour changer l'état du post",
        "Write **/miss** if another one appeared or you didn't saw it\n**/verified** or **/dead** to change post state");
    const text_eligible = localize("**Éligibles :**","**Eligible :**");
    
    const member = await getMemberByID(client, ownerID);

    // Skip if member do not exist
    if (member == "") {
        console.log(`❗️ Heartbeat from ID ${userID} is no registered on this server`)
        return;
    }
    var ownerUsername = (member).user.username;
    
    if(packName == "GodPack"){
        const godPackFound = await getUserAttribValue( client, ownerID, attrib_GodPackFound, 0 );
        await setUserAttribValue( ownerID, ownerUsername, attrib_GodPackFound, parseInt(godPackFound) + 1);
    }
        
    var imageUrl = message.attachments.first().url;

    var activeUsersID = getIDFromUsers(await getActiveUsers(false, true));
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
        packAmount = extractNumbers(packAmount);
        packAmount = Math.max(Math.min(packAmount,3),1); // Ensure that it is only 1 to 3
        const text_miss = `## [ 0 miss / ${missBeforeDead[packAmount-1]} ]`
        const text_missLine = `${text_miss}\n\n`;
        
        // Third line
        const text_eligibleLine = `${text_eligible} ${tagActiveUsernames}\n\n`;
        
        // Fourth line
        const text_metadataLine = `Source: ${message.url}\nID:${accountID}\n${imageUrl}\n\n`;

        // Create forum post for verification
        const forum = client.channels.cache.get(channelID);
        const forumPost = forum.threads.create({
        name: `⌛ ${titleName}`,
        message: {
            content: text_foundbyLine + text_missLine + text_eligibleLine + text_metadataLine + text_commandTooltip,
        },
        }).then ( async forum =>{

            // Post forum link in webhook thread
            await thread.send(text_verificationRedirect + ` ${forum}`);
            // Lock thread
            await thread.setLocked(true);

            guild.channels.cache.get(await forum.id).send({content:`${accountID} is the id of the account\n`})
            
            await wait(1);
            await getEligibleIDs(client)
        })
    });
} 

async function markAsDead(client, interaction, optionalText = ""){

    const text_markAsDead = localize("Godpack marqué comme mort et fermé","Godpack marked as dud and closed");
    
    const forumPost = client.channels.cache.get(interaction.channelId);

    forumPost.edit({ name: `${forumPost.name.replace(text_waitingLogo, text_deadLogo)}` });

    await sendReceivedMessage(client, optionalText + text_deadLogo + ` ` + text_markAsDead, interaction);
}

async function getEligibleIDs(client){

    const forum = await client.channels.cache.get(channelID_GPVerificationForum);
    const activeThreads = await forum.threads.fetchActive();

    var idList = ""

    for (let thread of activeThreads.threads) {

        const nestedThread = thread[1];

        if(nestedThread.name.includes(text_waitingLogo) || nestedThread.name.includes(text_verifiedLogo)){
            
            const initialMessage = await getOldestMessage(nestedThread);
            const contentSplit = initialMessage.content.split('\n');
            const gpPocketID = contentSplit.find(line => line.includes('ID:'));
            
            if(gpPocketID != undefined){
                idList += `${gpPocketID.replace("ID:","")}\n`;
            }
        }
    }

    await updateGist(idList, gitGistGPName);
}

async function setUserState(client, user, state, interaction = undefined){
    
    const text_missingFriendCode = localize("Le Player ID est nécéssaire avant quoi que ce soit","The Player ID is needed before anything");
    
    const userID = user.id;
    const userUsername = user.username;
    const userDisplayName = user.displayName;

    if(await doesUserProfileExists(userID, userUsername)){
        if( await getUserAttribValue(client, userID, attrib_PocketID) == undefined){
            return await sendReceivedMessage(client, text_missingFriendCode, interaction, delayMsgDeleteState);
        }
    }
    else{
        return await sendReceivedMessage(client, text_missingFriendCode, interaction, delayMsgDeleteState);
    }
    
    var isPlayerActive = await getUserAttribValue( client, userID, attrib_UserState);

    if(state == "active") {
        const text_alreadyIn = localize("est déjà présent dans la liste des rerollers actifs","is already in the active rerollers pool");
        
        // Skip if player already active
        if(isPlayerActive != "active"){
    
            console.log(`➕ Added ${userUsername}`);
            await setUserAttribValue( userID, userUsername, attrib_UserState, "active");
            await setUserAttribValue( userID, userUsername, attrib_LastActiveTime, new Date().toString());
            await sendReceivedMessage(client, `\`\`\`ansi\n${colorText("+ " + userDisplayName, "green")} as active\n\`\`\``, interaction, 0);
            // Send the list of IDs to an URL and who is Active is the IDs channel
            sendIDs(client);
        }
        else{
            await sendReceivedMessage(client, `**<@${userID}>** ` + text_alreadyIn, interaction, delayMsgDeleteState);
        }
    }
    else if(state == "inactive"){
        
        const text_alreadyOut = localize("est déjà absent de la liste des rerollers actifs","is already out of the active rerollers pool");
    
        if(isPlayerActive != "inactive"){
        
            console.log(`➖ Removed ${userUsername}`);
            await setUserAttribValue( userID, userUsername, attrib_UserState, "inactive");
            await sendReceivedMessage(client, `\`\`\`ansi\n${colorText("- " + userDisplayName, "red")} as inactive\n\`\`\``, interaction, 0);
            // Send the list of IDs to an URL and who is Active is the IDs channel
            sendIDs(client);
        }
        else{
            await sendReceivedMessage(client, `**<@${userID}>** ` + text_alreadyOut, interaction, delayMsgDeleteState);
        }
    }
    else if(state == "farm"){
        
        const text_alreadyOut = localize("est déjà listé comme farmer","is already listed as farmer");
    
        if(isPlayerActive != "farm"){

            console.log(`⚡️ Farm ${userUsername}`);
            await setUserAttribValue( userID, userUsername, attrib_UserState, "farm");
            await sendReceivedMessage(client, `\`\`\`ansi\n${colorText("+ " + userDisplayName, "cyan")} as farmer\n\`\`\``, interaction, 0);
            // Send the list of IDs to an URL and who is Active is the IDs channel
            sendIDs(client);
        }
        else{
            await sendReceivedMessage(client, `**<@${userID}>** ` + text_alreadyOut, interaction, delayMsgDeleteState);
        }
    }
    else if(state == "leech"){
        
        const text_noReqGP = localize("ne peut pas leech car il a moins de","can't leech because he got less than");
        const text_noReqPacks = localize("et moins de","and less than");
        const gpGPCount = getAttribValueFromUser(user, attrib_GodPackFound, 0);
        const gpPackCount = getAttribValueFromUser(user, attrib_TotalPacksOpened, 0);
        
        if(gpGPCount < leechPermGPCount && gpPackCount < leechPermPackCount){
            return await sendReceivedMessage(client, `**<@${userID}>** ${text_noReqGP} ${leechPermGPCount}gp ${text_noReqPacks} ${leechPermPackCount}packs`,interaction ,delayMsgDeleteState);
        }

        const text_alreadyOut = localize("est déjà listé comme leecher","is already listed as leecher");
    
        if(isPlayerActive != "leech"){
        
            console.log(`🩸 Leech ${userUsername}`);
            await setUserAttribValue( userID, userUsername, attrib_UserState, "leech");
            await sendReceivedMessage(client, `\`\`\`ansi\n${colorText("+ " + userDisplayName, "pink")} as leecher\n\`\`\``, interaction, 0);
            // Send the list of IDs to an URL and who is Active is the IDs channel
            sendIDs(client);
        }
        else{
            await sendReceivedMessage(client, `**<@${userID}>** ` + text_alreadyOut, interaction, delayMsgDeleteState);
        }
    }
}

export { 
    getGuild, 
    getMemberByID,
    getUsersStats, 
    sendUserStats, 
    sendIDs,
    sendStatusHeader,
    inactivityCheck,
    createForumPost,
    markAsDead, 
    getEligibleIDs,
    setUserState,
}