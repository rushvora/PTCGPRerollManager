import {
    EnglishLanguage,
} from '../config.js';

import {
    channelID_IDs,
    channelID_UserStats,
    channelID_GPVerificationForum,
    channelID_2StarVerificationForum,
    channelID_Webhook,
    channelID_Heartbeat,
} from '../config.js';

import {
    getGuild,
} from './coreUtils.js';

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

function replaceLastOccurrence(str, search, replace) {
    const regex = new RegExp(`(${search})(?!.*\\1)`);
    return str.replace(regex, replace);
}

function replaceMissCount(str, newCount) {
    // Utilisez une expression régulière pour trouver le nombre à l'intérieur des crochets
    const regex = /\[ (\d+) miss \/ (\d+) \]/;
    // Remplacez le nombre à l'intérieur des crochets par le nouveau nombre tout en conservant le deuxième nombre
    return str.replace(regex, (match, p1, p2) => `[ ${newCount} miss / ${p2} ]`);
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

function convertMnToMs(minutes) {
    // 1 minute = 60,000 millisecondes
    const milliseconds = minutes * 60000;
    return milliseconds;
}

function convertMsToMn(milliseconds) {
    // 1 minute = 60,000 millisecondes
    const minutes = milliseconds / 60000;
    return minutes;
}

function splitMulti(str, tokens){
    var tempChar = tokens[0]; // We can use the first token as a temporary join character
    for(var i = 1; i < tokens.length; i++){
        str = str.split(tokens[i]).join(tempChar);
    }
    str = str.split(tempChar);
    return str;
}

async function sendReceivedMessage(client, msgContent, interaction = undefined, timeout = 0, channelID = channelID_IDs) {
    
    var message = "";
    
    if(interaction != undefined) {
        message = await interaction.editReply({ content: msgContent });
        
        if(parseFloat(timeout) > 0){
            setTimeout(() => {
                message.delete().catch(console.error);
            }, parseFloat(timeout)*1000);
        }
    }
    else{
        sendChannelMessage(client, channelID, msgContent, timeout);
    }
}

async function sendChannelMessage(client, channelID, msgContent, timeout = 0) {
    
    const guild = await getGuild(client);

    if(timeout > 0){
        guild.channels.cache.get(channelID).send({ content:`${msgContent}`})
            .then(sentMessage => {
                setTimeout(() => {
                sentMessage.delete().catch(console.error);
                }, timeout * 1000);
            });
    }
    else{
        guild.channels.cache.get(channelID).send({ content:`${msgContent}`});
    }
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

function addTextBar(str, targetLength, color = true) {
    const currentLength = str.length;
    // Calculate the number of spaces needed to reach the target length
    const spacesNeeded = Math.max(targetLength - currentLength - 1,0);
    // Create a string of spaces
    const spaces = ' '.repeat(spacesNeeded);
    // Return the string with the spaces and the bar added
    const bar = color == true ? colorText('|', "gray") : '|';
    return str + spaces + bar;
}

function localize( text_french, text_english ){
    if(EnglishLanguage){
        return text_english;
    }
    else{
        return text_french;
    }
}

function getRandomStringFromArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
        throw new Error("Array should not be empty");
    }
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

async function getOldestMessage( channel ){

    let lastMessageId = null;
    let oldestMessage = null;

    try {
        while (true) {
            const options = { limit: 100 };
            if (lastMessageId) {
                options.before = lastMessageId;
            }

            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) break;

            lastMessageId = messages.last().id;
            oldestMessage = messages.last();

            if (messages.size < 100) break;
        }

        if (oldestMessage) {
            return oldestMessage;
            // console.log(`ID : ${oldestMessage.id}`);
            // console.log(`Content : ${oldestMessage.content}`);
        } else {
            return ""
        }
    } catch (error) {
        console.log('❌ ERROR TRYING TO ACCES OLDER MESSAGE');
    }    
}

function wait(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

export { 
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
}