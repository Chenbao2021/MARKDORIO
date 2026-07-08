import { Alert, Button, Snackbar } from '@mui/material'
import type { JSX } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './PwaUpdatePrompt.less'

export default function PwaUpdatePrompt(): JSX.Element {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("Échec de l'enregistrement du service worker", error)
    },
  })

  const closeOfflineReady = () => setOfflineReady(false)
  const closeNeedRefresh = () => setNeedRefresh(false)

  return (
    <>
      <Snackbar
        open={needRefresh}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        className="pwa-update-prompt"
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={closeNeedRefresh}
          action={
            <Button color="inherit" size="small" onClick={() => updateServiceWorker(true)}>
              Actualiser
            </Button>
          }
        >
          Nouvelle version disponible.
        </Alert>
      </Snackbar>
      <Snackbar
        open={offlineReady}
        autoHideDuration={5000}
        onClose={closeOfflineReady}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        className="pwa-update-prompt"
      >
        <Alert severity="success" variant="filled" onClose={closeOfflineReady}>
          Markdorio est disponible hors-ligne.
        </Alert>
      </Snackbar>
    </>
  )
}
