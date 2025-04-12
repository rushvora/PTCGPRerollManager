import dotenv from 'dotenv';
dotenv.config();

// Your app Token, if you don't know it you can reset it here : https://discord.com/developers/applications > Your App > Bot > Reset Token
const token = process.env.DISCORD_BOT_TOKEN;
// With discord developper mode on, right click your server and "copy server ID"
const guildID = process.env.GUILD_ID;

// For all channelID below, right click a channel in your discord server and "copy server ID" with developper mode on
// THE ID OF THE DISCORD CHANNEL - Where ID list, AutoKick alerts are sent
const channelID_Commands = process.env.CHANNELID_IDS; // #Rerollers-Annonces
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
// THE ID OF THE DISCORD CHANNEL - Where the AntiCheat pseudonyms are sent in order to analyse
const channelID_AntiCheat = process.env.CHANNELID_ANTICHEAT; // # AntiCheat

// Create a new fine-grained token for your GitHub account, and make sure to only check to read/write your Gists : https://github.com/settings/tokens
const gitToken = process.env.GIT_GIST_TOKEN;
// Then, create a GitGist : https://gist.github.com/ and get its ID (the numbers in the URL).
const gitGistID = process.env.GIT_GIST_ID;
// And the GitGist Name based on the name you gave it
const gitGistGroupName = process.env.GIT_GIST_GROUPNAME;
// And the GitGist Name based on the name you gave it
const gitGistGPName = process.env.GIT_GIST_GPNAME;

// =========================================== RULES ===========================================
// Choose if you want the AntiCheat to be enabled or not, if yes then fill "channelID_AntiCheat" above
const AntiCheat = process.env.ENABLE_ANTICHEAT === 'true' ? true : false;
// If you want your group to be able to add other ppl than themselves using /active @user 
const canPeopleAddOthers = true;
// If you want your group to be able to remove other ppl than themselves using /inactive @user 
const canPeopleRemoveOthers = true;

// =========================================== AUTO KICK ===========================================
// Setting this to true will enable auto kick and kick players based on the others factors below
const AutoKick = process.env.AUTOKICK === 'true' ? true : false;
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
// Upload UserData.xml to GitGist, resetServerDataFrequently also needs to be true
const outputUserDataOnGitGist = true;

// =========================================== ELIGIBLES IDs ===========================================
// If some ppl in your group are running Min2Stars : 2 and some others 3, that flags all the GPs as 5/5 in the list to avoid to auto remove bot from kicking 2/5 for those who are at Min2Stars : 3
const safeEligibleIDsFiltering = true; // true = all flagged as 5/5
const addDoubleStarToVipIdsTxt = false; // true = add double star pack account usernames to vip ids txt for GP Test Mode

// =========================================== FORCE SKIP ===========================================
// Allows you to bypass GP based on Packs Amount, Exemple : forceSkipMin2Stars 2 & forceSkipMinPacks 2 will 
// - not send in verif forum all GP [3P][2/5] [4P][2/5] [5P][2/5] and below 
// - send in verif forum all GP [1P][2/5] [2P][2/5] and abobe
const forceSkipMin2Stars = parseInt(process.env.FORCE_SKIP_MIN_2STARS, 10);
const forceSkipMinPacks = parseInt(process.env.FORCE_SKIP_MIN_PACKS, 10);

// =========================================== OTHER TIME SETTINGS ===========================================

// Decide after how much time you want the verification posts to automatically closed, it'll be the time from the post creation, not the last activity
// Age of post be before closing the post ⚠️ Closed Posts will be removed from the Eligible GPs / VIP IDs list
const AutoCloseLivePostTime = 96;//hours
const AutoCloseNotLivePostTime = 72;//hours
// No need to modify it except if you specifically changed it in the script
const heartbeatRate = 30;//minutes
// No need to modify it except if you specifically changed it in the script
const antiCheatRate = 3;//minutes
// Decide how frequently you want to Backup UserDatas, default to 30mn
const backupUserDatasTime = 30;//minutes
// Delete some messages after X seconds (/active /inactive /refresh /forcerefresh) 0 = no delete
const delayMsgDeleteState = 10;//seconds

// =========================================== DISPLAY SETTINGS ===========================================
// Choose language
const EnglishLanguage = true;
// Do you want to show GP Lives per User in Stats
const showPerPersonLive = true;

// =========================================== OTHER SETTINGS ===========================================

// Number of /miss needed before a post is marked as dead, here it means 1pack=4miss, 2packs=6miss, 3packs=8miss, etc..
const missBeforeDead = [4, 6, 8, 10, 12];
// Multiply the Miss required when a post is flagged as NotLiked (ex : with a value of 0.5 a post with 8 miss required will switch to 4 miss)
const missNotLikedMultiplier = [0.5, 0.5, 0.5, 0.75, 0.85, 1]; // Based on two stars Amount, ex : x0.85 for a [4/5]

// The average Min2Stars of the group on Arturo's bot, used to calculate the Potential Lives GP
const min2Stars = 0;//can be a floating number ex:2.5
//What does your group runs, it is used for AntiCheat
const groupPacksType = 5;// 5 for 5 packs, 3 for 3packs

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

const GA_Mewtwo_CustomEmojiName = "mewtwo"; // 🧠 if not found, alternative : 🟣
const GA_Charizard_CustomEmojiName = "charizard"; // 🔥 if not found, alternative : 🟠
const GA_Pikachu_CustomEmojiName = "pikachu"; // ⚡️ if not found, alternative : 🟡
const MI_Mew_CustomEmojiName = "mew"; // 🏝️ if not found, alternative : 🟢
const STS_Dialga_CustomEmojiName = "dialga"; // 🕒 if not found, alternative : 🟦
const STS_Palkia_CustomEmojiName = "palkia"; // 🌌 if not found, alternative : 🟪
const TL_Arceus_CustomEmojiName = "arceus"; // 💡 if not found, alternative : 🟨
const SR_Giratina_CustomEmojiName = "lucario_shiny"; // ✨ if not found

export {
    token,
    guildID,
    channelID_Commands,
    channelID_UserStats,
    channelID_GPVerificationForum,
    channelID_2StarVerificationForum,
    channelID_Webhook,
    channelID_Heartbeat,
    channelID_AntiCheat,
    gitToken,
    gitGistID,
    gitGistGroupName,
    gitGistGPName,
    missBeforeDead,
    missNotLikedMultiplier,
    showPerPersonLive,
    EnglishLanguage,
    AntiCheat,
    AutoKick,
    refreshInterval,
    inactiveTime,
    inactiveInstanceCount,
    inactivePackPerMinCount,
    inactiveIfMainOffline,
    AutoCloseLivePostTime,
    AutoCloseNotLivePostTime,
    heartbeatRate,
    antiCheatRate,
    delayMsgDeleteState,
    backupUserDatasTime,
    min2Stars,
    groupPacksType,
    canPeopleAddOthers,
    canPeopleRemoveOthers,
    canPeopleLeech,
    leechPermGPCount,
    leechPermPackCount,
    resetServerDataFrequently,
    resetServerDataTime,
    safeEligibleIDsFiltering,
    addDoubleStarToVipIdsTxt,
    forceSkipMin2Stars,
    forceSkipMinPacks,
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
    GA_Mewtwo_CustomEmojiName,
    GA_Charizard_CustomEmojiName,
    GA_Pikachu_CustomEmojiName,
    MI_Mew_CustomEmojiName,
    STS_Dialga_CustomEmojiName,
    STS_Palkia_CustomEmojiName,
    TL_Arceus_CustomEmojiName,
    SR_Giratina_CustomEmojiName,
    outputUserDataOnGitGist,
};
