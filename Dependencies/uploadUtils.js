
import { Octokit } from '@octokit/core';

import {
    gitToken,
    gitGistID,
    gitGistGroupName,
    gitToken2,
    gitGistID2,
} from '../config.js';

// Core Gist Upload

const octokit = new Octokit({
    auth: gitToken
})

const newOctokit = new Octokit({
    auth: gitToken2
})

async function updateGist( gitContent, gitName = gitGistGroupName ){

    if(gitContent == "") {gitContent = "empty"};

    try{
        await octokit.request(`PATCH /gists/${gitGistID}`,{
            gist_id: 'gitGistID',
            description: '',
            files:{
                [gitName]:{
                    content: gitContent
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

    try {
        await newOctokit.request(`PATCH /gists/${gitGistID2}`,{
            gist_id: 'gitGistID',
            description: '',
            files:{
                [gitName]:{
                    content: gitContent
                }
            },
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        console.log(`🌐 Uploading GistGit2... - ${gitName}`)
    } catch (error) {
        console.log(`❌ ERROR trying to upload GistGit2 - ${gitName}`);
    }
}

export{
    updateGist,
}