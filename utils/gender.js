/**
 * Gender Utility
 * 
 * Priority order:
 * 1. Manual override (set via /setgender command)
 * 2. Database cached value
 * 3. Facebook API (fallback only if above fail)
 */

const GENDER_MAP = new Map([
  [1, "FEMALE"],
  ["1", "FEMALE"],
  ["FEMALE", "FEMALE"],
  ["female", "FEMALE"],
  [2, "MALE"],
  ["2", "MALE"],
  ["MALE", "MALE"],
  ["male", "MALE"]
]);

// Manual gender overrides set by admins (takes priority)
// Format: { userID: "MALE" | "FEMALE" }
const GENDER_OVERRIDES = new Map();

function normalizeGender(value) {
  if (value === undefined || value === null) return null;
  const normalized = GENDER_MAP.get(value) || GENDER_MAP.get(value.toString()?.toUpperCase());
  return normalized || null;
}

/**
 * Set manual gender override for a user (admin function)
 * Use /setgender command to set this
 */
function setGenderOverride(userID, gender) {
  const normalized = normalizeGender(gender);
  if (!normalized) return false;
  GENDER_OVERRIDES.set(userID.toString(), normalized);
  console.log(`[gender] Override set: ${userID} = ${normalized}`);
  return true;
}

/**
 * Remove gender override for a user
 */
function removeGenderOverride(userID) {
  return GENDER_OVERRIDES.delete(userID.toString());
}

/**
 * Get gender override if set
 */
function getGenderOverride(userID) {
  return GENDER_OVERRIDES.get(userID.toString()) || null;
}

/**
 * Get all gender overrides
 */
function getAllGenderOverrides() {
  return Object.fromEntries(GENDER_OVERRIDES);
}

/**
 * Get gender from database cache
 */
async function getGenderFromDB(threadID, userID) {
  if (!threadID || !global.Thread) return null;
  try {
    const thread = await global.Thread.findOne(
      { threadID },
      { users: 1 }
    ).lean();

    if (!thread || !Array.isArray(thread.users)) return null;

    const user = thread.users.find(
      userEntry => userEntry?.id?.toString() === userID || userEntry?.userID?.toString() === userID
    );

    return user ? normalizeGender(user.gender) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get gender from Facebook API (fallback)
 */
async function getGenderFromAPI(api, userID) {
  if (!api?.getUserInfo || !userID) return null;
  try {
    const response = await new Promise((resolve, reject) => {
      api.getUserInfo(userID, (err, info) => (err ? reject(err) : resolve(info)));
    });

    const user = response?.[userID];
    return user ? normalizeGender(user.gender) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch complete user info from API
 */
async function getUserInfoFromAPI(api, userID) {
  if (!api?.getUserInfo || !userID) return null;
  try {
    const response = await new Promise((resolve, reject) => {
      api.getUserInfo(userID, (err, info) => (err ? reject(err) : resolve(info)));
    });
    return response?.[userID] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Resolve user profile (gender + name)
 * 
 * Priority:
 * 1. Manual override (/setgender)
 * 2. Database cache
 * 3. Facebook API (fallback)
 */
async function resolveUserProfile({ userID, threadID, api }) {
  if (!userID) return { gender: null, name: "User" };

  let userName = null;
  let userGender = null;

  // 1. Try to get name from Global User DB
  try {
    if (global.data && global.data.userName && global.data.userName.has(userID)) {
      userName = global.data.userName.get(userID);
    } else if (global.User) {
      // Use User.getData or User.findOne if available
      try {
        const userData = typeof global.User.getData === 'function' 
          ? await global.User.getData(userID) 
          : await global.User.findOne({ userID }).lean();
        if (userData && userData.name) {
          userName = userData.name;
        }
      } catch(e) {}
    }
  } catch (e) {}

  // Get gender override if any
  const genderOverride = getGenderOverride(userID);

  if (genderOverride) {
    userGender = genderOverride;
  } else {
    // Try database cache for gender
    userGender = await getGenderFromDB(threadID, userID);
  }

  // If we're missing either name or gender, fallback to API
  if (!userName || !userGender) {
    const apiInfo = await getUserInfoFromAPI(api, userID);
    if (apiInfo) {
      if (!userName && apiInfo.name) {
        userName = apiInfo.name;
      }
      if (!userGender && apiInfo.gender) {
        userGender = normalizeGender(apiInfo.gender);
      }
    }
  }

  return { 
    gender: userGender || null, 
    name: userName || "User" 
  };
}

/**
 * Resolve user gender only
 */
async function resolveUserGender({ userID, threadID, api }) {
  const profile = await resolveUserProfile({ userID, threadID, api });
  return profile.gender;
}

/**
 * Update a user's gender in the database
 */
async function updateUserGenderInDB(threadID, userID, gender) {
  if (!global.Thread || !threadID || !userID || !gender) return false;

  try {
    const normalizedGender = normalizeGender(gender);
    if (!normalizedGender) return false;

    // Update using positional operator
    const result = await global.Thread.updateOne(
      { threadID, 'users.id': userID },
      { $set: { 'users.$.gender': normalizedGender } }
    );

    // Also try with userID field format
    if (result.modifiedCount === 0) {
      await global.Thread.updateOne(
        { threadID, 'users.userID': userID },
        { $set: { 'users.$.gender': normalizedGender } }
      );
    }

    return true;
  } catch (error) {
    console.warn(`[gender] Failed to update gender in DB: ${error.message}`);
    return false;
  }
}

module.exports = {
  resolveUserProfile,
  resolveUserGender,
  updateUserGenderInDB,
  normalizeGender,
  // Gender override functions
  setGenderOverride,
  removeGenderOverride,
  getGenderOverride,
  getAllGenderOverrides
};
