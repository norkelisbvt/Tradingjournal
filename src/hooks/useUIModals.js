import { useState } from "react";

// Estado de los modales y paneles "simples" de la app — los que solo abren y
// cierran, sin lógica de negocio propia adentro (a diferencia del modal de
// detalle de un trade, por ejemplo, que sí toca datos reales y por ahora se
// queda en TradingJournalInner.jsx).
//
// Primer paso del refactor del "componente gigante": se extrajo este grupo
// primero por ser el de menor riesgo — ningún estado de acá se cruza con
// trades, cuentas, ni sync. El resto de TradingJournalInner.jsx sigue
// funcionando exactamente igual, ya que este hook devuelve las mismas
// variables con los mismos nombres que antes vivían como useState sueltos.
export function useUIModals() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Onboarding de cuenta nueva: en vez de crearla al instante con valores por
  // defecto silenciosos, se abre un modal para nombrarla y configurar su
  // capital/broker/riesgo desde el día uno. { groupKey } cuando está abierto.
  const [newAccountModal, setNewAccountModal] = useState(null);

  // Panel de ayuda con los atajos de teclado de la app (se abre con "?").
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Paleta de comandos (Cmd/Ctrl+K): buscador rápido de secciones/cuentas/acciones.
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Confirmación de borrado + deshacer: confirmDialog describe la acción
  // pendiente de confirmar (trade o cuenta). { title, message, confirmLabel,
  // onConfirm } | null.
  const [confirmDialog, setConfirmDialog] = useState(null);

  return {
    menuOpen, setMenuOpen,
    newAccountModal, setNewAccountModal,
    shortcutsHelpOpen, setShortcutsHelpOpen,
    remindersOpen, setRemindersOpen,
    onboardingOpen, setOnboardingOpen,
    commandPaletteOpen, setCommandPaletteOpen,
    confirmDialog, setConfirmDialog,
  };
}
