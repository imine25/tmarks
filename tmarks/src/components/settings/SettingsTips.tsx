interface SettingsTipsProps {
  tips: string[]
}

export function SettingsTips({ tips }: SettingsTipsProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
        💡 使用提示
      </h4>
      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
        {tips.map((tip, index) => (
          <li key={index}>• {tip}</li>
        ))}
      </ul>
    </div>
  )
}
