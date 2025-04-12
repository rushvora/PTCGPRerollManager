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
    AntiCheat,
    AutoKick,
    refreshInterval,
    inactiveTime,
    inactiveInstanceCount,
    inactivePackPerMinCount,
    inactiveIfMainOffline,
    AutoCloseLivePostTime,
    AutoCloseNotLivePostTime,
    heartbeatRate,
    antiCheatRate,
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
    addDoubleStarToVipIdsTxt,
    forceSkipMin2Stars,
    forceSkipMinPacks,
    text_verifiedLogo,
    text_likedLogo,
    text_waitingLogo,
    text_notLikedLogo,
    text_deadLogo,
    leaderboardBestFarm1_CustomEmojiName,
    leaderboardBestFarm2_CustomEmojiName,
    leaderboardBestFarm3_CustomEmojiName,
    leaderboardBestFarmLength,
    leaderboardBestVerifier1_CustomEmojiName,
    leaderboardBestVerifier2_CustomEmojiName,
    leaderboardBestVerifier3_CustomEmojiName,
    leaderboardWorstVerifier1_CustomEmojiName,
    leaderboardWorstVerifier2_CustomEmojiName,
    leaderboardWorstVerifier3_CustomEmojiName,
    GA_Mewtwo_CustomEmojiName,
    GA_Charizard_CustomEmojiName,
    GA_Pikachu_CustomEmojiName,
    MI_Mew_CustomEmojiName,
    STS_Dialga_CustomEmojiName,
    STS_Palkia_CustomEmojiName,
    TL_Arceus_CustomEmojiName,
    SR_Giratina_CustomEmojiName,
    outputUserDataOnGitGist,
} from '../config.js';

import {
    formatMinutesToDays,
    formatNumbertoK,
    sumIntArray, 
    sumFloatArray, 
    roundToOneDecimal,
    roundToTwoDecimals,
    countDigits, 
    extractNumbers, 
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
} from './utils.js';

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
    getUserSubsystems,
    getUserActiveSubsystems,
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
} from './xmlManager.js';

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
    attrib_TotalAverageInstances,
    attrib_TotalAveragePPM,
    attrib_TotalHBTick,
    attrib_SessionPacksOpened,
    attrib_DiffPacksSinceLastHB,
    attrib_DiffTimeSinceLastHB,
    attrib_PacksPerMin,
    attrib_GodPackFound,
    attrib_GodPackLive,
    attrib_LastActiveTime, 
    attrib_LastHeartbeatTime,
    attrib_TotalTime,
    attrib_TotalTimeFarm,
    attrib_TotalMiss,
    attrib_AntiCheatUserCount,
    attrib_Subsystems,
    attrib_Subsystem,
    attrib_eligibleGPs,
    attrib_eligibleGP,
    attrib_liveGPs,
    attrib_liveGP,
    attrib_ineligibleGPs,
    attrib_ineligibleGP,
    attrib_SelectedPack,
    attrib_RollingType,
    pathUsersData,
    pathServerData,
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
    findEmoji,
} from './missSentences.js';

import {
    updateGist,
} from './uploadUtils.js';

import fs from 'fs';
import xml2js from 'xml2js';

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

async function getUsersStats(users, members, isAntiCheatOn){

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

                const lastHBTime = getAttribValueFromUser(user, attrib_LastHeartbeatTime);
                if( lastHBTime == "" || lastHBTime == undefined ){
                    userOutput += colorText(visibleUsername, "red") + ` - ${colorText("Heartbeat issue","red")}`;
                }
                else{
                    inactiveTime = Math.round(parseFloat(inactiveTime));
                    userOutput += colorText(visibleUsername, "red") + ` - inactive for ${colorText(inactiveTime,"red")}mn`;
                }
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
        var diffTimeSinceLastHb = parseFloat(getAttribValueFromUser(user, attrib_DiffTimeSinceLastHB, heartbeatRate));
        var avgPackMn = roundToOneDecimal(diffPacksSinceLastHb/diffTimeSinceLastHb);
        avgPackMn = isNaN(avgPackMn) || userState == "leech" ? 0 : avgPackMn;
        await setUserAttribValue( id, username, attrib_PacksPerMin, avgPackMn);
        const text_avgPackMn = colorText(avgPackMn, "blue");

        userOutput += `    ${text_Session}${text_avgPackMn} packs/mn  ${text_sessionTime} ${text_sessionPackF}\n`

        // Pack stats
        const totalPack = parseInt(getAttribValueFromUser(user, attrib_TotalPacksOpened));
        var sessionPackI = parseInt(getAttribValueFromUser(user, attrib_SessionPacksOpened)) + total_PacksSubsystems;

        const totalGodPack = parseInt(getAttribValueFromUser(user, attrib_GodPackFound));
        const avgGodPack = roundToOneDecimal(totalGodPack >= 1 ? (totalPack+sessionPackI)/totalGodPack : (totalPack+sessionPackI));
        
        const gpLive = parseInt(getAttribValueFromUser(user, attrib_GodPackLive, 0));

        const text_GPAvg = colorText("GP Avg:", "gray");
        const text_Packs = colorText("Packs:", "gray");
        const text_GP = colorText("GP:", "gray");
        const text_Live = showPerPersonLive ? colorText("Live:", "gray") : "";
        const text_TotalPack = colorText(totalPack + sessionPackI, "blue");
        const text_TotalGodPack = colorText(totalGodPack, "blue");
        const text_GPRatio = totalGodPack >= 1 ? '1/' : '0/';
        const text_AvgGodPack = colorText(`${text_GPRatio}${avgGodPack}`, `blue`);
        const text_GPLive = showPerPersonLive ? colorText(`${gpLive}`, `blue`) : "";

        userOutput += `    ${text_Packs}${text_TotalPack} ${text_GP}${text_TotalGodPack} ${text_Live}${text_GPLive} ${text_GPAvg}${text_AvgGodPack}\n`

        if (isAntiCheatOn && userState == "active"){

            const text_AntiCheatPPM = colorText(`PPM:`, "gray");
            const text_AntiCheatCount = colorText(`Accounts:`, "gray");
            const text_inMin = colorText(`in 30mn`, "gray");
            
            var rollingType = getAttribValueFromUser(user, attrib_RollingType, groupPacksType.toString());
            if (rollingType == ""){rollingType = groupPacksType.toString()}
            const packsAmountPerRun = extractNumbers(rollingType)[0];
            const acUserCount = getAttribValueFromUser(user, attrib_AntiCheatUserCount, 0);
            const acPPM = roundToOneDecimal((parseFloat(acUserCount) * packsAmountPerRun)/30); // UserCount * 5 Pack / Pseudonym over 30 minutes sent every 5 minutes
            const diffPPM = Math.abs(avgPackMn - acPPM); // Negatives values will mean that AntiCheat values are greater that HB ones so it's fine
            
            const text_acPPM = colorText(acPPM, "gray");
            const text_AC_Count = colorText(acUserCount, "gray");
            
            var text_AntiCheat = "";  
            if (sessionTime == 0) {
                text_AntiCheat = colorText(`Anti-Cheat`, "gray");
            } else if (diffPPM < 1) {
                text_AntiCheat = colorText(`Anti-Cheat`, "green");
            } else if (diffPPM < 2) {
                text_AntiCheat = colorText(`Anti-Cheat`, "yellow");
            } else {
                text_AntiCheat = colorText(`Anti-Cheat`, "red");
            }

            if (acUserCount == "0"){
                userOutput += `    ${text_AntiCheat} not set up`
            }
            else{
                userOutput += `    ${text_AntiCheat} ${text_AntiCheatPPM}${text_acPPM} ${text_AntiCheatCount}${text_AC_Count} ${text_inMin}`
            }
        }
        userOutput += `\n\`\`\``;

        usersStats.push(userOutput);
    };
    
    return usersStats;
}

async function sendStats(client){

    console.log("📝 Updating Stats...")
    
    const guild = await getGuild(client);

    await bulkDeleteMessages(guild.channels.cache.get(channelID_UserStats), 50);

    // CACHE MEMBERS
    const m = await guild.members.fetch()

    var activeUsers = await getActiveUsers(true, true);
    const allUsers = await getAllUsers();
    // Exit if 0 activeUsers
    if (activeUsers == "" || activeUsers?.length == 0) {return};

    var isAntiCheatOn = false;
    var antiCheatVerifier = "";

    if (AntiCheat){
        const recentAntiCheatMessages = await getLastsAntiCheatMessages(client);
    
        if (recentAntiCheatMessages.messages.length === Math.floor(30/antiCheatRate)) {
            
            isAntiCheatOn = true;
            const memberAntiCheatVerifier = await getMemberByID(client, recentAntiCheatMessages.prefix);
            
            // Skip if member do not exist
            if (memberAntiCheatVerifier == "") {
                antiCheatVerifier = "Unknown"
                console.log(`❗️ AntiCheat Verifier ID ${userID} is no registered on this server`)
            } else {
                antiCheatVerifier = memberAntiCheatVerifier.displayName;
            }
        }
    }

    var activeUsersInfos = await getUsersStats(activeUsers, m, isAntiCheatOn);

    // Send users data message by message otherwise it gets over the 2k words limit
    const text_ServerStats = localize("Stats Serveur", "Server Stats");
    const text_UserStats = localize("Stats Rerollers Actifs", "Actives Rerollers Stats");

    // ========================= SERVER STATS =========================

    // Re-update Users (due to somes attribute getting updated right before) 
    activeUsers = await getActiveUsers( true, false);
    const activeInstances = getAttribValueFromUsers(activeUsers, attrib_RealInstances, [0]);
    const instancesAmount = sumIntArray(activeInstances);
    const avginstances = roundToOneDecimal(instancesAmount/activeUsers.length);
    
    const globalPacksPerMin = getAttribValueFromUsers(activeUsers, attrib_PacksPerMin, [0]);
    const accumulatedPacksPerMin = sumFloatArray(globalPacksPerMin);
    const avgPacksPerMin = roundToOneDecimal(accumulatedPacksPerMin/activeUsers.length);

    const totalServerPacks = sumIntArray(getAttribValueFromUsers(allUsers, attrib_TotalPacksOpened, [0]));
    const totalServerTime = sumIntArray(getAttribValueFromUsers(allUsers, attrib_TotalTime, [0]));
    
    // Calculate GP stats based on ServerData
    const eligibleGPs = await getServerDataGPs(attrib_eligibleGPs);
    const ineligibleGPs = await getServerDataGPs(attrib_ineligibleGPs);
    const liveGPs = await getServerDataGPs(attrib_liveGPs);

    var eligibleGPCount = 0;
    var ineligibleGPCount = 0;
    var liveGPCount = 0;
    var weekEligibleGPCount = 0;
    var weekLiveGPCount = 0;

    var totalGPCount = 0;
    var potentialLiveGPCount = 0;

    var weekLuck = 0;
    var totalLuck = 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    if (eligibleGPs != undefined) {
        eligibleGPCount = parseInt(eligibleGPs.length);
        
        eligibleGPs.forEach( eligibleGP =>{
            if (getTimeFromGP(eligibleGP) > oneWeekAgo) weekEligibleGPCount++;
        })

        if(ineligibleGPs != undefined){
            ineligibleGPCount = parseInt(ineligibleGPs.length);

            totalGPCount = eligibleGPCount + ineligibleGPCount;

            if(liveGPs != undefined){
                liveGPCount = parseInt(liveGPs.length);
            
                liveGPs.forEach( liveGP =>{
                    if (getTimeFromGP(liveGP) > oneWeekAgo) weekLiveGPCount++;
                })
                
                if(weekLiveGPCount > 0){
                    weekLuck = roundToOneDecimal(weekLiveGPCount / weekEligibleGPCount * 100);
                }
                if(liveGPCount > 0){
                    totalLuck = roundToOneDecimal(liveGPCount / eligibleGPCount * 100);
                }
        
                if( !isNaN(totalLuck) && totalLuck > 0 && totalGPCount > 0){
                    var potentialEligibleGPCount = eligibleGPCount + (ineligibleGPCount * min2Stars * 0.1) // 0.1 = 1 chance out of 10 for an invalid to not be a gold or immersive (for every Min2Stars)
                    potentialLiveGPCount = Math.round(potentialEligibleGPCount * (totalLuck/100));
                }
            }
        }
    }

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
            { name: `📊 Avg Instance/Ppl :     ‎`, value: `${avginstances}`, inline: true },
            { name: `📊 Avg PPM/Ppl :`, value: `${avgPacksPerMin}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: '\u200B', value: '\u200B' },
            { name: `🃏 Total Packs :          ‎`, value: `${formatNumbertoK(totalServerPacks)}`, inline: true },
            { name: `🕓 Total Time :`, value: `${formatMinutesToDays(totalServerTime)}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: `✅ Week Live :            ‎`, value: `${weekLiveGPCount}`, inline: true },
            { name: `🔴 Week Eligibles :       ‎`, value: `${weekEligibleGPCount}`, inline: true },
            { name: `🍀 Week Luck :`, value: `${ weekLuck + " %"}`, inline: true },
            { name: `✅ Total Live :           ‎`, value: `${liveGPCount}`, inline: true },
            { name: `🔴 Total Eligibles :      ‎`, value: `${eligibleGPCount}`, inline: true },
            { name: `🍀 Total Luck :`, value: `${ totalLuck + " %"}`, inline: true },
            { name: `☑️ Potential Live :       ‎`, value: `${potentialLiveGPCount}`, inline: true },
            { name: `📊 Total GP :`, value: `${totalGPCount}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
    );

    guild.channels.cache.get(channelID_UserStats).send({content:`## ${text_ServerStats} :\n`})
    guild.channels.cache.get(channelID_UserStats).send({ embeds: [embedUserStats] });
    await wait(1.5);

    // ========================= SERVER RULES =========================
    var serverState = `\`\`\`ansi\n`;

    if (AntiCheat){
        serverState += `🛡️ Anti-Cheat : ${isAntiCheatOn == true ? colorText("ON","green") + colorText(` Verified by ${antiCheatVerifier}`, "gray") : colorText("OFF","red")}\n`;
    }
    serverState += `💤 Auto Kick : ${AutoKick == true ? colorText("ON","green") : colorText("OFF","red")}\n`;
    serverState += `🩸 Leeching : ${canPeopleLeech == true ? colorText("ON","green") : colorText("OFF","red")}\n`;

    serverState += `\`\`\``;

    guild.channels.cache.get(channelID_UserStats).send({content:serverState});
    await wait(1.5);

    // ========================= SELECTED PACKS =========================

    var selectedPacksText = await getSelectedPacksEmbedText(client, activeUsers);

    const embedSelectedPacks = new EmbedBuilder()
        .setColor('#f02f7e') // Couleur en hexadécimal
        .setTitle('Instances / Selected Packs')
        .setDescription(selectedPacksText);

    guild.channels.cache.get(channelID_UserStats).send({ embeds: [embedSelectedPacks] });
    await wait(1.5);

    // ========================= USER STATS =========================

    guild.channels.cache.get(channelID_UserStats).send({content:`## ${text_UserStats} :\n`})
    for(var i = 0; i<activeUsersInfos.length; i++){
        const activeUsersInfo = activeUsersInfos[i];
        guild.channels.cache.get(channelID_UserStats).send({content:activeUsersInfo});
        await wait(1.5)
    }

    if(allUsers.length > 5) {

        var missCountArray = [];
        var farmInfoArray = [];

        for( var i = 0; i < allUsers.length; i++ ) {
                        
            var user = allUsers[i];
            var userID = getIDFromUser(user);
            var userUsername = getUsernameFromUser(user);
            const member = await getMemberByID(client, userID);

            var displayName = "";
            if (member == "") {
                displayName = userUsername;
            }
            else{
                displayName = member.displayName;
            }

            const totalMiss = getAttribValueFromUser(user, attrib_TotalMiss, 0);
            const totalTime = getAttribValueFromUser(user, attrib_TotalTime, 0);
            const sessionTime = getAttribValueFromUser(user, attrib_SessionTime, 0);
            const totalTimeHour = (parseFloat(totalTime) + parseFloat(sessionTime)) / 60;
            var missPer24Hour = roundToOneDecimal( (parseFloat(totalMiss) / totalTimeHour) * 24 );
            missPer24Hour = isNaN(missPer24Hour) || missPer24Hour == Infinity ? 0 : missPer24Hour;

            missCountArray.push({ user: displayName, value: missPer24Hour })
            
            const totalTimeFarm = getAttribValueFromUser(user, attrib_TotalTimeFarm, 0);
            const totalPacksFarm = getAttribValueFromUser(user, attrib_TotalPacksFarm, 0);
            
            farmInfoArray.push({ user: displayName, packs: totalPacksFarm, time : totalTimeFarm })
        };
        
        if(farmInfoArray.length >= leaderboardBestFarmLength){
            
            // Sort by best
            farmInfoArray.sort((a, b) => b.time - a.time);
            
            var bestFarmersText = `` 

            for( let i = 0 ; i<leaderboardBestFarmLength ; i++){

                var emoji_BestFarm;
                if(i == 0){
                    emoji_BestFarm = findEmoji(client, leaderboardBestFarm1_CustomEmojiName, "🌟");
                }
                else if(i == 1){
                    emoji_BestFarm = findEmoji(client, leaderboardBestFarm2_CustomEmojiName, "⭐️");
                }
                else{
                    emoji_BestFarm = findEmoji(client, leaderboardBestFarm3_CustomEmojiName, "✨");
                }

                bestFarmersText += `${emoji_BestFarm} ${farmInfoArray[i].user} - ${roundToOneDecimal(farmInfoArray[i].time/60)}h with ${farmInfoArray[i].packs} packs\n\n`                
            }

            const embedBestFarmers = new EmbedBuilder()
            .setColor('#39d1bf') // Couleur en hexadécimal
            .setTitle('Best Farmers')
            .setDescription(bestFarmersText);

            guild.channels.cache.get(channelID_UserStats).send({ embeds: [embedBestFarmers] });
        }

        if(missCountArray.length >= 6){
            
            const emoji_BestVerifier1 = findEmoji(client, leaderboardBestVerifier1_CustomEmojiName, "🥇");
            const emoji_BestVerifier2 = findEmoji(client, leaderboardBestVerifier2_CustomEmojiName, "🥈");
            const emoji_BestVerifier3 = findEmoji(client, leaderboardBestVerifier3_CustomEmojiName, "🥉");

            const emoji_WorstVerifier1 = findEmoji(client, leaderboardWorstVerifier1_CustomEmojiName, "😈");
            const emoji_WorstVerifier2 = findEmoji(client, leaderboardWorstVerifier2_CustomEmojiName, "👿");
            const emoji_WorstVerifier3 = findEmoji(client, leaderboardWorstVerifier3_CustomEmojiName, "💀");

            // Sort by best first
            missCountArray.sort((a, b) => b.value - a.value);
            var bestMissCountsText = `
${emoji_BestVerifier1} ${missCountArray[0].user} - ${missCountArray[0].value} miss / 24h\n
${emoji_BestVerifier2} ${missCountArray[1].user} - ${missCountArray[1].value} miss / 24h\n
${emoji_BestVerifier3} ${missCountArray[2].user} - ${missCountArray[2].value} miss / 24h
            ` //no tabs to avoid phone weird spacing

            // Sort by worst then
            missCountArray.sort((a, b) => a.value - b.value);
            var worstMissCountsText = `
${emoji_WorstVerifier1} ${missCountArray[2].user} - ${missCountArray[2].value} miss / 24h\n
${emoji_WorstVerifier2} ${missCountArray[1].user} - ${missCountArray[1].value} miss / 24h\n
${emoji_WorstVerifier3} ${missCountArray[0].user} - ${missCountArray[0].value} miss / 24h
            ` //no tabs to avoid phone weird spacing

            const embedBestMissCountStats = new EmbedBuilder()
            .setColor('#5cd139') // Couleur en hexadécimal
            .setTitle('Best Verifiers')
            .setDescription(bestMissCountsText);

            const embedWorstMissCountStats = new EmbedBuilder()
            .setColor('#d13939') // Couleur en hexadécimal
            .setTitle('Bottom Verifiers')
            .setDescription(worstMissCountsText);

            guild.channels.cache.get(channelID_UserStats).send({ embeds: [embedBestMissCountStats] });
            guild.channels.cache.get(channelID_UserStats).send({ embeds: [embedWorstMissCountStats] });
        }
    }
    
    console.log("☑️📝 Done updating Stats")
}

async function sendIDs(client, updateServer = true){
        
    const activePocketIDs = await getActiveIDs();

    const text_contentOf = localize("Contenu de IDs.txt", "Content of IDs.txt");
    const text_activePocketIDs = `*${text_contentOf} :*\n\`\`\`\n${activePocketIDs}\n\`\`\``;
    // Send instances and IDs    
    sendChannelMessage(client, channelID_Commands, text_activePocketIDs, delayMsgDeleteState);
    
    if(updateServer){
        updateGist(await getActiveIDs());
    }
}

async function sendStatusHeader(client){
        
    const guild = await getGuild(client);
    const channel_IDs = guild.channels.cache.get(channelID_Commands);

    const headerDescription = `
\`\`\`ansi
${colorText("Active", "green")} - ✅Friend Requests${AutoKick ? " ✅Auto Kickable" : ""}
${colorText("Inactive", "red")} - ❌Friend Requests
${colorText("Farm / No Main", "cyan")} - ❌Friend Requests${AutoKick ? " ❌Auto Kickable" : ""}
${colorText("Switch to this for others when verifying / playing on Main / Low Instances amount due to high computer usage", "gray")}
${canPeopleLeech ? `${colorText("Leech / Only Main", "pink")} - ✅Friend Requests${AutoKick ? " ❌Auto Kickable" : ""}` : ``}
\`\`\``

    const embedStatusChange = new EmbedBuilder()
        .setColor('#f02f7e')
        .setTitle(`__**Click to change Status**__ - *Similar to /active /inactive /farm ${canPeopleLeech ? "/leech" : ""}*`)
        .setDescription(headerDescription);

    const buttonActive = new ButtonBuilder()
        .setCustomId('active')
        .setLabel('Active')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success);

    const buttonFarm = new ButtonBuilder()
        .setCustomId('farm')
        .setLabel('Farm')
        .setEmoji('⚡')
        .setStyle(ButtonStyle.Primary)

    const buttonLeech = new ButtonBuilder()
        .setCustomId('leech')
        .setLabel('Leech')
        .setEmoji('🩸')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!canPeopleLeech);
    
    const buttonInactive = new ButtonBuilder()
        .setCustomId('inactive')
        .setLabel('Inactive')
        .setEmoji('💀')
        .setStyle(ButtonStyle.Danger);

    const buttonRefreshStats = new ButtonBuilder()
        .setCustomId('refreshUserStats')
        .setLabel('Refresh Stats')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Primary);

    const row1 = new ActionRowBuilder().addComponents(buttonActive, buttonInactive, buttonFarm, buttonLeech);
    const row2 = new ActionRowBuilder().addComponents(buttonRefreshStats);

    await channel_IDs.send({ embeds: [embedStatusChange], components: [row1, row2] });
}

async function inactivityCheck(client){

    console.log("👀 Checking inactivity...")

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
        
        const lastActiveTime = new Date(await getAttribValueFromUser(user, attrib_LastActiveTime, 0));
        const currentTime = Date.now();
        const diffActiveTime = (currentTime - lastActiveTime) / 60000;
        
        // Check if kickable and prevent him if he have been kicked
        var text_haveBeenKicked = ""
        if( userActiveState == "inactive" ){
            text_haveBeenKicked = localize(`a été kick des rerollers actifs pour inactivité depuis plus de ${inactiveTime}mn`,` have been kicked out of active rerollers for inactivity for more than ${inactiveTime}mn`);
            console.log(`✖️ Kicked ${getUsernameFromUser(user)} - inactivity for more than ${inactiveTime}mn`);
        }
        else if ( 
            parseFloat(diffActiveTime) > parseInt(heartbeatRate)+1 && 
            parseFloat(sessionTime) > parseInt(heartbeatRate)+1) {
            
                if( userInstances <= parseInt(inactiveInstanceCount) ){
                
                    text_haveBeenKicked = localize(`a été kick des rerollers actifs car il a ${userInstances} instances en cours`,` have been kicked out of active rerollers for inactivity because he had ${userInstances} instances running`);
                    console.log(`✖️ Kicked ${getUsernameFromUser(user)} - ${userInstances} instances running`);
                }
                else if ( 
                    parseFloat(userPackPerMin) < parseFloat(inactivePackPerMinCount) && 
                    parseFloat(userPackPerMin) > 0) {
        
                    text_haveBeenKicked = localize(`a été kick des rerollers actifs pour avoir fait ${userPackPerMin} packs/mn`,` have been kicked out of active rerollers for inactivity because made ${userPackPerMin} packs/mn`);
                    console.log(`✖️ Kicked ${getUsernameFromUser(user)} - made ${userPackPerMin} packs/mn`);
                }
                else{
                    continue;
                }
        }
        else{
            continue;
        }

        // Then we can kick the user if continue didn't triggered
        await setUserAttribValue( getIDFromUser(user), getUsernameFromUser(user), attrib_UserState, "inactive");
        guild.channels.cache.get(channelID_Commands).send({ content:`<@${getIDFromUser(user)}> ${text_haveBeenKicked}`});
    };

    if(inactiveCount >= 1){
        sendIDs(client);
    }
}

function extractGPInfo(message) {
    const regexOwnerID = /<@(\d+)>/;
    const regexAccountName = /^(\S+)/m;
    const regexAccountID = /\((\d+)\)/;
    const regexTwoStarRatio = /\[(\d)\/\d\]/;
    const regexPackAmount = /\[(\d+)P\]/;

    const ownerIDMatch = message.match(regexOwnerID);
    const accountNameMatch = message.split('\n')[1].match(regexAccountName);
    const accountIDMatch = message.match(regexAccountID);
    const twoStarRatioMatch = message.match(regexTwoStarRatio);
    const packAmountMatch = message.match(regexPackAmount);

    const ownerID = ownerIDMatch ? ownerIDMatch[1] : "0000000000000000";
    const accountName = accountNameMatch ? accountNameMatch[1] : "NoAccountName";
    const accountID = accountIDMatch ? accountIDMatch[1] : "0000000000000000";
    const twoStarRatio = twoStarRatioMatch ? twoStarRatioMatch[1] : 0;
    const packAmount = packAmountMatch ? packAmountMatch[1] : 0;

    return {
        ownerID,
        accountName,
        accountID,
        twoStarRatio,
        packAmount
    };
}

function extractDoubleStarInfo(message) {
    try {
        const regexOwnerID = /<@(\d+)>/;
        const regexAccountName = /found by (\S+)/;
        const regexAccountID = /\((\d+)\)/;
        const regexPackAmount = /\((\d+) packs/;
    
        const ownerIDMatch = message.match(regexOwnerID);
        const accountNameMatch = message.match(regexAccountName);
        const accountIDMatch = message.match(regexAccountID);
        const packAmountMatch = message.match(regexPackAmount);
    
        const ownerID = ownerIDMatch ? ownerIDMatch[1] : "0000000000000000";
        const accountName = accountNameMatch ? accountNameMatch[1] : "NoAccountName";
        const accountID = accountIDMatch ? accountIDMatch[1] : "0000000000000000";
        const packAmount = packAmountMatch ? packAmountMatch[1] : 0;
    
        console.log(`Extracted info - OwnerID: ${ownerID}, AccountName: ${accountName}, AccountID: ${accountID}, PackAmount: ${packAmount}`);
    
        return {
            ownerID,
            accountName,
            accountID,
            packAmount
        };        
    } catch (error) {
        console.log(`❌ ERROR - Failed to extract double star info for message: ${message}` + error)
    }
}

async function createForumPost(client, message, channelID, packName, titleName, ownerID, accountID, packAmount){

    try{
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
            console.log(`❗️ Heartbeat from ID ${ownerID} is no registered on this server`)
            return;
        }
        var ownerUsername = member.user.username;
        
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
            packAmount = Math.max(Math.min(packAmount,5),1); // Ensure that it is only 1 to 5
            const text_miss = `## [ 0 miss / ${missBeforeDead[packAmount-1]} ]`
            const text_missLine = `${text_miss}\n\n`;
            
            // Third line
            const text_eligibleLine = `${text_eligible} ${tagActiveUsernames}\n\n`;
            
            // Fourth line
            const text_metadataLine = `Source: ${message.url}\nID:${accountID}\n${imageUrl}\n\n`;

            // Create forum post for verification
            const forum = client.channels.cache.get(channelID);
            const forumPost = forum.threads.create({
            name: `${text_waitingLogo} ${titleName}`,
            message: {
                content: text_foundbyLine + text_missLine + text_eligibleLine + text_metadataLine + text_commandTooltip,
            },
            }).then ( async forum =>{

                // Post forum link in webhook thread
                await thread.send(text_verificationRedirect + ` ${forum}`);
                // Lock thread
                await thread.setLocked(true);

                guild.channels.cache.get(await forum.id).send({content:`${accountID} is the id of the account\n-# You can copy paste this message in PocketTCG to look for this account`})

                if(accountID == "0000000000000000"){
                    const text_incorrectID = localize("L'ID du compte est incorrect :\n- Injecter le compte pour retrouver l'ID\n- Reposter le GP dans le webhook avec l'ID entre parenthèse\n- Faites /removegpfound @LaPersonneQuiLaDrop\n- Supprimer ce post","The account ID is incorrect:\n- Inject the account to find the ID\n- Repost the GP in the webhook with the ID in parentheses\n- Do /removegpfound @UserThatDroppedIt\n- Delete this post");
                    guild.channels.cache.get(await forum.id).send({content:`# ⚠️ ${text_incorrectID}`})
                }
                
                await wait(1);
                await updateEligibleIDs(client)
                await addServerGP(attrib_eligibleGP, forum);
            })
        });   
    }
    catch (error) {
        console.log(`❌ ERROR - Failed to create GP Forum Thread GPLive for Account ${accountID} owned by <@${ownerID}>\n` + error)
    }
} 

async function markAsDead(client, interaction, optionalText = ""){

    const text_markAsDead = localize("Godpack marqué comme mort","Godpack marked as dud");
    const text_alreadyDead = localize("Il est déjà mort et enterré... tu veux vraiment en remettre une couche ?","It's already dead and buried...");
    
    const thread = client.channels.cache.get(interaction.channelId);

    if(thread.name.includes(text_deadLogo)){
        await sendReceivedMessage(client, `${text_alreadyDead}`, interaction);
    }
    else{
        const newThreadName = replaceAnyLogoWith(thread.name,text_deadLogo);
    
        await thread.edit({ name: `${newThreadName}` });
    
        await sendReceivedMessage(client, optionalText + text_deadLogo + ` ` + text_markAsDead, interaction);
    
        await updateEligibleIDs(client);
    }
}

async function updateEligibleIDs(client){

    const text_Start = `📜 Updating Eligible IDs...`;
    const text_Done = `☑️📜 Finished updating Eligible IDs`;
    console.log(text_Start)

    const forum = await client.channels.cache.get(channelID_GPVerificationForum);
    const activeThreads = await forum.threads.fetchActive();

    var idList = ""

    for (let thread of activeThreads.threads) {

        const nestedThread = thread[1];

        // Check if post contains any logo other skip
        if(nestedThread.name.includes(text_notLikedLogo) || nestedThread.name.includes(text_waitingLogo) || nestedThread.name.includes(text_likedLogo) || nestedThread.name.includes(text_verifiedLogo)){
            
            const initialMessage = await getOldestMessage(nestedThread);
            const contentSplit = initialMessage.content.split('\n');
            
            var cleanThreadName = replaceAnyLogoWith(nestedThread.name, "");
            var gpPocketName = cleanThreadName.split(" ")[1];
            
            var gpTwoStarCount = "5/5"; // Consider as a 5/5 in case it's not found to avoid filtering it 
            if(!safeEligibleIDsFiltering){ // except if safe filtering is off
                var gpTwoStarCountArray = cleanThreadName.match(/\[(\d+\/\d+)\]/);
                gpTwoStarCount = gpTwoStarCountArray.length > 1 ? gpTwoStarCountArray[1] : 5;
            }
            
            const gpPocketID = contentSplit.find(line => line.includes('ID:'));
            
            if(gpPocketID != undefined){
                
                idList += `${gpPocketID.replace("ID:","")} | ${gpPocketName} | ${gpTwoStarCount}\n`;
            }
        }
    }

    if (addDoubleStarToVipIdsTxt) {
        const doubleStarForum = await client.channels.cache.get(channelID_2StarVerificationForum);
        const doubleStarThreads = await doubleStarForum.threads.fetchActive();
    
        for (let thread of doubleStarThreads.threads) {
            const nestedThread = thread[1];
    
            // Check if post contains any logo other skip
            if (nestedThread.name.includes(text_notLikedLogo) || nestedThread.name.includes(text_waitingLogo) || nestedThread.name.includes(text_likedLogo) || nestedThread.name.includes(text_verifiedLogo)) {
    
                const initialMessage = await getOldestMessage(nestedThread);
                const contentSplit = initialMessage.content.split('\n');
    
                const cleanDoubleStarThreadName = replaceAnyLogoWith(nestedThread.name, "");
                const doubleStarPocketName = cleanDoubleStarThreadName.split(" ")[1];
                const doubleStarCount = "5/5";
    
                if(!safeEligibleIDsFiltering){ // except if safe filtering is off
                    var gpTwoStarCountArray = cleanDoubleStarThreadName.match(/\[(\d+\/\d+)\]/);
                    doubleStarCount = gpTwoStarCountArray.length > 1 ? gpTwoStarCountArray[1] : 2;
                }
    
                const doubleStarPocketID = contentSplit.find(line => line.includes('ID:'));
                
                if(doubleStarPocketID != undefined){
                    idList += `${doubleStarPocketID.replace("ID:","")} | ${doubleStarPocketName} | ${doubleStarCount}\n`;
                }
            }
        }
    }

    console.log(text_Done)

    await updateGist(idList, gitGistGPName);
}

async function updateInactiveGPs(client){

    const text_Start = `🔍 Checking Inactive GPs...`;
    const text_Done = `☑️🔍 Finished checking Inactive GPs`;
    console.log(text_Start)

    const forum = await client.channels.cache.get(channelID_GPVerificationForum);
    const activeThreads = await forum.threads.fetchActive();

    var removedThreadCount = 0;

    for (let [threadId, thread] of activeThreads.threads) {

        // Calculate the age of the thread in hours
        const threadAgeHours = (Date.now() - thread.createdTimestamp) / (1000 * 60 * 60);

        // Check if the thread is older than AutoCloseLivePostTime or AutoCloseNotLivePostTime
        if (
            (threadAgeHours > AutoCloseLivePostTime && thread.name.includes(text_verifiedLogo)) || 
            (threadAgeHours > AutoCloseNotLivePostTime && !thread.name.includes(text_verifiedLogo)) || 
            thread.name.includes(text_deadLogo)
        ) {

            if(!thread.name.includes(text_deadLogo) && !thread.name.includes(text_verifiedLogo)){
                const newThreadName = replaceAnyLogoWith(thread.name,text_deadLogo);
                await thread.edit({ name: `${newThreadName}` });
                await wait(1);
            }
            // Close the thread
            await thread.setArchived(true);
            console.log(`🔒 Closed thread: ${thread.name} (ID: ${threadId})`);

            removedThreadCount ++;
        }
    }

    console.log(text_Done)

    if (removedThreadCount > 0){
        await updateEligibleIDs(client);
    }
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
            return;
        }
        else{
            await sendReceivedMessage(client, `**<@${userID}>** ` + text_alreadyIn, interaction, delayMsgDeleteState);
            return;
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
            return;
        }
        else{
            await sendReceivedMessage(client, `**<@${userID}>** ` + text_alreadyOut, interaction, delayMsgDeleteState);
            return;
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
            return;
        }
        else{
            await sendReceivedMessage(client, `**<@${userID}>** ` + text_alreadyOut, interaction, delayMsgDeleteState);
            return;
        }
    }
    else if(state == "leech"){
        
        if(!canPeopleLeech){
            const text_noLeech = localize("Le leech est désactivé sur ce serveur","Leeching is disabled on this server");
            await sendReceivedMessage(client, `${text_noLeech}`,interaction ,delayMsgDeleteState);
            return;
        }

        const text_noReqGP = localize("ne peut pas leech car il a moins de","can't leech because he got less than");
        const text_noReqPacks = localize("et moins de","and less than");
        const gpGPCount = await getUserAttribValue(client, userID, attrib_GodPackFound, 0);
        const gpPackCount = await getUserAttribValue(client, userID, attrib_TotalPacksOpened, 0);
        
        if(gpGPCount < leechPermGPCount && gpPackCount < leechPermPackCount){
            await sendReceivedMessage(client, `**<@${userID}>** ${text_noReqGP} ${leechPermGPCount}gp ${text_noReqPacks} ${leechPermPackCount}packs`,interaction ,delayMsgDeleteState);
            return;
        }

        const text_alreadyOut = localize("est déjà listé comme leecher","is already listed as leecher");
    
        if(isPlayerActive != "leech"){
        
            console.log(`🩸 Leech ${userUsername}`);
            await setUserAttribValue( userID, userUsername, attrib_UserState, "leech");
            await sendReceivedMessage(client, `\`\`\`ansi\n${colorText("+ " + userDisplayName, "pink")} as leecher\n\`\`\``, interaction, 0);
            // Send the list of IDs to an URL and who is Active is the IDs channel
            sendIDs(client);
            return;
        }
        else{
            await sendReceivedMessage(client, `**<@${userID}>** ` + text_alreadyOut, interaction, delayMsgDeleteState);
            return;
        }
    }
    else{
        await sendReceivedMessage(client, `Failed to update the state of user **<@${userID}>** to ${state}`, interaction, delayMsgDeleteState);
        return;
    }

}

async function updateServerData(client, startup = false){

    const serverDataExist = checkFileExists(pathServerData);

    //Only check if file is <4h at startup, otherwise skip every 4h, otheriwise it'll never reset cause he's being modified by new GP appearing
    if(serverDataExist && startup){

        const { mtime } = fs.statSync(pathServerData)
        const fileModificationDate = mtime;
        const dateLimit = new Date(Date.now() - resetServerDataTime * 60000);

        // If file modified less than X minutes ago, return
        if (fileModificationDate > dateLimit) {
            const text_Skipping = `⏭️ Skipping GP stats reset, already fresh`;
            console.log(text_Skipping);
            return;
        }
    }

    if( !serverDataExist || resetServerDataFrequently ) {
        
        const text_Start = `🔄 Analyze & Reset all GP stats to ServerData.xml...`;
        const text_Done = `☑️🔄 Finished Analyze & Reset all GP stats`;
        console.log(text_Start);

        // Default XML Structure
        const data = {
            root: {
              [attrib_liveGPs]: [{
                [attrib_liveGP]: []
              }],
              [attrib_eligibleGPs]: [{
                [attrib_eligibleGP]: []
              }],
              [attrib_ineligibleGPs]: [{
                [attrib_ineligibleGP]: []
              }]
            }
          };
        
        // Get all forum threads and adds them to eligible & live
        const forum_channel = await client.channels.cache.get(channelID_GPVerificationForum);
        
        const activeThreads = await forum_channel.threads.fetchActive();
        var archivedThreads = [];

        var before = undefined;
        var hasMore = true;

        while (hasMore) {
            const fetched = await forum_channel.threads.fetchArchived({ limit: 100, before });
            archivedThreads = archivedThreads.concat(Array.from(fetched.threads.values()));
            hasMore = fetched.threads.size === 100;
            if (hasMore) {
                before = fetched.threads.last().id;
            }
        }

        const allThreads = [
            ...activeThreads.threads.values(),
            ...archivedThreads
        ];

        var i = 0;

        for (let thread of allThreads) {

            // Check if post name contains no logo, in that case skip post
            if(!thread.name.includes(text_verifiedLogo) && !thread.name.includes(text_notLikedLogo) && !thread.name.includes(text_waitingLogo) && !thread.name.includes(text_likedLogo) && !thread.name.includes(text_deadLogo)) {
                continue;
            }

            data.root[attrib_eligibleGPs][0][attrib_eligibleGP].push({
                $: { 
                    time: new Date(thread.createdTimestamp), 
                    name: thread.name,
                },
                _: thread.id,
            });

            if(thread.name.includes(text_verifiedLogo)){
                data.root[attrib_liveGPs][0][attrib_liveGP].push({
                    $: { 
                        time: new Date(thread.createdTimestamp), 
                        name: thread.name,
                    },
                    _: thread.id,
                });
            }
        }

        // Get all ineligible post in Webhook channel and adds them

        const webhook_channel = await client.channels.cache.get(channelID_Webhook);
          
        let lastMessageID;
        let fetchMore = true;
      
        while (fetchMore) {
          const options = { limit: 100 };
          if (lastMessageID) {
            options.before = lastMessageID;
          }
      
          const messages = await webhook_channel.messages.fetch(options);
      
          if (messages.size === 0) {
            break;
          }
      
          messages.forEach(message => {
            if (message.author.bot && message.content.toLowerCase().includes("invalid")) {
                data.root[attrib_ineligibleGPs][0][attrib_ineligibleGP].push({
                    $: { 
                        time: new Date(message.createdTimestamp), 
                        name: message.content,
                    },
                    _: message.id,
                });
            }
          });
      
          // Update the last message ID to fetch the next batch
          lastMessageID = messages.last().id;
      
          // Stop fetching if fewer than 100 messages are returned
          if (messages.size < 100) {
            fetchMore = false;
          }
        }

        const builder = new xml2js.Builder();
        const xmlOutput = builder.buildObject(data);
        writeFile(pathServerData, xmlOutput)

        console.log(text_Done);

        // Send Users Data on the GitGist
        if(outputUserDataOnGitGist)
        {
            try {
                const data = fs.readFileSync(pathUsersData, 'utf8');
                await updateGist(data, "UsersData");
            } catch (error) {
                console.log(`❌ ERROR trying to read file at ${pathUsersData}`);
            }            
        }

        await updateUserDataGPLive(client);
    }
}

async function updateAntiCheat(client){
    
    try {
        const recentAntiCheatMessages = (await getLastsAntiCheatMessages(client)).messages;

        if (recentAntiCheatMessages.length === Math.floor(30/antiCheatRate)) {
            
            const text_Start = `🛡️ AntiCheat Analyzing...`;
            const text_Done = `☑️🛡️ Finished AntiCheat Analyzing`;
            console.log(text_Start)

            var arrayUsernames = recentAntiCheatMessages.map(msg => msg.content).join(' ').split(",");

            const allUsers = await getActiveUsers();
            for( var i = 0; i < allUsers.length; i++ ) {
                
                var user = allUsers[i];
                var userID = getIDFromUser(user);
                const member = await getMemberByID(client, userID);

                // Skip if member do not exist
                if (member == "") {
                    console.log(`❗️ User ${userID} is no registered on this server`)
                    continue;
                }

                var userUsername = member.user.username;
                var userPrefix = await getUserAttribValue( client, userID, attrib_Prefix, "NoPrefixFound");
                var antiCheat_UserCount = 0;
                var antiCheat_UserNames = [];

                arrayUsernames.forEach(username => {
                    const normalizedUserPrefix = normalizeOCR(userPrefix).toUpperCase();
                    const normalizedUsername = normalizeOCR(username).toUpperCase();

                    if (normalizedUsername.startsWith(normalizedUserPrefix)) {
                        antiCheat_UserCount++;
                        antiCheat_UserNames.push(username);
                    }
                });

                await setUserAttribValue(userID, userUsername, attrib_AntiCheatUserCount, antiCheat_UserCount);
                // Debug Usernames
                // if(antiCheat_UserNames.length > 0){
                //     sendChannelMessage(client, "XXXXXXXXXXXXXXXXXXX", userUsername + "\n" + antiCheat_UserNames.join(', '));
                // }
            };

            console.log(text_Done)
        } 
        else {
            console.log(`🛡️🚫 AntiCheat is OFF`);
        }
    } catch (error) {
        console.log('❌ ERROR - Trying to Analyse for AntiCheat:\n' + error);
    }
}

async function updateUserDataGPLive(client){
    
    const text_Start = `🟢 Updating GPLive UserData...`;
    const text_Done = `☑️🟢  Finished updating GPLive UserData`;
    console.log(text_Start)

    setAllUsersAttribValue(attrib_GodPackLive, 0);

    try{
        var liveGPs = await getServerDataGPs(attrib_liveGPs);
        liveGPs = Array.isArray(liveGPs) ? liveGPs: [liveGPs];

        const liveGPArray = liveGPs.map(liveGP => ({
            time: liveGP.$.time,
            name: liveGP.$.name,
            id: liveGP._
        }));
    
        for (let i = 0; i < liveGPArray.length; i++) {
            const liveGP = liveGPArray[i];
            const verificationChannel = await client.channels.cache.get(channelID_GPVerificationForum);
            const thread = await verificationChannel.threads.fetch(liveGP.id);

            await addUserDataGPLive(client, thread);
        }

        console.log(text_Done)
    }
    catch (error){
        console.log(`❌ ERROR - Failed to update UserData GPLive\n` + error)
    }
}

async function addUserDataGPLive(client, thread){

    const initialMessage = await getOldestMessage(thread);
    var ownerID = splitMulti(initialMessage.content,['<@','>'])[1];
    
    const member = await getMemberByID(client, ownerID);
    if (member == "") {
        console.log(`❗️ Failed to update UserData GPLive of thread ID : ${thread.id}\nFor more infos, check the ID in ServerData.xml`)
        return;
    }
    
    var GPLive = parseInt(await getUserAttribValue( client, ownerID, attrib_GodPackLive, 0 ));
    await setUserAttribValue(ownerID, member.user.username, attrib_GodPackLive,GPLive+1);
}

function incrementSelectedPacks(packCounter, selectedPacks, instanceCount){

    const differentPacksAmount = Math.max(selectedPacks.split(",").length - 1, 0);
    const differentPacksUnit = instanceCount/differentPacksAmount;

    if(selectedPacks.toUpperCase().includes("MEWTWO")){
        packCounter["GA_Mewtwo"] += differentPacksUnit;
    }
    if(selectedPacks.toUpperCase().includes("CHARIZARD")){
        packCounter["GA_Charizard"] += differentPacksUnit;
    }
    if(selectedPacks.toUpperCase().includes("PIKACHU")){
        packCounter["GA_Pikachu"] += differentPacksUnit;
    }
    if(selectedPacks.toUpperCase().includes("MEW")){
        packCounter["MI_Mew"] += differentPacksUnit;
    }
    if(selectedPacks.toUpperCase().includes("DIALGA")){
        packCounter["STS_Dialga"] += differentPacksUnit;
    }
    if(selectedPacks.toUpperCase().includes("PALKIA")){
        packCounter["STS_Palkia"] += differentPacksUnit;
    }
    if(selectedPacks.toUpperCase().includes("ARCEUS")){
        packCounter["TL_Arceus"] += differentPacksUnit;
    }
    if(selectedPacks.toUpperCase().includes("SHINING")){
        packCounter["SR_Giratina"] += differentPacksUnit;
    }
}

async function getSelectedPacksEmbedText(client, activeUsers ){

    var packCounter = {
        GA_Mewtwo: 0,
        GA_Charizard: 0,
        GA_Pikachu: 0,
        MI_Mew: 0,
        STS_Dialga: 0,
        STS_Palkia: 0,
        TL_Arceus: 0,
        SR_Giratina: 0
      };

    for( var i = 0; i < activeUsers.length; i++ ) {
                        
        var user = activeUsers[i];
        var userID = getIDFromUser(user);
        var userUsername = getUsernameFromUser(user);

        const selectedPacks = getAttribValueFromUser(user, attrib_SelectedPack, "");
        const hbInstances = getAttribValueFromUser(user, attrib_HBInstances, 0);
        incrementSelectedPacks(packCounter, selectedPacks, hbInstances)

        const userActiveSubsystems = await getUserActiveSubsystems(user);
        if (userActiveSubsystems != ""){
            for(let i = 0; i<userActiveSubsystems.length; i++){
                const userActiveSubsystem = userActiveSubsystems[i];

                const selectedPacksSubsystems = getAttribValueFromUser(userActiveSubsystem, attrib_SelectedPack, "");
                const hbInstancesSubsystems = getAttribValueFromUser(userActiveSubsystem, attrib_HBInstances, 0);
                incrementSelectedPacks(packCounter, selectedPacksSubsystems, hbInstancesSubsystems)
            }
        }
    };

    for (var key in packCounter) {
        if (packCounter.hasOwnProperty(key)) {
            packCounter[key] = roundToOneDecimal(packCounter[key]);
        }
    }

    const emoji_GA_Mewtwo = findEmoji(client, GA_Mewtwo_CustomEmojiName, "🧠");
    const emoji_GA_Charizard = findEmoji(client, GA_Charizard_CustomEmojiName, "🔥");
    const emoji_GA_Pikachu = findEmoji(client, GA_Pikachu_CustomEmojiName, "⚡️");
    const emoji_MI_Mew = findEmoji(client, MI_Mew_CustomEmojiName, "🏝️");
    const emoji_STS_Dialga = findEmoji(client, STS_Dialga_CustomEmojiName, "🕒");
    const emoji_STS_Palkia = findEmoji(client, STS_Palkia_CustomEmojiName, "🌌");
    const emoji_TL_Arceus = findEmoji(client, TL_Arceus_CustomEmojiName, "💡");
    const emoji_SR_Giratina = findEmoji(client, SR_Giratina_CustomEmojiName, "✨");
    
    const text_mewtwo = `${packCounter["GA_Mewtwo"] > 0 ?       `${emoji_GA_Mewtwo} ${formatNumberWithSpaces(packCounter["GA_Mewtwo"], 4)}` : "" }`
    const text_charizard = `${packCounter["GA_Charizard"] > 0 ? `${emoji_GA_Charizard} ${formatNumberWithSpaces(packCounter["GA_Charizard"], 4)}` : "" }`
    const text_pikachu = `${packCounter["GA_Pikachu"] > 0 ?     `${emoji_GA_Pikachu} ${formatNumberWithSpaces(packCounter["GA_Pikachu"], 4)}` : "" }`
    const text_mew = `${packCounter["MI_Mew"] > 0 ?             `${emoji_MI_Mew} ${packCounter["MI_Mew"]}` : "" }`
    const text_spaceSet1 = `${packCounter["GA_Mewtwo"] > 0 || packCounter["GA_Charizard"] > 0 || packCounter["GA_Pikachu"] > 0 || packCounter["MI_Mew"] > 0 ? `\n# ` : "" }`
    const text_dialga = `${packCounter["STS_Dialga"] > 0 ?      `${emoji_STS_Dialga} ${formatNumberWithSpaces(packCounter["STS_Dialga"], 4)}` : "" }`
    const text_palkia = `${packCounter["STS_Palkia"] > 0 ?      `${emoji_STS_Palkia} ${formatNumberWithSpaces(packCounter["STS_Palkia"], 4)}` : "" }`
    const text_arceus = `${packCounter["TL_Arceus"] > 0 ?       `${emoji_TL_Arceus} ${formatNumberWithSpaces(packCounter["TL_Arceus"], 4)}` : "" }`
    const text_giratina = `${packCounter["SR_Giratina"] > 0 ?     `${emoji_SR_Giratina} ${packCounter["SR_Giratina"]}` : "" }`
    
    return `# ${text_mewtwo+text_charizard+text_pikachu+text_mew}${text_spaceSet1}${text_dialga+text_palkia+text_arceus+text_giratina}`
}

export { 
    getGuild, 
    getMemberByID,
    getUsersStats, 
    sendStats, 
    sendIDs,
    sendStatusHeader,
    inactivityCheck,
    extractGPInfo,
    extractDoubleStarInfo,
    createForumPost,
    markAsDead, 
    updateEligibleIDs,
    updateInactiveGPs,
    setUserState,
    updateServerData,
    updateAntiCheat,
    updateUserDataGPLive,
    addUserDataGPLive,
}