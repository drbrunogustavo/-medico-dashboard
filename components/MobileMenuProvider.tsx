// Salvar em: components/MobileMenuProvider.tsx
'use client'
import { createContext, useContext, useState, useCallback } from 'react'

interface MenuCtx { open: boolean; openMenu: () => void; closeMenu: () => void }
const MenuContext = createContext<MenuCtx>({ open: false, openMenu: () => {}, closeMenu: () => {} })
export const useMenu = () => useContext(MenuContext)

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const openMenu  = useCallback(() => setOpen(true),  [])
  const closeMenu = useCallback(() => setOpen(false), [])
  return (
    <MenuContext.Provider value={{ open, openMenu, closeMenu }}>
      {children}
    </MenuContext.Provider>
  )
}
