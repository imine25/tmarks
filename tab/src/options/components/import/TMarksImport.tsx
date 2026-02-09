/**
 * TMarks 批量导入组件
 */

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { parseBookmarksFile } from '@/lib/import/parser'
import { normalizeBookmarksWithStream, type NormalizeResult, type NormalizeProgress } from '@/lib/import/normalizer'
import type { 
  ParsedBookmark, 
  ImportFormat, 
  ImportOptions, 
  ImportResult
} from '@/types/import'

// 导入子组件
import { UploadStep } from './UploadStep'
import { ImportStep as ImportStepComponent } from './ImportStep'

interface TMarksImportProps {
  formData: any
  setSuccessMessage: (msg: string) => void
  setError: (msg: string) => void
  onBack: () => void
}

type ImportStep = 'upload' | 'import'

export function TMarksImport({ formData, setSuccessMessage, setError }: TMarksImportProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>('html')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedBookmarks, setParsedBookmarks] = useState<ParsedBookmark[]>([])
  const [normalizeResult, setNormalizeResult] = useState<NormalizeResult | null>(null)
  const [normalizeProgress, setNormalizeProgress] = useState<NormalizeProgress | null>(null)
  
  const [isImporting, setIsImporting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; status: string } | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const [options, setOptions] = useState<ImportOptions>({
    includeThumbnail: formData.defaultIncludeThumbnail ?? false,
    createSnapshot: formData.defaultCreateSnapshot ?? false,
    generateTags: false
  })

  useEffect(() => {
    async function parseFile() {
      if (selectedFile) {
        setIsValidating(true)
        setNormalizeProgress(null)
        try {
          const content = await selectedFile.text()
          const bookmarks = parseBookmarksFile(content, selectedFormat)
          setParsedBookmarks(bookmarks)
          
          if (bookmarks.length === 0) {
            setError('未能解析到有效的书签数据')
            setNormalizeResult(null)
          } else {
            const result = await normalizeBookmarksWithStream(bookmarks, setNormalizeProgress)
            setNormalizeResult(result)
            
            if (result.validUrls.length === 0) {
              setError('未找到有效的 URL')
            } else {
              setSuccessMessage(`已提取 ${result.validUrls.length} 个有效 URL`)
            }
          }
        } catch (err) {
          console.error('Failed to parse bookmarks:', err)
          setError('文件解析失败，请检查文件格式')
          setParsedBookmarks([])
          setNormalizeResult(null)
        } finally {
          setIsValidating(false)
          setNormalizeProgress(null)
        }
      } else {
        setParsedBookmarks([])
        setNormalizeResult(null)
        setNormalizeProgress(null)
      }
    }

    parseFile()
  }, [selectedFile, selectedFormat])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setImportResult(null)
  }

  const handleReset = () => {
    setSelectedFile(null)
    setParsedBookmarks([])
    setNormalizeResult(null)
    setNormalizeProgress(null)
    setImportResult(null)
    setCurrentStep('upload')
  }

  const handleStartImport = () => {
    setCurrentStep('import')
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h3 className="text-xl font-bold text-[var(--tab-options-title)] mb-2">
          {chrome.i18n.getMessage('import_title')}
        </h3>
        <p className="text-sm text-[var(--tab-options-text)]">
          将书签导入到 TMarks 书签管理系统
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <span className="text-sm font-medium">上传文件</span>
        </div>
        
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep === 'import' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <span className="text-sm font-medium">导入</span>
        </div>
      </div>

      {/* 步骤内容 */}
      {currentStep === 'upload' && (
        <UploadStep
          selectedFormat={selectedFormat}
          setSelectedFormat={setSelectedFormat}
          selectedFile={selectedFile}
          isValidating={isValidating}
          normalizeResult={normalizeResult}
          normalizeProgress={normalizeProgress}
          enableAiOrganize={false}
          setEnableAiOrganize={() => {}}
          isAiRequired={false}
          options={options}
          setOptions={setOptions}
          onFileSelect={handleFileSelect}
          onReset={handleReset}
          onStartImport={handleStartImport}
        />
      )}

      {currentStep === 'import' && (
        <ImportStepComponent
          bookmarks={parsedBookmarks}
          isImporting={isImporting}
          importProgress={importProgress}
          importResult={importResult}
          onImport={async (bookmarks) => {
            setIsImporting(true)
            setImportProgress({ current: 0, total: 100, status: '正在导入...' })

            try {
              const { importToTMarks } = await import('@/lib/import/api')
              const tmarksUrl = formData.tmarksUrl || 'https://tmarks.example.com'
              const accessToken = formData.tmarksAccessToken

              const result = await importToTMarks(bookmarks, options, tmarksUrl, accessToken)
              
              setImportResult(result)
              setSuccessMessage(`成功导入 ${result.success} 个书签`)
            } catch (error) {
              console.error('Import failed:', error)
              setError(error instanceof Error ? error.message : '导入失败')
            } finally {
              setIsImporting(false)
              setImportProgress(null)
            }
          }}
        />
      )}
    </div>
  )
}
