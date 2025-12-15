import { create } from 'zustand'

export type DialogType = 'info' | 'warning' | 'error' | 'success'

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  type: DialogType
  confirmText?: string
  cancelText?: string
  resolve?: (result: boolean) => void
}

interface AlertDialogState {
  isOpen: boolean
  title: string
  message: string
  type: DialogType
  confirmText?: string
  resolve?: () => void
}

interface DialogState {
  confirmDialog: ConfirmDialogState | null
  alertDialog: AlertDialogState | null

  confirm: (params: {
    title?: string
    message: string
    type?: DialogType
    confirmText?: string
    cancelText?: string
  }) => Promise<boolean>

  alert: (params: {
    title?: string
    message: string
    type?: DialogType
    confirmText?: string
  }) => Promise<void>

  closeConfirm: (result: boolean) => void
  closeAlert: () => void

  info: (message: string, title?: string) => Promise<void>
  warning: (message: string, title?: string) => Promise<void>
  error: (message: string, title?: string) => Promise<void>
  success: (message: string, title?: string) => Promise<void>
}

export const useDialogStore = create<DialogState>((set, get) => ({
  confirmDialog: null,
  alertDialog: null,

  confirm: async ({
    title = '确认',
    message,
    type = 'warning',
    confirmText = '确定',
    cancelText = '取消',
  }) => {
    const existing = get().confirmDialog
    if (existing?.isOpen) {
      existing.resolve?.(false)
    }

    return await new Promise<boolean>((resolve) => {
      set({
        confirmDialog: {
          isOpen: true,
          title,
          message,
          type,
          confirmText,
          cancelText,
          resolve,
        },
      })
    })
  },

  alert: async ({ title = '提示', message, type = 'info', confirmText = '确定' }) => {
    const existing = get().alertDialog
    if (existing?.isOpen) {
      existing.resolve?.()
    }

    return await new Promise<void>((resolve) => {
      set({
        alertDialog: {
          isOpen: true,
          title,
          message,
          type,
          confirmText,
          resolve,
        },
      })
    })
  },

  closeConfirm: (result) => {
    const current = get().confirmDialog
    current?.resolve?.(result)
    set({ confirmDialog: null })
  },

  closeAlert: () => {
    const current = get().alertDialog
    current?.resolve?.()
    set({ alertDialog: null })
  },

  info: async (message, title = '提示') => {
    return await get().alert({ title, message, type: 'info' })
  },

  warning: async (message, title = '提示') => {
    return await get().alert({ title, message, type: 'warning' })
  },

  error: async (message, title = '操作失败') => {
    return await get().alert({ title, message, type: 'error' })
  },

  success: async (message, title = '操作成功') => {
    return await get().alert({ title, message, type: 'success' })
  },
}))
