const userColorMap = new Map();
let colorIndex = 0; // Track current color index

/**
 * Convert provider awareness to an array of users
 * 
 * @param {Object} states The provider's awareness states object
 */
export const awarenessStatesToArray = (states, predefinedColors) => {
  const seenUsers = new Set();

  return Array.from(states.entries())
    .filter(([_, value]) => !seenUsers.has(value.user.email) && seenUsers.add(value.user.email))
    .map(([key, value]) => {
      const email = value.user.email;

      if (!userColorMap.has(email)) {
        userColorMap.set(email, predefinedColors[colorIndex % predefinedColors.length]);
        colorIndex++;
      }

      return {
        clientId: key,
        ...value.user,
        color: userColorMap.get(email),
      };
    });
};
