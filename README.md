# Thobi's Pocket Reroll Manager - Discord Bot

![XlOCujH](https://github.com/user-attachments/assets/12eedef1-4237-4928-b175-288aea66d72f)

This repo is a Discord Bot written in javascript ES6 made to work with [Arturo PTCG Bot](https://github.com/Arturo-1212/PTCGPB) for the [PTCGP French Rerollers](https://discord.gg/pn6XSn42m6) community

# Features

## Automated IDs from Discord commands 
<img align="right" width="415" height="463" src="https://i.imgur.com/BamGht5.png">

Using **/SetPlayerID**, player are able to link their ID with their discord account

Once that's done, they can leave the pull by simply typing **/Add** or **/Remove** and it will **update a GitGist** that all players are linked with

As i'm using GitGist, the refresh time can be up to a maximum of 5 minutes

With **/SetAverageInstances**, players can also specify how many instances they are usually running and **it will show the total amount of instances** that should be running actually based on all active rerollers that wrote /Add and are in the pull 

## Heartbeats implementation

<img align="right" width="375" height="507" src="https://i.imgur.com/goZDtl9.png">

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets

## Better GP management :

Instead of using only the webhook channel which is a nightmare to navigate, the bots generate automatically a thread in a forum channel with : 
- The Name and the Pack amount as title
- A **quote to all rerollers** that **were active** at the time of the GP pull
- The image and a link to the source (the webhook post)

Moreover, peoples of your group can type **/Dead** or **/Verified** to change the icon from ⌛ to 💀 or ✅

![Auto Thread](https://i.imgur.com/iO4WDha.png)

## Usernames generator :

In order to know who's rerolling and who's not, the bot let you generate a list of usernames based on a suffix and keywords

Exemple : _/GenerateUsernames TOBI bae cute halp dang pwease noice UwU my that stoopid_

Will generate things like : "UwUstoopidTOBI", "pweasehalpTOBI", etc...

It helps tracking usernamers easily and brings joy to ppl in your group clearing their friendlist and seeing GP with funny names. With the arrival of the new Heartbeat system, it might become obsolete for presence check but it'll still be a small fun feature anyway

## Others :

The bot sentences are in french but there's a comment in the code for each one with the english traduction

# Install

- First, create your discord application (the bot), there's plenty of youtube videos explaining how to do [such as this one](https://www.youtube.com/watch?v=Oy5HGvrxM4o&t=134s)

Be sure to enable all Privileged Gateway Intents in the app settings

- Be sure to install Node.js 
- Ensure that your Windows Execution Policy is set to RemoteSigned or Unsigned
- Open VisualStudioCode > Terminal and run :
```
npm init -y
npm install discord.js
npm install octokit
npm update
```
- You're almost good to go, to make it start, run
```
node .
```
And press Ctrl+C to stop it. 

You can upload it on a server easily, I personnaly use discloud and it should work great once set up

Now place the repo in your project folder and edit config.json

- *token* is you Discord App token
- *guildID* is your Server ID
- *channelID_IDSync* is the channel ID where all the datas about the actives rerollers will be sent
- *channelID_GPVerificationForum* is the channel ID **(needs to be a forum channel**, check about discord community servers to enable forums) and it's where all the valid packs will be sent for verifications
- *channelID_Webhook* is the channel ID were your group have their webhook linked to

After that [create a new fine-grained token](https://github.com/settings/tokens) for your GitHub account, and make sure to only check to read/write your Gists

Then, [create a GitGist](https://gist.github.com/) and get it's ID (the numbers in the URL). Now you're ready to fill out the last two variables in config.js and **modify the GitGistName variable** with you git name

In Arturo's bot the url should be placed in Friend ID and look like this : "https://gist.githubusercontent.com/{YourUsername}/{YourGitGistID}/raw"

# TODO :

Use the new 2 star filter webhook to create forum post in another or the same forum channel as for gp

Filter out all the potentiel banwords from the user generated list and remove then, at this time it only filters special characters

Any idea of yours ? feel free to ping me on discord @thobi
