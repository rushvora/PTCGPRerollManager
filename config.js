import dotenv from 'dotenv';
dotenv.config();

// Your app Token, if you don't know it you can reset it here : https://discord.com/developers/applications > Your App > Bot > Reset Token
const token = process.env.DISCORD_BOT_TOKEN;
// With discord developper mode on, right click your server and "copy server ID"
const guildID = process.env.GUILD_ID;

// For all channelID below, right click a channel in your discord server and "copy server ID" with developper mode on
// THE ID OF THE DISCORD CHANNEL - Where ID list, AutoKick alerts are sent
const channelID_IDs = process.env.CHANNELID_IDS; // #Rerollers-Annonces
// THE ID OF THE DISCORD CHANNEL - Where statistics of users will be sent
const channelID_UserStats = process.env.CHANNELID_USER_STATS; // #Users-Stats
// THE ID OF THE DISCORD CHANNEL - Where GP validation threads will be created /////!\\\\\ IT HAVE TO BE A FORUM CHANNEL, look for discord community server for more info
const channelID_GPVerificationForum = process.env.CHANNELID_GP_VERIFICATION_FORUM; // #verify-gp
// THE ID OF THE DISCORD CHANNEL - Where Double 2 Star validation threads will be created /////!\\\\\ IT HAVE TO BE A FORUM CHANNEL, look for discord community server for more info
const channelID_2StarVerificationForum = process.env.CHANNELID_2STAR_VERIFICATION_FORUM; // #2starforum 
// THE ID OF THE DISCORD CHANNEL - Where the Packs Webhooks is linked, better be a separate channel from heartbeat webhook
const channelID_Webhook = process.env.CHANNELID_WEBHOOK; // # GP-Webhook
// THE ID OF THE DISCORD CHANNEL - Where the Heartbeat Webhooks is linked, better be a separate channel from packs webhook
const channelID_Heartbeat = process.env.CHANNELID_HEARTBEAT; // # Heartbeat

// Create a new fine-grained token for your GitHub account, and make sure to only check to read/write your Gists : https://github.com/settings/tokens
const gitToken = process.env.GIT_GIST_TOKEN;
// Then, create a GitGist : https://gist.github.com/ and get its ID (the numbers in the URL).
const gitGistID = process.env.GIT_GIST_ID;
// And the GitGist Name based on the name you gave it
const gitGistGroupName = process.env.GIT_GIST_GROUPNAME;
// And the GitGist Name based on the name you gave it
const gitGistGPName = process.env.GIT_GIST_GPNAME;

// =========================================== RULES ===========================================
// If you want your group to be able to add other ppl than themselves using /active @user 
const canPeopleAddOthers = false;
// If you want your group to be able to remove other ppl than themselves using /inactive @user 
const canPeopleRemoveOthers = false;

// =========================================== AUTO KICK ===========================================
// Setting this to true will enable auto kick and kick players based on the others factors below
const AutoKick = process.env.AUTOKICK || true;
// Every X minute divided by 2 it will alternate between sending user stats and checking for inactive peoples
// Exemple with a value of 10 : 5mn:InactivityCheck, 10mn:UserStats, 15mn:InactivityCheck, 20mn:UserStats, etc...
var refreshInterval = 10;
// After how many minutes the user will be consider inactive (keep in mind that heartbeats are sent every 30mn by default)
var inactiveTime = 61;
// At which number of instances users will be kicked, for a value of 1, users with 2 instances and above won't be kicked (Main is not counted as an instance)
var inactiveInstanceCount = 1;
// At which number of instances users will be kicked, for a value of 1, users below 1 pack per min will be kicked)
var inactivePackPerMinCount = 1;
// Kick instantly if it detects that Main is On AND Offline ⚠️ At this time there are false positive where Main could be considered offline but it have no issue in reality
var inactiveIfMainOffline = false;

// =========================================== LEECHING ===========================================
// Decide wether or not ppl can leech
const canPeopleLeech = false;
// Decide after how many GP found ppl can be able to leech
const leechPermGPCount = 20;
// Decide after how many packs opened ppl can be able to leech
const leechPermPackCount = 50000;

// =========================================== GP STATS ===========================================
// Decide if you want your Servers Stats (GP stats) to be reset every 4hours which could prevent some duplicated stuff in ServerData.xml 
const resetServerDataFrequently = true;
// Decide how frequently you want to Reset GP Stats, default to 4 hours (240mn)
const resetServerDataTime = 240;

// =========================================== ELIGIBLES IDs ===========================================
// If some ppl in your group are running Min2Stars : 2 and some others 3, that flags all the GPs as 5/5 in the list to avoid to auto remove bot from kicking 2/5 for those who are at Min2Stars : 3
var safeEligibleIDsFiltering = true; // true = all flagged as 5/5

// =========================================== OTHER TIME SETTINGS ===========================================

// Decide after how much time you want the verification posts to automatically closed, it'll be the time from the post creation, not the last activity
// ⚠️ Closed Posts will be removed from the Eligible GPs / VIP IDs list
const AutoPostCloseTime = 96;//hours

// No need to modify it except you specifically changed the rate in arturo's script
const heartbeatRate = 30;//minutes

// Decide how frequently you want to Backup UserDatas, default to 20mn
const backupUserDatasTime = 30;//minutes

// Delete some messages after X seconds (/active /inactive /refresh /forcerefresh) 0 = no delete
const delayMsgDeleteState = 10;//seconds

// =========================================== OTHER SETTINGS ===========================================
// Choose language
const EnglishLanguage = true;

// Number of /miss needed before a post is marked as dead, here it means 1pack=4miss, 2packs=6miss, 3packs=8miss, etc..
const missBeforeDead = [4,6,8,10,12];

// Do you want to show GP Lives per User in Stats
const showPerPersonLive = true;

// The average Min2Stars of the group on Arturo's bot, used to calculate the Potential Lives GP
var min2Stars = 0;//can be a floating number ex:2.5

// =========================================== AESTHETICS ===========================================
// Icons of GP Validation
const text_verifiedLogo = "✅";
const text_likedLogo = "🔥";
const text_waitingLogo = "⌛";
const text_notLikedLogo = "🥶";
const text_deadLogo = "💀";

const leaderboardBestFarm1_CustomEmojiName = "Chadge"; // 🌟 if not found
const leaderboardBestFarm2_CustomEmojiName = "PeepoLove"; // ⭐️ if not found
const leaderboardBestFarm3_CustomEmojiName = "PeepoShy"; // ✨ if not found
const leaderboardBestFarmLength = 6; // Number of Peoples showing in "Best Farmers"

const leaderboardBestVerifier1_CustomEmojiName = "Wicked"; // 🥇 if not found
const leaderboardBestVerifier2_CustomEmojiName = "PeepoSunglasses"; // 🥈 if not found
const leaderboardBestVerifier3_CustomEmojiName = "PeepoHappy"; // 🥉 if not found

const leaderboardWorstVerifier1_CustomEmojiName = "Bedge"; // 😈 if not found
const leaderboardWorstVerifier2_CustomEmojiName = "PeepoClown"; // 👿 if not found
const leaderboardWorstVerifier3_CustomEmojiName = "DinkDonk"; // 💀 if not found /!\ This one the worst one, it should be at the top but that helps for readability 

export {
    token,
    guildID,
    channelID_IDs,
    channelID_UserStats,
    channelID_GPVerificationForum,
    channelID_2StarVerificationForum,
    channelID_Webhook,
    channelID_Heartbeat,
    gitToken,
    gitGistID,
    gitGistGroupName,
    gitGistGPName,
    missBeforeDead,
    showPerPersonLive,
    EnglishLanguage,
    AutoKick,
    refreshInterval,
    inactiveTime,
    inactiveInstanceCount,
    inactivePackPerMinCount,
    inactiveIfMainOffline,
    AutoPostCloseTime,
    heartbeatRate,
    delayMsgDeleteState,
    backupUserDatasTime,
    min2Stars,
    canPeopleAddOthers,
    canPeopleRemoveOthers,
    canPeopleLeech,
    leechPermGPCount,
    leechPermPackCount,
    resetServerDataFrequently,
    resetServerDataTime,
    safeEligibleIDsFiltering,
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
};