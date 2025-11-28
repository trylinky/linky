export function isUserAgentMobile(userAgent: string | null) {
  if (!userAgent) {
    return false;
  }

  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );
}
