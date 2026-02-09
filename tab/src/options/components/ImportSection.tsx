/**
 * 导入功能组件
 */

import { TMarksImport } from './import/TMarksImport'

interface ImportSectionProps {
  formData: any
  setSuccessMessage: (msg: string) => void
  setError: (msg: string) => void
}

export function ImportSection({ formData, setSuccessMessage, setError }: ImportSectionProps) {
  // 直接显示 TMarks 导入组件
  return (
    <TMarksImport
      formData={formData}
      setSuccessMessage={setSuccessMessage}
      setError={setError}
      onBack={() => {}}
    />
  )
}
