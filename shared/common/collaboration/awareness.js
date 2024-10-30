/**
 * Convert provider awareness to an array of users
 * 
 * @param {Object} states The provider's awareness states object
 */
export const awarenessStatesToArray = (states) => {
  const seenUsers = new Set();
  
  return Array.from(states.entries())
    .filter(([_, value]) => !seenUsers.has(value.user.email) && seenUsers.add(value.user.email))
    .map(([key, value]) => ({
      clientId: key,
      ...value.user,
    }));
};
