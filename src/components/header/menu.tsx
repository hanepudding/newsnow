import { motion } from "framer-motion"
import { manageWatchlistsOpenAtom } from "~/components/watchlists/manage-modal"
import {
  applyImportedSettings,
  buildExportPayload,
  downloadSettings,
  pickSettingsFile,
  resetAllData,
} from "~/utils/settings-io"

export function Menu() {
  const { loggedIn, login, logout, userInfo, enableLogin } = useLogin()
  const [shown, show] = useState(false)
  const openManage = useSetAtom(manageWatchlistsOpenAtom)
  const toaster = useToast()

  const handleExport = useCallback(() => {
    try {
      downloadSettings(buildExportPayload())
      toaster("Settings exported", { type: "success" })
    } catch (e: any) {
      toaster(`Export failed: ${e.message}`, { type: "error" })
    }
    show(false)
  }, [toaster])

  const handleImport = useCallback(async () => {
    show(false)
    try {
      const parsed = await pickSettingsFile()
      if (!parsed) return
      const { imported, droppedSources } = applyImportedSettings(parsed)
      const note = droppedSources > 0 ? ` (${droppedSources} stale sources dropped)` : ""
      toaster(`Imported ${imported.length} settings${note}. Reloading...`, { type: "success" })
      setTimeout(() => window.location.reload(), 800)
    } catch (e: any) {
      toaster(`Import failed: ${e.message}`, { type: "error" })
    }
  }, [toaster])

  const handleReset = useCallback(async () => {
    show(false)
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Reset all data? This clears settings, caches, and service workers for this site. The page will reload to a fresh state.")
    if (!ok) return
    toaster("Clearing all data...", { type: "info" })
    await resetAllData()
    window.location.reload()
  }, [toaster])

  return (
    <span className="relative" onMouseEnter={() => show(true)} onMouseLeave={() => show(false)}>
      <span className="flex items-center scale-90">
        {
          enableLogin && loggedIn && userInfo.avatar
            ? (
                <button
                  type="button"
                  className="h-6 w-6 rounded-full bg-cover"
                  style={
                    {
                      backgroundImage: `url(${userInfo.avatar}&s=24)`,
                    }
                  }
                >
                </button>
              )
            : <button type="button" className="btn i-si:more-muted-horiz-circle-duotone" />
        }
      </span>
      {shown && (
        <div className="absolute right-0 z-99 bg-transparent pt-4 top-4">
          <motion.div
            id="dropdown-menu"
            className={$([
              "w-56",
              "bg-primary backdrop-blur-5 bg-op-70! rounded-lg shadow-xl",
            ])}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <ol className="bg-base bg-op-70! backdrop-blur-md p-2 rounded-lg color-base text-base">
              {enableLogin && (loggedIn
                ? (
                    <li onClick={logout}>
                      <span className="i-ph:sign-out-duotone inline-block" />
                      <span>Sign out</span>
                    </li>
                  )
                : (
                    <li onClick={login}>
                      <span className="i-ph:sign-in-duotone inline-block" />
                      <span>Sign in with GitHub</span>
                    </li>
                  ))}
              <li
                onClick={() => {
                  openManage(true)
                  show(false)
                }}
                className="cursor-pointer [&_*]:cursor-pointer transition-all"
              >
                <span className="i-ph:list-star-duotone inline-block" />
                <span>Manage watchlists</span>
              </li>

              <li className="my-1 h-px bg-neutral-400/20" role="separator" />

              <li
                onClick={handleExport}
                className="cursor-pointer [&_*]:cursor-pointer transition-all"
              >
                <span className="i-ph:export-duotone inline-block" />
                <span>Export settings</span>
              </li>
              <li
                onClick={handleImport}
                className="cursor-pointer [&_*]:cursor-pointer transition-all"
              >
                <span className="i-ph:download-duotone inline-block" />
                <span>Import settings</span>
              </li>
              <li
                onClick={handleReset}
                className="cursor-pointer [&_*]:cursor-pointer transition-all text-red-400"
              >
                <span className="i-ph:arrow-counter-clockwise-duotone inline-block" />
                <span>Reset all data</span>
              </li>

            </ol>
          </motion.div>
        </div>
      )}
    </span>
  )
}
