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

import {
    token,
    guildID,
    channelID_IDSync,
    channelID_GPVerificationForum,
    channelID_Webhook,
    gitToken,
    gitGistID,
} from './config.js';

import {
    Client,
    Events,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    ThreadAutoArchiveDuration,
    Routes,
    PermissionFlagsBits,
} from 'discord.js';

import { Octokit } from '@octokit/core';
import fs from 'fs';
import path from 'path';

// Global Var

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	]
});

const __dirname = import.meta.dirname;

// It wrote _Group1 because we might found usefull to create multiple Groups dynamically using the setAverageInstances that users would input
// This way we could know how many instances there is running at the same time based on the fact that they're active or not and maybe then developp
// a way to split instances when the number of instances exceed a specific number that would make the friend list full too fast.
// That would allow for bigger groups without needing to have only 24/24 ppl
const pathActiveRerollers = __dirname+'/users/ActiveIDs_Group_1.txt';
const pathProfilesUsernameID = __dirname+'/users/ProfilesUsernameID.txt';
const pathProfilesInstances = __dirname+'/users/ProfilesInstances.txt';
const GitGistName = "PTCGP_IDs.txt"

const rest = new REST().setToken(token);
const splitNewLine = /\r?\n|\r|\n/g

const text_verifiedLogo = "✅";
const text_deadLogo = "💀";
const text_waitingLogo = "⌛";

// ID GitGist Management

const octokit = new Octokit({
    auth: gitToken
})

async function updateGist( newContent ){

    await octokit.request(`PATCH /gists/${gitGistID}`,{
        gist_id: 'gitGistID',
        description: '',
        files:{
            GitGistName:{
                content: newContent
            }
        },
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
}

// Functions

function checkFileExistsOrCreate(filePath) {
    if (!fs.existsSync(filePath)) {
        const dir = path.dirname(filePath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, '');
    }
}

function getActiveUsers(){
    checkFileExistsOrCreate(pathActiveRerollers)
    return fs.readFileSync(pathActiveRerollers,
        { encoding: 'utf8' });
}

function getProfilesUsernameID(){
    checkFileExistsOrCreate(pathProfilesUsernameID)
    return fs.readFileSync(pathProfilesUsernameID,
        { encoding: 'utf8' });
}

function getProfilesInstances(){
    checkFileExistsOrCreate(pathProfilesInstances)
    return fs.readFileSync(pathProfilesInstances,
        { encoding: 'utf8' });
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

function checkValueInArray( arrayIn, nameToCheck ){
    var inArray = 0 
    for (var i = 0; i < arrayIn.length; i++)
        {
            var singleName = arrayIn[i];
            if(singleName.includes(nameToCheck))
            {
                inArray = 1;
            }
                
        }
    return inArray;
}

function getUserAttributesCombined( listActiveUsers, attribute )
{
    var outputIDs = "";
    
    var usernamesIDs = attribute;
        
    var arrayUsernameID = usernamesIDs.split(splitNewLine);
    for (var i = 0; i < arrayUsernameID.length; i++)
    {
        var singleUsername = arrayUsernameID[i].split(` `)[0];
        var singleID = arrayUsernameID[i].split(` `)[1];

        if(listActiveUsers.includes(singleUsername))
        {
            outputIDs += `${singleID}\n`;
        }
    }

    return outputIDs;
}

function splitMulti(str, tokens){
    var tempChar = tokens[0]; // We can use the first token as a temporary join character
    for(var i = 1; i < tokens.length; i++){
        str = str.split(tokens[i]).join(tempChar);
    }
    str = str.split(tempChar);
    return str;
}

function cleanString( inputString ){
    // Remove blank lines
    inputString = inputString.replaceAll(/^\s*\n/gm, "");
    // Remove start & end whitespaces
    inputString = inputString.replaceAll(/^\s+|\s+$/g, "");
    return inputString;
}

function sendUpdatedListOfIds( allActiveUsersnames, interaction ){

    // Get active codes list
    var outputContent = getUserAttributesCombined(allActiveUsersnames, getProfilesUsernameID());
    var activeCodeList = `*Contenu de IDs.txt :*\n\`\`\`\n${outputContent}\n\`\`\``; // ENG : Content of ids.txt :

    // Get active username list
    const text_ListofActiveUsers = "# Liste des rerollers actifs :\n-# Du plus ancien au plus récent"; // ENG : ## List of active rerollers :\n-# From oldest to newest
    var activeUsersList = text_ListofActiveUsers + `\n${allActiveUsersnames.replaceAll(splitNewLine,` <- `)}\n`;

    
    // Get instances amount
    var profilesInstances = getUserAttributesCombined(allActiveUsersnames, getProfilesInstances());
    var instancesAmount = 0;

    profilesInstances.split("\n").forEach((instance) => {
        var instanceNumber = parseInt(instance);
        if(Number.isInteger(instanceNumber)){
            instancesAmount = instancesAmount + instanceNumber;
        }
    });
    const activeInstancesList = `## Instances en cours : ${instancesAmount}\n`; // ENG : ## Running instances

    // Output All
    interaction.guild.channels.cache.get(channelID_IDSync).send({ content:`${activeUsersList}${activeInstancesList}${activeCodeList}`});
    updateGist(outputContent);
}

// Events

client.once(Events.ClientReady, async c => {
    console.log(`Logged in as ${c.user.tag}`);

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
                // .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        );

    const removeSCB = new SlashCommandBuilder()
        .setName(`remove`)
        .setDescription(`Vous retire dans le doc d'ID`) // ENG : Withdraw yourself from the active rerollers list
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("ADMIN ONLY : seulement utile pour renseigner quelqu'un d'autre que soit") // ENG : Only usefull so remove someone else than yourself
                .setRequired(false)
                // .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
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

    const generateusernamesCommand = generateusernamesSCB.toJSON();
    client.application.commands.create(generateusernamesCommand, guildID);
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
            const usernamesIDs = getProfilesUsernameID()
                
            if(usernamesIDs.includes(`${interactionUserName}`)){

                var arrayUsernameID = usernamesIDs.split(splitNewLine);

                for (var i = 0; i < arrayUsernameID.length; i++)
                {
                    var singleUsername = arrayUsernameID[i].split(` `)[0];
                    var singleID = arrayUsernameID[i].split(" ")[1];

                    if(interactionUserName == singleUsername)
                    {
                        var fileContent = usernamesIDs.replace(singleID, `${id}`)
                        fs.writeFileSync(pathProfilesUsernameID, fileContent);
                        interaction.reply(`Code **${singleID}** ` + text_replace + ` **${id}** ` + text_for + ` **<@${interactionUserID}>**`);
                    }
                }
            }
            else{
                var fileContent = usernamesIDs + "\n" + `${interactionUserName} ${id}`
                fileContent = cleanString(fileContent);
                fs.writeFileSync(pathProfilesUsernameID, fileContent);
                interaction.reply(`Code **${id}** ` + text_set + ` **<@${interactionUserID}>**`);
            }
        }
    }

    // ADD COMMAND
    if(interaction.commandName === `add`){

        const text_addID = "Ajout de l'ID de"; // ENG : Add the ID of user
        const text_toRerollers = "aux rerollers actifs"; // ENG : to the active rerollers pool
        const text_alreadyIn = "est déjà présent dans la liste des rerollers actifs"; // ENG : is already in the active rerollers pool

        const user = interaction.options.getUser(`user`);
        if( user != null){
            interactionUserName = user.username;
            interactionUserID = user.id;
        }

        // Reading the current players file
        var allActiveUsersnames = getActiveUsers()
        
        var arrayActiveUsernames = allActiveUsersnames.split(splitNewLine);
        var isPlayerActive = 0;

        // Check if player is active
        isPlayerActive = checkValueInArray(arrayActiveUsernames, interactionUserName)
        
        // Skip if player already active
        if(isPlayerActive == 0){

            // Add user to active list
            allActiveUsersnames += `\n${interactionUserName}`;
            allActiveUsersnames = cleanString(allActiveUsersnames);

            fs.writeFileSync(pathActiveRerollers, allActiveUsersnames);
            
            interaction.reply(text_addID + ` **<@${interactionUserID}>** ` + text_toRerollers);

            // Send the list of IDs to an URL and who is Active is the Channel Sync
            sendUpdatedListOfIds(allActiveUsersnames, interaction);
        }
        else{
            interaction.reply(`**<@${interactionUserID}>** ` + text_alreadyIn);
        }
    }

    // REMOVE COMMAND
    if(interaction.commandName === `remove`){
        
        const text_removeID = "Retrait de l'ID de"; // ENG : Add the ID of user
        const text_toRerollers = "des rerollers actifs"; // ENG : to the active rerollers pool
        const text_alreadyOut = "est déjà absent de la liste des rerollers actifs"; // ENG : is already out of the active rerollers pool

        const user = interaction.options.getUser(`user`);
        if( user != null){
            interactionUserName = user.username;
            interactionUserID = user.id;
        }
            
        // Reading the active players file
        var allActiveUsersnames = getActiveUsers()
        
        var arrayActiveUsernames = allActiveUsersnames.split(splitNewLine);
        var isPlayerActive = 0;

        // Check if player is active
        isPlayerActive = checkValueInArray(arrayActiveUsernames, interactionUserName);

        // Skip if player not active
        if(isPlayerActive == 1){

            // Remove user from active list
            allActiveUsersnames = allActiveUsersnames.replaceAll(interactionUserName,"");
            allActiveUsersnames = cleanString(allActiveUsersnames);

            fs.writeFileSync(pathActiveRerollers, allActiveUsersnames);

            interaction.reply(text_removeID + ` **<@${interactionUserID}>** ` + text_toRerollers);

            // Send the list of IDs to an URL and who is Active is the Channel Sync
            sendUpdatedListOfIds(allActiveUsersnames, interaction);
        }
        else{
            interaction.reply(`**<@${interactionUserID}>** ` + text_alreadyOut);
        }
    }

    // REFRESH COMMAND
    if(interaction.commandName === `refresh`){
        
        const text_listRefreshed = "Liste rafraichie"; // ENG : List refreshed

        // Reading the current players file
        allActiveUsersnames = getActiveUsers()
        interaction.reply(text_listRefreshed);
        sendUpdatedListOfIds(allActiveUsersnames, interaction);
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

    // GENERATE USERNAMES COMMAND
    if(interaction.commandName === `generateusernames`){
        const suffix = interaction.options.getString(`suffix`);
        const keyWords = interaction.options.getString(`keywords`).replaceAll(`,`,` `).split(' ');

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
            var profilesInstances = getProfilesInstances()

            if(profilesInstances.includes(`${interactionUserName}`)){

                var arrayUsernameID = profilesInstances.split(splitNewLine);

                for (var i = 0; i < arrayUsernameID.length; i++)
                {
                    var singleUsername = arrayUsernameID[i].split(` `)[0];
                    var singleAmount = arrayUsernameID[i].split(" ")[1];

                    if(interactionUserName == singleUsername)
                    {
                        fileContent = profilesInstances.replace(singleAmount, `${amount}`)
                        fileContent = cleanString(fileContent);
                        fs.writeFileSync(pathProfilesInstances, fileContent);
                        interaction.reply(text_instancesSetTo + ` **${amount}** ` + text_for + ` **<@${interactionUserID}>**`);
                    }
                }
            }
            else{
                fileContent = profilesInstances + "\n" + `${interactionUserName} ${amount}`
                fileContent = cleanString(fileContent);
                fs.writeFileSync(pathProfilesInstances, fileContent);
                interaction.reply(text_instancesSetTo + ` **${amount}** ` + text_for + ` **<@${interactionUserID}>**`);
            }
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
            var accountName = arrayGodpackMessage[3];
            var packAmount = arrayGodpackMessage[7];
            
            var imageUrl = message.attachments.first().url;
        
            var allActiveUsersnames = getActiveUsers();
            var arrayActiveUsernames = allActiveUsersnames.split(splitNewLine);
            var tagActiveUsernames = "";

            // CACHE MEMBERS
            const m = await guild.members.fetch()
            let members = m.map(u => u.user.id)

            arrayActiveUsernames.forEach((username) =>{

                    var id = "";
                    m.forEach((member) =>{

                        if(member.user.username == username){
                            id = member.user.id;
                        }
                    });

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
});

client.login(token);