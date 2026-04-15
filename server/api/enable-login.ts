import process from "node:process"

export default defineEventHandler(async (event) => {
  // If any required auth env var is missing, the auth middleware marks
  // disabledLogin = true and all login UI should be hidden. Otherwise
  // useRefetch falsely gates force-refresh behind "please log in" and
  // the manual refresh button becomes a no-op.
  if (event.context.disabledLogin) {
    return { enable: false }
  }
  return {
    enable: true,
    url: `https://github.com/login/oauth/authorize?client_id=${process.env.G_CLIENT_ID}`,
  }
})
