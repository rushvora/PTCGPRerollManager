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

function formatNumbertoK(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    } else {
      return num.toString();
    }
}

function formatMinutesToDays(minutes) {
    const days = minutes / (24 * 60); // 1 day = 24 hours * 60 minutes
    return days.toFixed(1) + ' days';
  }

function sumIntArray( arrayNumbers ) {
    return arrayNumbers
      .filter(item => item !== undefined) // Filtrer les valeurs undefined
      .map(Number) // Convertir les chaînes en nombres
      .reduce((acc, curr) => acc + curr, 0); // Additionner les nombres
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
    
    if(interaction != undefined) {
        var message = await interaction.editReply({ content: msgContent });
        
        if(parseFloat(timeout) > 0){
            setTimeout(async () => {
                try {
                    // Fetch the message to check if it still exists
                    const fetchedMessage = await message.fetch();
                    if (fetchedMessage) {
                        await fetchedMessage.delete();
                    } else {
                        console.log('❗️ Tried to delete inexistant message');
                    }
                } catch {
                    console.log('❗️ Tried to delete inexistant message');
                }
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
                setTimeout(async () => {
                    try {
                        // Fetch the message to check if it still exists
                        const fetchedMessage = await sentMessage.fetch();
                        if (fetchedMessage) {
                            await fetchedMessage.delete();
                        } else {
                            console.log('❗️ Tried to delete inexistant message');
                        }
                    } catch {
                        console.log('❗️ Tried to delete inexistant message');
                    }
                }, timeout * 1000);
            });
    }
    else{
        guild.channels.cache.get(channelID).send({ content:`${msgContent}`});
    }
}

async function bulkDeleteMessages(channel, numberOfMessages) {
    try {
        let totalDeleted = 0;

        // Fetch messages in batches of 100
        while (totalDeleted < numberOfMessages) {
            const messages = await channel.messages.fetch({ limit: 100 });
            const messagesToDelete = messages.filter(msg => !msg.pinned);

            if (messagesToDelete.size === 0) {
                break;
            }

            // Check if each message still exists before attempting to delete it
            const messagesToDeleteIds = [];
            for (const msg of messagesToDelete.values()) {
                try {
                    await msg.fetch();
                    messagesToDeleteIds.push(msg.id);
                } catch (fetchError) {
                    if (fetchError.code != 10008) {
                        console.error(`❗️ Can't fetch message with ID ${msg.id} :`, fetchError);
                    }
                    // else the message does not exist anymore
                }
            }

            if (messagesToDeleteIds.length > 0) {
                await channel.bulkDelete(messagesToDeleteIds);
                totalDeleted += messagesToDeleteIds.length;
            } else {
                break;
            }
        }
    } catch (error) {
        console.error('❌ ERROR deleting messages:', error);
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
    formatMinutesToDays,
    formatNumbertoK,
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