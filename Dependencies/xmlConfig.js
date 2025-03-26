// Users attribs
const attrib_PocketID = "PocketID";
const attrib_Prefix = "Prefix";
const attrib_UserState = "UserState";
const attrib_ActiveState = "ActiveState";
const attrib_AverageInstances = "AverageInstances";
const attrib_HBInstances = "HBInstances";
const attrib_RealInstances = "RealInstances";
const attrib_SessionTime = "SessionTime";
const attrib_TotalPacksOpened = "TotalPacksOpened";
const attrib_TotalPacksFarm = "TotalPacksFarm";
const attrib_TotalAverageInstances = "TotalAverageInstances";
const attrib_TotalAveragePPM = "TotalAveragePPM";
const attrib_TotalHBTick = "TotalAverageTick";
const attrib_SessionPacksOpened = "SessionPacksOpened";
const attrib_DiffPacksSinceLastHB = "DiffPacksSinceLastHB";
const attrib_DiffTimeSinceLastHB = "DiffTimeSinceLastHB";
const attrib_PacksPerMin = "PacksPerMin"
const attrib_GodPackFound = "GodPackFound";
const attrib_GodPackLive = "GodPackLive";
const attrib_LastActiveTime = "LastActiveTime";
const attrib_LastHeartbeatTime = "LastHeartbeatTime";
const attrib_TotalTime = "TotalTime";
const attrib_TotalTimeFarm = "TotalTimeFarm";
const attrib_TotalMiss = "TotalMiss";
const attrib_AntiCheatUserCount = "AntiCheatUserCount";
const attrib_SelectedPack = "SelectedPack";
const attrib_Subsystems = "Subsystems";
const attrib_Subsystem = "Subsystem";

// Server attribs
const attrib_eligibleGPs = "eligibleGPs";
const attrib_eligibleGP = "eligibleGP";
const attrib_liveGPs = "liveGPs";
const attrib_liveGP = "liveGP";
const attrib_ineligibleGPs = "ineligibleGPs";
const attrib_ineligibleGP = "ineligibleGP";

// Path to datas
const __dirname = import.meta.dirname;
const pathUsersData = __dirname+'/../data/UsersData.xml';
const pathServerData = __dirname+'/../data/ServerData.xml';

export{ 
    attrib_PocketID,
    attrib_Prefix,
    attrib_UserState,
    attrib_ActiveState,
    attrib_AverageInstances, 
    attrib_HBInstances, 
    attrib_RealInstances, 
    attrib_SessionTime, 
    attrib_TotalPacksOpened, 
    attrib_TotalPacksFarm,
    attrib_TotalAverageInstances,
    attrib_TotalAveragePPM,
    attrib_TotalHBTick,
    attrib_SessionPacksOpened,
    attrib_DiffPacksSinceLastHB,
    attrib_DiffTimeSinceLastHB,
    attrib_PacksPerMin,
    attrib_GodPackFound,
    attrib_GodPackLive,
    attrib_LastActiveTime, 
    attrib_LastHeartbeatTime,
    attrib_TotalTime,
    attrib_TotalTimeFarm,
    attrib_TotalMiss,
    attrib_AntiCheatUserCount,
    attrib_SelectedPack,
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
}