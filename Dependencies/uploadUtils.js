
import { Octokit } from '@octokit/core';
import fs from 'fs';
import path from 'path';

import {
    gitToken,
    gitGistID,
    gitGistGroupName,
    gitGistGPName,
    idListFetchURL,
} from '../config.js';

// Core Gist Upload

const octokit = new Octokit({
    auth: gitToken
})

// Cache file path
const CACHE_FILE_PATH = path.join(process.cwd(), '.id_list_cache.json');

// Function to read cached data
function readCachedData() {
    try {
        if (fs.existsSync(CACHE_FILE_PATH)) {
            const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
            return cacheData;
        }
    } catch (error) {
        console.log(`⚠️ Warning: Failed to read cache file: ${error.message}`);
    }
    return null;
}

// Function to write data to cache
function writeCacheData(data) {
    try {
        const cacheData = {
            data: data,
            timestamp: Date.now(),
            url: idListFetchURL
        };
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2));
        console.log(`💾 ID list data cached successfully`);
    } catch (error) {
        console.log(`⚠️ Warning: Failed to write cache file: ${error.message}`);
    }
}

// Function to delay execution (for retry mechanism)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to fetch ID list from URL
async function fetchIDListFromURL() {
    if (!idListFetchURL) {
        return '';
    }
    
    const MAX_RETRIES = 5;
    const BASE_DELAY = 1000; // 1 second base delay
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`🌐 Attempting to fetch ID list from URL (attempt ${attempt}/${MAX_RETRIES})`);
            
            const response = await fetch(idListFetchURL);
            if (!response.ok) {
                console.log(`❌ Failed to fetch ID list from URL: ${response.status} ${response.statusText}`);
                
                // If this is the last attempt, try cached data
                if (attempt === MAX_RETRIES) {
                    console.log(`⚠️ All ${MAX_RETRIES} attempts failed, trying cached data...`);
                    const cachedData = readCachedData();
                    if (cachedData && cachedData.data) {
                        console.log(`📋 Using cached ID list data from ${new Date(cachedData.timestamp).toLocaleString()}`);
                        return cachedData.data.trim();
                    }
                    return '';
                }
                
                // Wait with exponential backoff before retrying
                const delayMs = BASE_DELAY * Math.pow(2, attempt - 1);
                console.log(`⏳ Retrying in ${delayMs}ms...`);
                await delay(delayMs);
                continue;
            }
            
            const data = await response.text();
            console.log(`🌐 Successfully fetched ID list from URL on attempt ${attempt}`);
            
            // Cache the successful fetch
            writeCacheData(data);
            
            return data.trim();
            
        } catch (error) {
            console.log(`❌ ERROR fetching ID list from URL (attempt ${attempt}): ${error.message}`);
            
            // If this is the last attempt, try cached data
            if (attempt === MAX_RETRIES) {
                console.log(`⚠️ All ${MAX_RETRIES} attempts failed, trying cached data...`);
                const cachedData = readCachedData();
                if (cachedData && cachedData.data) {
                    console.log(`📋 Using cached ID list data from ${new Date(cachedData.timestamp).toLocaleString()}`);
                    return cachedData.data.trim();
                }
                return '';
            }
            
            // Wait with exponential backoff before retrying
            const delayMs = BASE_DELAY * Math.pow(2, attempt - 1);
            console.log(`⏳ Retrying in ${delayMs}ms...`);
            await delay(delayMs);
        }
    }
    
    return '';
}

// Function to extract ID from formatted line (e.g., "8051811037307115 | sb4148 | 2/5" -> "8051811037307115")
function extractIDFromLine(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine) return '';
    
    // Check if line contains the pipe separator format
    const pipeIndex = trimmedLine.indexOf(' | ');
    if (pipeIndex !== -1) {
        return trimmedLine.substring(0, pipeIndex).trim();
    }
    
    // If no pipe separator, treat the whole line as ID (backward compatibility)
    return trimmedLine;
}

// Function to merge ID lists (removes duplicates based on ID portion and maintains formatting)
function mergeIDLists(gitContent, urlContent) {
    if (!urlContent || urlContent === '') {
        return gitContent;
    }
    
    if (!gitContent || gitContent === '' || gitContent === 'empty') {
        return urlContent;
    }
    
    // Split both contents into lines and filter out empty lines
    const gitLines = gitContent.split('\n').filter(line => line.trim() !== '');
    const urlLines = urlContent.split('\n').filter(line => line.trim() !== '');
    
    // Create a Set to track unique IDs (case-insensitive, based on ID portion only)
    const uniqueIDs = new Set();
    const mergedLines = [];
    
    // Add git content first
    gitLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
            const id = extractIDFromLine(trimmedLine);
            if (id && !uniqueIDs.has(id.toLowerCase())) {
                uniqueIDs.add(id.toLowerCase());
                mergedLines.push(trimmedLine);
            }
        }
    });
    
    // Add URL content (avoiding duplicates based on ID)
    urlLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
            const id = extractIDFromLine(trimmedLine);
            if (id && !uniqueIDs.has(id.toLowerCase())) {
                uniqueIDs.add(id.toLowerCase());
                mergedLines.push(trimmedLine);
            }
        }
    });
    
    return mergedLines.join('\n');
}

async function updateGist( gitContent, gitName = gitGistGroupName ){

    if(gitContent == "") {gitContent = "empty"};
    
    let finalGitContent;
    if (gitName === gitGistGPName) {
        // Fetch additional ID list data from URL and merge with gitContent
        const urlContent = await fetchIDListFromURL();
        finalGitContent = mergeIDLists(gitContent, urlContent);
    } else {
        // For other Gists, use the provided gitContent directly
        finalGitContent = gitContent;
    }

    try{
        await octokit.request(`PATCH /gists/${gitGistID}`,{
            gist_id: 'gitGistID',
            description: '',
            files:{
                [gitName]:{
                    content: finalGitContent
                }
            },
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        console.log(`🌐 Uploading GistGit... - ${gitName}`)
    }
    catch{
        console.log(`❌ ERROR trying to upload GistGit - ${gitName}`);
    }
}

export{
    updateGist,
}