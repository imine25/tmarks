import { useTranslation } from 'react-i18next'
import { Shield, Download, Info, ExternalLink } from 'lucide-react'
import { InfoBox } from '../InfoBox'
import * as simpleIcons from 'simple-icons'

export function BrowserSettingsTab() {
  const { t } = useTranslation('settings')

  type BrowserType = 'chrome' | 'firefox' | 'edge' | 'opera' | 'brave' | '360' | 'qq' | 'sogou'
  
  const handleDownload = (browser: BrowserType) => {
    const link = document.createElement('a')
    link.href = `/extensions/tmarks-extension-${browser}.zip`
    link.download = `tmarks-extension-${browser}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const BrowserIcon = ({ browser, className }: { browser: string; className?: string }) => {
    const baseClass = className || 'w-8 h-8'
    
    const getIconData = () => {
      switch (browser) {
        case 'chrome':
          return simpleIcons.siGooglechrome
        case 'firefox':
          return simpleIcons.siFirefox
        case 'edge':
          return null
        case 'brave':
          return simpleIcons.siBrave
        case 'opera':
          return simpleIcons.siOpera
        case '360':
          return null
        case 'qq':
          return simpleIcons.siQq
        case 'sogou':
          return null
        default:
          return simpleIcons.siGooglechrome
      }
    }

    const iconData = getIconData()
    
    if (!iconData) {
      if (browser === 'edge') {
        return (
          <svg className={`${baseClass} text-primary`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.5 12c0-4.7-3.8-8.5-8.5-8.5S3.5 7.3 3.5 12c0 4.1 2.9 7.5 6.8 8.3.5.1 1 .2 1.5.2 4.7 0 8.5-3.8 8.5-8.5h.2zm-8.5 7c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z"/>
            <path d="M12 7c-2.8 0-5 2.2-5 5s2.2 5 5 5c1.9 0 3.6-1.1 4.4-2.7-.7.4-1.5.7-2.4.7-2.8 0-5-2.2-5-5 0-.9.2-1.7.6-2.4C10.4 7.2 11.2 7 12 7z"/>
          </svg>
        )
      }
      if (browser === '360') {
        return (
          <svg className={`${baseClass} text-success`} viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" opacity="0.2"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <path d="M12 6v12M6 12h12"/>
          </svg>
        )
      }
      return (
        <svg className={`${baseClass} text-muted-foreground`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      )
    }

    return (
      <svg
        className={baseClass}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: `#${iconData.hex}` }}
        role="img"
      >
        <path d={iconData.path} />
      </svg>
    )
  }

  const browsers = [
    { id: 'chrome', name: 'Chrome', color: 'hover:bg-muted/50' },
    { id: 'edge', name: 'Edge', color: 'hover:bg-muted/50' },
    { id: 'firefox', name: 'Firefox', color: 'hover:bg-muted/50' },
    { id: 'brave', name: 'Brave', color: 'hover:bg-muted/50' },
    { id: 'opera', name: 'Opera', color: 'hover:bg-muted/50' },
    { id: '360', name: '360', color: 'hover:bg-muted/50' },
    { id: 'qq', name: 'QQ', color: 'hover:bg-muted/50' },
    { id: 'sogou', name: 'Sogou', color: 'hover:bg-muted/50' },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('browser.download.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('browser.download.description')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {browsers.map((browser) => (
            <button
              key={browser.id}
              onClick={() => handleDownload(browser.id as BrowserType)}
              className={`p-3 sm:p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-center group ${browser.color}`}
            >
              <div className="mx-auto mb-1 sm:mb-2 flex justify-center">
                <BrowserIcon browser={browser.id} className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div className="text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">{browser.name}</div>
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-muted-foreground group-hover:text-primary">
                <Download className="w-3 h-3" />
                {t('browser.download.clickToDownload')}
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">
            {t('browser.download.tip')}
          </p>
        </div>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('browser.permissions.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('browser.permissions.description')}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold mb-2">{t('browser.popup.title')}</h4>
              <p className="text-xs text-muted-foreground mb-3">
                {t('browser.popup.description')}
              </p>
              <div className="text-xs text-muted-foreground space-y-2">
                <p className="font-medium">{t('browser.popup.howTo')}</p>
                <ol className="space-y-1 ml-4 list-decimal">
                  <li>{t('browser.popup.step1')}</li>
                  <li>{t('browser.popup.step2')}</li>
                  <li>{t('browser.popup.step3')}</li>
                  <li>{t('browser.popup.step4')}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">{t('browser.faq.title')}</h4>
          
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-sm font-medium mb-1">{t('browser.popup.chromeTitle')}</div>
            <div className="text-xs text-muted-foreground">
              {t('browser.popup.chromeDesc')}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-sm font-medium mb-1">{t('browser.popup.firefoxTitle')}</div>
            <div className="text-xs text-muted-foreground">
              {t('browser.popup.firefoxDesc')}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-sm font-medium mb-1">{t('browser.popup.safariTitle')}</div>
            <div className="text-xs text-muted-foreground">
              {t('browser.popup.safariDesc')}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="text-sm font-semibold mb-2">{t('browser.popup.whyTitle')}</h4>
          <p className="text-xs text-muted-foreground">
            {t('browser.popup.whyDesc')}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{t('browser.permissions.title')}</h4>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('browser.permissions.bookmarks.title')}</div>
              <div className="text-xs text-muted-foreground">
                {t('browser.permissions.bookmarks.description')}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('browser.permissions.tabs.title')}</div>
              <div className="text-xs text-muted-foreground">
                {t('browser.permissions.tabs.description')}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('browser.permissions.storage.title')}</div>
              <div className="text-xs text-muted-foreground">
                {t('browser.permissions.storage.description')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('browser.install.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('browser.install.description')}
          </p>
        </div>

        <div className="space-y-3">
          {[
            { step: 1, titleKey: 'step1Title', descKey: 'step1Desc' },
            { step: 2, titleKey: 'step2Title', descKey: 'step2Desc' },
            { step: 3, titleKey: 'step3Title', descKey: 'step3Desc' },
            { step: 4, titleKey: 'step4Title', descKey: 'step4Desc' },
            { step: 5, titleKey: 'step5Title', descKey: 'step5Desc' },
            { step: 6, titleKey: 'step6Title', descKey: 'step6Desc' },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{item.step}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">{t(`browser.install.${item.titleKey}`)}</div>
                <div className="text-xs text-muted-foreground">{t(`browser.install.${item.descKey}`)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('browser.faq.title')}</h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-muted/30">
            <h4 className="text-sm font-medium mb-2">{t('browser.faq.iconNotFound')}</h4>
            <p className="text-xs text-muted-foreground">
              {t('browser.faq.iconNotFoundAnswer')}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30">
            <h4 className="text-sm font-medium mb-2">{t('browser.faq.howToGetApiKey')}</h4>
            <p className="text-xs text-muted-foreground">
              {t('browser.faq.howToGetApiKeyAnswer')}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30">
            <h4 className="text-sm font-medium mb-2">{t('browser.faq.supportedBrowsers')}</h4>
            <p className="text-xs text-muted-foreground">
              {t('browser.faq.supportedBrowsersAnswer')}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30">
            <h4 className="text-sm font-medium mb-2">Q: {t('browser.faq.whereToView')}</h4>
            <p className="text-xs text-muted-foreground">
              A: {t('browser.faq.whereToViewAnswer')}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      <InfoBox icon={Info} title={t('browser.infoBox.title')} variant="info">
        <ul className="space-y-1">
          <li>• {t('browser.infoBox.tip1')}</li>
          <li>• {t('browser.infoBox.tip2')}</li>
          <li>• {t('browser.infoBox.tip3')}</li>
          <li>• {t('browser.infoBox.tip4')}</li>
        </ul>
      </InfoBox>
    </div>
  )
}
