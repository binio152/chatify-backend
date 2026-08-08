export const buildDirectConversationKey = (
  firstUserId: string,
  secondUserId: string,
) => {
  return [firstUserId, secondUserId].sort().join(":");
};
