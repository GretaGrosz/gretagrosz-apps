import { createContext, useCallback, useContext, useState } from 'react'
import Toast from './Toast.jsx'

// Eine Meldung unten für die ganze App (z. B. "Prüfung gelöscht · Rückgängig")
const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const show = useCallback((next) => setToast({ ...next, id: Date.now() }), [])
  const close = useCallback(() => setToast(null), [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      <Toast toast={toast} onClose={close} />
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
