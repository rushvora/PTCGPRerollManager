
import { Octokit } from '@octokit/core';

import {
    gitToken,
    gitGistID,
    gitGistGroupName,
} from '../config.js';

// Core Gist Upload

const octokit = new Octokit({
    auth: gitToken
})

async function updateGist( gitContent, gitName = gitGistGroupName ){
    
    console.log(`================ Update GistGit - ${gitName} ================`)

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
}

export{
    updateGist,
}