# Thobi's Pocket Reroll Manager - Discord Bot

![XlOCujH](https://github.com/user-attachments/assets/12eedef1-4237-4928-b175-288aea66d72f)

This repo is a Discord Bot written in javascript ES6 made to work with [Arturo PTCG Bot](https://github.com/Arturo-1212/PTCGPB) for the [PTCGP French Rerollers](https://discord.gg/pn6XSn42m6) community

# Features

## Automated IDs from Discord commands 
<img align="right" width="311" height="347" src="https://i.imgur.com/BamGht5.png">

Using **/SetPlayerID**, player are able to link their Pocket ID with their discord account

Once that's done, they can join or leave the list by simply typing **/Active**, **/Inactive**, **/Farm** or **/Leech** and it will **update a GitGist** that all players are linked with _(Note that you can disable leech or ask for specific requirements in config.json)_

The bot will also post a message every hour to change your status quicker
<img align="left" width="450" height="124" src="https://github.com/user-attachments/assets/15c035f3-7e5a-44ab-a2b7-da76635a6041">
<br/> <br/> <br/> <br/> <br/> <br/> <br/>
As i'm using GitGist, the refresh time can be up to a maximum of 5 minutes

With **/SetAverageInstances**, players can also specify how many instances they are usually running but uses heartbeats instances most of the time to get the real number of instances
<br /> 

## Heartbeats implementation

<img align="right" width="373" height="606" src="https://github.com/user-attachments/assets/b1d800ae-8daf-44d8-b397-eae5fb8fecbb">

The bot display two different things, **server stats** and **user stats** for more details, it will auto update in a specific channel every 10 minutes

Server stats can be used to determine the efficiency of your group, it's the top block which is saying how many ppl are rerolling, how many instances, how many GP live etc

And there's also the users stats who detail all stats about each user that are either active, farming or leeching such as :
- Amount of Packs per minute for the session
- Total Amount of Packs
- Total Amount of Godpacks
- The GodPack average luck (which is a fun luck test)

Color means something for the username :
- ${\color{lightgreen}Green}$ : Heartbeat have been received in the last 30mn and the user is rerolling
- ${\color{yellow}Yellow}$ : Heartbeat have not been received in the last 30mn and active for < 30mn
- ${\color{red}Red}$ : Heartbeat have not been received in the last 30mn and active for > 30mn
- ${\color{cyan}Cyan}$ : The user is farming (noMain)
- ${\color{pink}Pink}$ : The user is leeching (onlyMain)

## Better GP management :

Instead of using only the webhook channel which is a nightmare to navigate, the bots generate automatically a thread in a forum channel with : 
- The Name and the Pack amount as title
- A **quote to all rerollers** that **were active** at the time of the GP pull
- The image and a link to the source (the webhook post)

In a forum post, peoples of your group can type **/Dead** or **/Verified** to change instantly the icon from ⌛ to 💀 or ✅

Moreover, you can type **/miss** and after a specific amount of miss based on packs ammount, it will automatically switch it as **/dead**. There's a thread on our discord if you have some ideas of funny sentences that the bot could say (As i also implemented a system that make the bot different things based on the % of miss)

You can also use **/addgpfound** and **/removegpfound** to fix false positive godpacks from arturo's bot

![SmartGP](https://github.com/user-attachments/assets/474ce816-a479-4e86-bd51-8a56b2a69611)
<br /> 

## Eligible GPs aka VIP IDs

This feature have been designed to work with [Hoytdj's Pokemon Trading Card Game Pocket Bot](https://github.com/hoytdj/PTCGPB) or [gmisSe's Automation-mod-for-PTCFPB](https://github.com/gmisSe/Automation-mod-for-PTCFPB) that both use OCR

The goal is to fully automate friend removal based on the GPs that are currently listed as waiting to be verified ⌛ or verified/live ✅

Every account that are marked as dead 💀, forum post closed or not present in the list will be deleted, do know that it won't keep Double 2 Star at this time.

In order for that to work, the bot will output a second GitGist file in your GistGit files where the link will be something like :
```https://gist.githubusercontent.com/{YourUsername}/{YourGitGistID}/raw/EligibleGPs```, You can share this document for your group so everyone can use it

## Auto Kick inactive/low efficient peoples

You'll have plenty of stuff to tweak in config.json include an **AutoKick inactive rerollers** which can automatically exclude peoples from the actives rerollers based on multiple factors :
- if they have less than X instances running
- if their pack/mn is lower than a specific amount
- If they've been detected as inactive for not sending heartbeat within the last X minutes

## Misscount and LastActivity

You can easily know how everyone's performing in term of GP verification and also how long have they been inactive using those two commands

<img align="left" width="361" height="425" src="https://github.com/user-attachments/assets/0e78f765-1c61-434b-9c7c-e20fd6a60849">
<img align="right" width="427" height="425" src="https://github.com/user-attachments/assets/b7c2855b-0c60-45c0-a04b-942377359a1f">
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 
<br /> 

## Usernames generator :

In order to know who's rerolling and who's not, the bot let you generate a list of usernames based on a suffix and keywords

Exemple : _/GenerateUsernames TOBI bae cute halp dang pwease noice UwU my that stoopid_

Will generate things like : "UwUstoopidTOBI", "pweasehalpTOBI", etc...

It helps tracking usernamers easily and brings joy to ppl in your group clearing their friendlist and seeing GP with funny names. With the arrival of the new Heartbeat system, it might become obsolete for presence check but it'll still be a small fun feature anyway
<br /> 

## Other stuff :

- The bot sentences can be switched from **English to French** only by changing a variable from ```true``` to ```false``` in config.json

- If you wish to easily set up the bot for your server, i created a **Discord server template** based on our main server where we run the bot, here it is : https://discord.new/zXx8avYs85wk

# Install

- First, create your discord application, there's plenty of youtube videos explaining how to do [such as this one](https://www.youtube.com/watch?v=Oy5HGvrxM4o&t=134s)

Be sure to enable all Privileged Gateway Intents in the app settings

At this time you can either clone the repo in a folder and run npm commands from here for updating it easier or create your bot and drop  the repo afterward. Be sure to reimport package.json if npm replaced it for you or it won't find the script where to begin with and will treat it as a commonJS file and not ES6 module js.

- Install Node.js 
- Ensure that your Windows Execution Policy is set to RemoteSigned or Unsigned
- Open VisualStudioCode > Terminal and run :
```
npm init -y
npm install discord.js octokit xml2js async-lock
npm update
```
- You're almost good to go, to make it start, run
```
node .
```
And press Ctrl+C to stop it. 

You can upload it on a server easily, I personnaly use discloud and it should work great once set up

Now place the repo in your project folder if you haven't alrdy done it and edit config.json and fill everything with your bot infos and how do you want to run it, comments will explain everything

After that [create a new fine-grained token](https://github.com/settings/tokens) for your GitHub account, and make sure to only check to read/write your Gists

Then, [create a GitGist](https://gist.github.com/) and get it's ID (the numbers in the URL). **It won't work if that's secret gist**. Now you're ready to fill out the GitGist variables in config.js

In Arturo's bot the url should be placed in Friend ID and look like this : ```https://gist.githubusercontent.com/{YourUsername}/{YourGitGistID}/raw/PTCGPRerollGroupIDs```

And for the Eligible GPs aka VIP IDs, it should look like this  : ```https://gist.githubusercontent.com/{YourUsername}/{YourGitGistID}/raw/EligibleGPs```
<br /> 
<br /> 

## Heartbeat Setup :

**For the heartbeat to work**, you need to tell your group to input their **Discord ID in the name field** in Arturo's bot

Heartbeat also supports users farming with multiples PCs, to know how to setup it up, [read the v1.4 patch note](https://github.com/TheThobi/PTCGPRerollManager/releases/tag/v1.4)
<br /> 
<br /> 

# Known Issues :

- If you have the error telling you **"Cannot find module"**, you might have dropped the repo in your project too fast, go to file Package.jon and replace ```index.js,``` with ```index.mjs,``` and add ```type:module,``` right after if you're missing it too.
<br /> 

# TODO :

- Filter out all the potentiel banwords from the user generated list and remove then, at this time it only filters special characters

- Look for a way to let the possibility to create dynamically updating multiple subgroups to better optimize the number of packs per minute

- Any idea of yours ? feel free to [join the discord](https://discord.gg/pn6XSn42m6) and create a new forum post in "Bot-Suggestions" 
<br />

# Commands Spreadsheet :

- **/SetPlayerID** - _Use for automatic IDs_
- **/SetAverageInstances** - _Use if Heartbeats instances not received yet_
- **/Active /Inactive /Farm /Leech** - _Change your status_
- **/Refresh** - _Refresh the UserStats_
- **/ForceRefresh** - _Refresh the IDs & upload instantly (usefull when changing PlayerID, otherwise it's done automatically)_
- **/Verified /Dead** - _Change GP state_
- **/Miss** - _Increase GP miss counter on a GP verification post_
- **/MissCount** - _List of peoples miss per hour_
- **/LastActivity** - _List of how old the last Heartbeat was_
- **/GenerateUsernames** - _To generate cool account names_
- **/AddGPFound /RemoveGPFound** - _To correct false positives GP_


