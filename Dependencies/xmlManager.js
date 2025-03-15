import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import AsyncLock from 'async-lock';

const lockUsersData = new AsyncLock();
const lockServerData = new AsyncLock();

const debugConsole = false; 

import {
    attrib_PocketID, 
    attrib_UserState,
    attrib_ActiveState,
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
} from './xmlConfig.js';

import {
    inactiveTime,
} from '../config.js';

function cleanString( inputString ){
    // Remove blank lines
    inputString = inputString.replaceAll(/^\s*\n/gm, "");
    // Remove start & end whitespaces
    inputString = inputString.replaceAll(/^\s+|\s+$/g, "");
    return inputString;
}

// Read file
async function readFileAsync(filepath) {
    try {
        const data = await fs.promises.readFile(filepath, 'utf8');
        return new Promise((resolve, reject) => {
            xml2js.parseString(data, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (err) {
        console.log(`❌ ERROR reading the XML file, ${filepath} does not exist`);
    }
}

// Read if UserData.xml exists, otherwise create it with "content"
function checkFileExists( filepath ) {
    if (fs.existsSync(filepath)) {
        return true;
    }
    return false;
}

// Read if filepath.xml exists, otherwise create it with "content"
async function checkFileExistsOrCreate(filepath, content='', lock = lockServerData) {
    if (!fs.existsSync(filepath)) {
        const dir = path.dirname(filepath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // ==== ASYNC LOCK WRITE ==== //
        await lock.acquire('fileLock', async () => {
            try {
                await fs.promises.writeFile(filepath, content);
            } catch (error) {
                console.log('❌ ERROR trying to write fileAsync with lock');
        }});
        return false;
    }
    return true;
}

// Create filepath.xml with "content"
async function writeFile(filepath, content='', lock = lockServerData) {
        
    const dir = path.dirname(filepath);
        
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // ==== ASYNC LOCK WRITE ==== //
    await lock.acquire('fileLock', async () => {
        try {
            await fs.promises.writeFile(filepath, content);
        } catch (error) {
            console.log('❌ ERROR trying to write fileAsync with lock');
    }});
}


// Create the user profile because none was existing
async function createUserProfile( attribUserId, attribUserName ) {
    try {
        var result = ""; 

        // ==== LOCK ACQUIRE ==== //
        await lockUsersData.acquire('fileLock', async () => {

            // ==== ASYNC READ ==== //
            try {
                result = await readFileAsync(pathUsersData);
            } catch (error) {
                console.log('❌ ERROR trying to read fileAsync with lock');
            }

            // Check root existence
            if (!result.root) {
                result.root = {};
            }

            // Check if Element already exists
            if (!result.root.user) {
                result.root.user = [];
            }

            result.root.user.push({
                $: { username: attribUserName },
                _: attribUserId,
                // attrib_PocketID: "0000000000000000",
                [attrib_UserState]: "inactive",
                [attrib_AverageInstances]: 0,
                [attrib_HBInstances]: 0,
                [attrib_RealInstances]: 0,
                [attrib_SessionTime]: 0,
                [attrib_TotalPacksOpened]: 0,
                [attrib_SessionPacksOpened]: 0,
                [attrib_DiffPacksSinceLastHB]: 0,
                [attrib_PacksPerMin]: 0,
                [attrib_GodPackFound]: 0,
                [attrib_LastActiveTime]: new Date(),
                [attrib_LastHeartbeatTime]: new Date(),
            });

            const builder = new xml2js.Builder();
            const xmlOutput = builder.buildObject(result);

            // ==== ASYNC WRITE ==== //
            try {
                await fs.promises.writeFile(pathUsersData, xmlOutput, 'utf8');
                console.log(`✅ Created user profile "${attribUserName}"`);
            } catch (error) {
                console.log('❌ ERROR trying to write fileAsync with lock');
            }
        });

    } catch (err) {
        console.error('❌ ERROR modifying the XML file:', err);
    }
}

// Check if the profile exists, create it if not
async function doesUserProfileExists( attribUserId, attribUserName ) {

    // Default XML Structure
    const data = {
        root: {}
    };
    const builder = new xml2js.Builder();
    const xmlOutput = builder.buildObject(data);

    await checkFileExistsOrCreate(pathUsersData, xmlOutput, lockUsersData)

    // ==== ASYNC LOCK READ ==== //
    var result = "";
    await lockUsersData.acquire('fileLock', async () => {
        try {
            result = await readFileAsync(pathUsersData);
        } catch (error) {
            console.log('❌ ERROR trying to read fileAsync with lock');
    }});

    if (result.root && result.root.user) {
        if(result.root.user.find(user => cleanString(user._) === attribUserId)) {
            return true;
        } else {
            console.log(`❗️ User "${attribUserName}" does not exist`);
            return false;
        }
    }
    else{
        console.log(`No user at all, creating...`);
        return false;
    }
}



// =============================================== User ===============================================



// Set the attrib value of an user
async function setUserAttribValue( attribUserId, attribUserName, subAttribName, subAttribValue ) {

    if( !await doesUserProfileExists( attribUserId, attribUserName )){
        await createUserProfile(attribUserId, attribUserName);
    }

    try {
        var result = "";

        // ==== LOCK ACQUIRE ==== //
        await lockUsersData.acquire('fileLock', async () => {
            
            // ==== ASYNC READ ==== //
            try {
                result = await readFileAsync(pathUsersData);
            } catch (error) {
                console.log('❌ ERROR trying to read fileAsync with lock');
            }

            const user = result.root.user.find(user => cleanString(user._) === attribUserId);

            if (user) {
                user[subAttribName] = subAttribValue;
                if(debugConsole) {console.log(`Set ${subAttribName} to ${subAttribValue} for User ${attribUserName}`);}
            } else {
                console.log(`❗️ User ${attribUserName} not found.`);
            }

            const builder = new xml2js.Builder();
            let xmlOutput = builder.buildObject(result);
            xmlOutput = cleanString(xmlOutput)

            // ==== ASYNC WRITE ==== //
            try {
                await fs.promises.writeFile(pathUsersData, xmlOutput, 'utf8');
            } catch (error) {
                console.log('❌ ERROR trying to write fileAsync with lock');
            }
        });

    } catch (err) {
        console.error('❌ ERROR modifying the XML file:', err);
    }
}

// Get User attributes from ID and Name
async function getUserAttribValue( client, attribUserId, subAttribName, fallbackValue = undefined ) {

    const attribUsername = (await client.users.fetch(attribUserId)).username;

    if( !await doesUserProfileExists(attribUserId, attribUsername)){
        await createUserProfile(attribUserId, attribUsername);
    }

    try {
        // ==== ASYNC LOCK READ ==== //
        var result = "";
        await lockUsersData.acquire('fileLock', async () => {
            try {
                result = await readFileAsync(pathUsersData);
            } catch (error) {
                console.log('❌ ERROR trying to read fileAsync with lock');
        }});

        if (result.root && result.root.user && result.root.user.length > 0){
            const user = result.root.user.find(user => cleanString(user._) === attribUserId);

            if (user && user[subAttribName][0]) {
                const value = user[subAttribName][0];
                if(debugConsole) {console.log(`Attribute ${subAttribName} found : ${value} for user ${attribUsername}`);}
                return value;
            } else {
                if(debugConsole) {console.log(`Attribute ${subAttribName} not found for the user ${attribUsername}`);}
                return fallbackValue
            }
        }
    } catch {
        // console.log(`❗️ Try to get attribute ${subAttribName} but does not exist`);
        return fallbackValue
    }
}

// Set attrib value of all users
async function setAllUsersAttribValue( subAttribName, subAttribValue ) {

    try {
        var result = "";

        // ==== LOCK ACQUIRE ==== //
        await lockUsersData.acquire('fileLock', async () => {
            
            // ==== ASYNC READ ==== //
            try {
                result = await readFileAsync(pathUsersData);
            } catch (error) {
                console.log('❌ ERROR trying to read fileAsync with lock');
            }

            if (result.root && result.root.user) {
                
                const users = Array.isArray(result.root.user) ? result.root.user : [result.root.user];
            
                users.forEach(user => {
                    
                    if (user[subAttribName]) {
                        user[subAttribName] = subAttribValue;
                    }
                });

                const builder = new xml2js.Builder();
                let xmlOutput = builder.buildObject(result);
                xmlOutput = cleanString(xmlOutput)

                // ==== ASYNC WRITE ==== //
                try {
                    await fs.promises.writeFile(pathUsersData, xmlOutput, 'utf8');
                } catch (error) {
                    console.log('❌ ERROR trying to write fileAsync with lock');
                }
            }
        });

    } catch (err) {
        console.error('❌ ERROR modifying the XML file:', err);
    }
}



// =============================================== Subsystems ===============================================



async function setUserSubsystemAttribValue( attribUserId, attribUserName, subSystemName, subAttribName, subAttribValue ) {

    try {
        var result = "";
        // ==== LOCK ACQUIRE ==== //
        await lockUsersData.acquire('fileLock', async () => {

            // ==== ASYNC READ ==== //
            try {
                result = await readFileAsync(pathUsersData);
            } catch (error) {
                console.log('❌ ERROR trying to read fileAsync with lock');
            }

            const user = result.root.user.find(user => cleanString(user._) === attribUserId);

            if (user) {

                // Create Systems + System if it doesn't exist
                if (!user[attrib_Subsystems]) {
                    user[attrib_Subsystems] = [{ [attrib_Subsystem]: [] }];
                }

                // Create System if it doesn't exist
                var subSystem = user[attrib_Subsystems][0][attrib_Subsystem].find(sub => cleanString(sub._) === subSystemName);
                if (!subSystem) {
                    user[attrib_Subsystems][0][attrib_Subsystem].push({
                        _: subSystemName,
                        [attrib_HBInstances]: 0,
                        [attrib_SessionTime]: 0,
                        [attrib_SessionPacksOpened]: 0,
                        [attrib_DiffPacksSinceLastHB]: 0,
                        [attrib_LastHeartbeatTime]: new Date(),
                    });
                    subSystem = user[attrib_Subsystems][0][attrib_Subsystem].find(sub => cleanString(sub._) === subSystemName);
                }
                
                subSystem[subAttribName] = subAttribValue;

                if(debugConsole) {console.log(`Set ${subAttribName} to ${subAttribValue} for User ${attribUserName} on Subsystem ${subSystemName}`);}
            } else {
                console.log(`❗️ User ${attribUserName} not found.`);
            }

            const builder = new xml2js.Builder();
            let xmlOutput = builder.buildObject(result);
            xmlOutput = cleanString(xmlOutput)

            // ==== ASYNC WRITE ==== //
            try {
                await fs.promises.writeFile(pathUsersData, xmlOutput, 'utf8');
            } catch (error) {
                console.log('❌ ERROR trying to write fileAsync with lock');
            }
        });

    } catch (err) {
        console.error('❌ ERROR modifying the XML file:', err);
    }
}

// Get User attributes from ID and Name
async function getUserSubsystemAttribValue( client, attribUserId, subSystemName, subAttribName, fallbackValue = undefined ) {

    const attribUsername = (await client.users.fetch(attribUserId)).username;

    try {
        // ==== ASYNC LOCK READ ==== //
        var result = "";
        await lockUsersData.acquire('fileLock', async () => {
            try {
                result = await readFileAsync(pathUsersData);
            } catch (error) {
                console.log('❌ ERROR trying to read fileAsync with lock');
        }});

        if (result.root && result.root.user && result.root.user.length > 0){
            const user = result.root.user.find(user => cleanString(user._) === attribUserId);

            if (user[attrib_Subsystems]) {

                const subSystem = user[attrib_Subsystems][0][attrib_Subsystem].find(sub => cleanString(sub._) === subSystemName);

                if(!subSystem){
                    console.log(`❗️ Attribute ${subAttribName} not found for subsystem ${subSystemName} of user ${attribUserId}`);
                    return fallbackValue
                }

                const value = subSystem[subAttribName][0];
                if(debugConsole) {console.log(`Attribute ${subAttribName} found : ${value} for user ${attribUserId}`);}
                return value;

            } else {
                console.log(`❗️ Attribute ${subAttribName} not found for subsystem ${subSystemName} of user ${attribUserId}`);
                return fallbackValue
            }
        }
    } catch (err) {
        console.log(`❗️ Try to get attribute ${subAttribName} but does not exist`);
        return fallbackValue
    }
}



// =============================================== Server Datas ===============================================



async function addServerGP( type, threadOrMessage ){

    
    // ==== LOCK ACQUIRE ==== //
    var result = "";
    await lockServerData.acquire('fileLock', async () => {
        
        // ==== ASYNC READ ==== //
        try {
            result = await readFileAsync(pathServerData);
        } catch (error) {
            console.log('❌ ERROR trying to read fileAsync with lock');
        }

        const newGPElement = {
            $: {
                time: new Date(threadOrMessage.createdTimestamp),
                name: threadOrMessage.name
            },
            _: threadOrMessage.id
        };

        if(type == attrib_eligibleGP){

            if ( result.root[attrib_eligibleGPs][0].length < 1 ){ result.root[attrib_eligibleGPs] = [{ [attrib_eligibleGP]: [] }]; }

            result.root[attrib_eligibleGPs][0][attrib_eligibleGP].push(newGPElement);
        }
        else if(type == attrib_liveGP){

            if ( result.root[attrib_liveGPs][0].length < 1 ){ result.root[attrib_liveGPs] = [{ [attrib_liveGP]: [] }]; }

            result.root[attrib_liveGPs][0][attrib_liveGP].push(newGPElement);
        }
        else if(type == attrib_ineligibleGP){

            if ( result.root[attrib_ineligibleGPs][0].length < 1 ){ result.root[attrib_ineligibleGPs] = [{ [attrib_ineligibleGP]: [] }]; }

            result.root[attrib_ineligibleGPs][0][attrib_ineligibleGP].push(newGPElement);
        }    

        const builder = new xml2js.Builder();
        const updatedXml = builder.buildObject(result);
    
        // ==== ASYNC WRITE ==== //
        try {
            await fs.promises.writeFile(pathServerData, updatedXml, 'utf8');
        } catch (error) {
            console.log('❌ ERROR trying to write fileAsync with lock');
        }
    });
}

async function getServerDataGPs( type ){

    // ==== ASYNC LOCK READ ==== //
    var result = "";
    await lockServerData.acquire('fileLock', async () => {
        try {
            result = await readFileAsync(pathServerData);
        } catch (error) {
            console.log('❌ ERROR trying to read fileAsync with lock');
    }});

    if(type == attrib_eligibleGPs){

        return result.root[attrib_eligibleGPs][0][attrib_eligibleGP];
    }
    if(type == attrib_liveGPs){

        return result.root[attrib_liveGPs][0][attrib_liveGP];
    }
    if(type == attrib_ineligibleGPs){

        return result.root[attrib_ineligibleGPs][0][attrib_ineligibleGP];
    }   
}



// =============================================== Others ===============================================



async function getActiveUsers( includeFarmers = false, includeLeechers = false, fallbackValue = "" ) {

    try{
        // ==== ASYNC LOCK READ ==== //
        var result = "";
        await lockUsersData.acquire('fileLock', async () => {
            try {
                result = await readFileAsync(pathUsersData);
            } catch (error) {
                console.log('❌ ERROR trying to read fileAsync with lock');
        }});

        if (result.root && result.root.user && result.root.user.length > 0){
            var ActiveUsers = result.root.user.filter( user => {

                if(user[attrib_UserState]){

                    const state = user[attrib_UserState][0];
                    return state === 'active' ||
                           (includeFarmers && state === 'farm') ||
                           (includeLeechers && state === 'leech');        
                }
            });
        }
        
        return ActiveUsers;
    }
    catch {
        console.log('❌ ERROR trying to read users database, please add users');
        return fallbackValue;
    }
}

async function getActiveIDs( joined = true ){
    const activeUsers = await getActiveUsers(false, true);
    const gitContent = getAttribValueFromUsers(activeUsers, attrib_PocketID, "");
    
    if(joined) {return gitContent.join('\n');}
    return gitContent;
}

async function getAllUsers() {

    // ==== ASYNC LOCK READ ==== //
    var result = "";
    await lockUsersData.acquire('fileLock', async () => {
    try {
        result = await readFileAsync(pathUsersData);
    } catch (error) {
        console.log('❌ ERROR trying to read fileAsync with lock');
    }});

    try{
        if (result.root && result.root.user && result.root.user.length > 0){
            var ActiveUsers = result.root.user;
        }
        return ActiveUsers;
    }
    catch{
        return [];
    }
}
    
function getUsernameFromUsers( user ){
    return user.map(u => u.$.username);
}

function getUsernameFromUser( user ){
    return user.$.username;
}

function getIDFromUsers( user ){
    return user.map(u => cleanString(u._));
}

function getIDFromUser( user ){
    return cleanString(user._);
}

function getTimeFromGP( gp ){
    return new Date(gp.$.time);
}

function getAttribValueFromUsers( user, attrib, fallbackValue = undefined ){
    try{
        return user.map(u => {
            if(u[attrib]){
                return u[attrib][0];
            }
        });
    } catch (err) {
        return fallbackValue;
    }
}

function getAttribValueFromUser( user, attrib, fallbackValue = undefined ){
    try{
        const value = user[attrib][0];
        return value;
    } catch (err) {
        return fallbackValue;
    }
}

function getAttribValueFromUserSubsystems( user, attrib, fallbackValue = undefined ){
    try{
        if(user[attrib_Subsystems])
        {
            var arrayValue = [];

            user[attrib_Subsystems][0][attrib_Subsystem].forEach(subsystem => {

                if (subsystem[attrib][0]) {
                    arrayValue.push(subsystem[attrib]);
                }
            });

            return arrayValue;
        }
        else{
            return fallbackValue;
        }
    } catch (err) {
        if(debugConsole) {console.log(`❌ ERROR gathering subsystems with attrib ${attrib}`);}
        return fallbackValue;
    }
}

async function refreshUserActiveState( user, fallbackValue = ["waiting",0] ){

    try{
        const currentTime = Date.now();

        // First get subsystems smaller time diff from now
        var smallerDiffHBTimeSubsystems = 10000;
        const lastHBTimeSubsystems = getAttribValueFromUserSubsystems(user, attrib_LastHeartbeatTime, -1);
        
        if(lastHBTimeSubsystems != -1){
            for (let i = 0; i < lastHBTimeSubsystems.length; i++){
    
                const diffHBSubsystem = (currentTime - new Date(lastHBTimeSubsystems[i])) / 60000;
                smallerDiffHBTimeSubsystems = Math.min(smallerDiffHBTimeSubsystems, diffHBSubsystem);
            }
        }
        
        // Then get main machine time diff from now
        const lastActiveTime = new Date(getAttribValueFromUser(user, attrib_LastActiveTime));
        const lastHBTime = new Date(getAttribValueFromUser(user, attrib_LastHeartbeatTime));
        const diffActiveTime = (currentTime - lastActiveTime) / 60000;
        
        var diffHBTime = (currentTime - lastHBTime) / 60000;
        // Keep the lower result
        diffHBTime = Math.min(diffHBTime, smallerDiffHBTimeSubsystems);
        
        var activeState = ""; 
    
        if(diffActiveTime < parseFloat(inactiveTime)) { // If player active less than Xmn ago (might still not have received HB)
            if(diffHBTime < parseFloat(inactiveTime)){ // If last HB less than Xmn
                activeState = "active";
            }
            else{
                activeState = "waiting";
            }
        }
        else{ // If player active more than Xmn ago (HB have should have been received)
            if(diffHBTime < parseFloat(inactiveTime)){ // If last HB less than Xmn
                activeState = "active";
            }
            else{
                activeState = "inactive"
            }
        }
        //Set activity type
        await setUserAttribValue( getIDFromUser(user), getUsernameFromUser(user), attrib_ActiveState, activeState );

        return [activeState, diffHBTime];
    }
    catch{
        console.log(`❌ ERROR Refreshing user ${getUsernameFromUser(user)} ActiveState`)
        return fallbackValue
    }
}

async function refreshUserRealInstances( user, activeState, fallbackValue = 1 ){

    try{
        const currentTime = Date.now();
        const instancesSubsystems = getAttribValueFromUserSubsystems(user, attrib_HBInstances, 0);
        const lastHBTimeSubsystems = getAttribValueFromUserSubsystems(user, attrib_LastHeartbeatTime, 0);
        var totalInstancesSubsystems = 0;

        if(lastHBTimeSubsystems.length > 0) {
            for (let i = 0; i < lastHBTimeSubsystems.length; i++){

                const diffHBSubsystem = (currentTime - new Date(lastHBTimeSubsystems[i])) / 60000;

                if(diffHBSubsystem < parseFloat(inactiveTime)){ // If last HB less than Xmn then count instances and session time
                    totalInstancesSubsystems += parseInt(instancesSubsystems[i]);
                }
            }
        }

        var instances = "0";

        if(activeState == "active"){
            instances = parseInt(getAttribValueFromUser(user, attrib_HBInstances, fallbackValue));
            // Add Subsystems instances
            instances += parseInt(totalInstancesSubsystems);
        }
        else if(activeState == "waiting"){
            instances = parseInt(getAttribValueFromUser(user, attrib_AverageInstances, fallbackValue));
        }

        // Override real instances if leeching
        const userState = getAttribValueFromUser(user, attrib_UserState, "inactive");
        instances = userState == "leech" ? 0 : instances;

        await setUserAttribValue( getIDFromUser(user), getUsernameFromUser(user), attrib_RealInstances, instances );
        return instances
    }
    catch{
        console.log(`❌ ERROR Refreshing user ${getUsernameFromUser(user)} RealInstances`)
        return fallbackValue
    }

}



// =============================================== Backup ===============================================

function cleanupBackupsFolder(fileDir) {
    try {
      // Read the files in the backup directory
      const files = fs.readdirSync(fileDir);
  
      // If the number of files is 20 or fewer, do nothing
      if (files.length <= 20) {
        return;
      }
  
      // Get the stats of each file and sort them by modification date
      const filesWithStats = files.map(file => {
        const filePath = path.join(fileDir, file);
        return {
          name: file,
          time: fs.statSync(filePath).mtime
        };
      });
  
      // Sort files by modification date, oldest first
      filesWithStats.sort((a, b) => a.time - b.time);
  
      // Delete the oldest files until only 20 remain
      for (let i = 0; i < filesWithStats.length - 20; i++) {
        const fileToDelete = path.join(fileDir, filesWithStats[i].name);
        fs.unlinkSync(fileToDelete);
      }
    } catch (error) {
      console.error('❌ ERROR trying to cleanup backup folder\n', error);
    }
}

async function backupFile(filePath) {

    try {
        var data = "";

        // ==== SYNC READ ==== //
        try {
            data = fs.readFileSync(pathUsersData, 'utf8');
        } catch (error) {
            console.log('❌ ERROR trying to read fileAsync');
        }

        const fileName = path.basename(filePath);
        const backupDir = path.join(path.dirname(filePath), 'backup');

        if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
        }

        const dateSuffix = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `${path.parse(fileName).name}-${dateSuffix}${path.extname(fileName)}`;
        const backupFilePath = path.join(backupDir, backupFileName);

        // ==== SYNC WRITE ==== //
        try {
            fs.writeFileSync(backupFilePath, String(data), 'utf8');
            console.log(`💾 Backup "${fileName}" file`);
            cleanupBackupsFolder(backupDir);
        } catch (error) {
            console.error(`❌ ERROR trying to backup file ${filePath}\n`, error);
        }
    } catch (error) {
        console.error(`❌ ERROR trying to backup file ${filePath}\n`, error);
    }    
}

export {
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
}