import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Mail, Calendar, Shield, Lock, Eye, EyeOff, Info } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { InfoBox } from '../InfoBox'
import { apiClient } from '@/lib/api-client'

export function BasicSettingsTab() {
    const { t, i18n } = useTranslation('settings')
    const { user } = useAuthStore()
    const { addToast } = useToastStore()
    
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            addToast('error', t('basic.password.fillAllFields'))
            return
        }

        if (newPassword !== confirmPassword) {
            addToast('error', t('basic.password.mismatch'))
            return
        }

        if (newPassword.length < 6) {
            addToast('error', t('basic.password.tooShort'))
            return
        }

        setIsChangingPassword(true)
        try {
            await apiClient.post('/v1/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
            })
            
            addToast('success', t('basic.password.changeSuccess'))
            setShowPasswordForm(false)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            const message = error instanceof Error ? error.message : t('basic.password.changeFailed')
            addToast('error', message)
        } finally {
            setIsChangingPassword(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return t('basic.unknown')
        try {
            return new Date(dateString).toLocaleDateString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch {
            return dateString
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('basic.accountInfo.title')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('basic.accountInfo.description')}
                    </p>
                </div>
                
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">{t('basic.username')}</div>
                            <div className="text-sm font-medium text-foreground truncate">{user?.username || t('basic.notSet')}</div>
                        </div>
                    </div>

                    {user?.email && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-muted-foreground">{t('basic.email')}</div>
                                <div className="text-sm font-medium text-foreground truncate">{user.email}</div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">{t('basic.registeredAt')}</div>
                            <div className="text-sm font-medium text-foreground">{formatDate(user?.created_at)}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">{t('basic.role')}</div>
                            <div className="text-sm font-medium text-foreground">
                                {user?.role === 'admin' ? t('basic.roleAdmin') : t('basic.roleUser')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-border"></div>

            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{t('basic.security.title')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('basic.security.description')}
                    </p>
                </div>

                {!showPasswordForm ? (
                    <button
                        onClick={() => setShowPasswordForm(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Lock className="w-4 h-4" />
                        {t('basic.password.change')}
                    </button>
                ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4 p-4 rounded-lg bg-card border border-border">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{t('basic.password.current')}</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="input w-full pr-10"
                                    placeholder={t('basic.password.currentPlaceholder')}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{t('basic.password.new')}</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input w-full pr-10"
                                    placeholder={t('basic.password.newPlaceholder')}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{t('basic.password.confirm')}</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input w-full pr-10"
                                    placeholder={t('basic.password.confirmPlaceholder')}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordForm(false)
                                    setCurrentPassword('')
                                    setNewPassword('')
                                    setConfirmPassword('')
                                }}
                                className="btn btn-ghost flex-1"
                                disabled={isChangingPassword}
                            >
                                {t('basic.password.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary flex-1"
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? t('basic.password.changing') : t('basic.password.submit')}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="border-t border-border"></div>

            <InfoBox icon={Info} title={t('basic.password.infoBoxTitle')} variant="info">
                <ul className="space-y-1 text-sm">
                    <li>• {t('basic.password.tip1')}</li>
                    <li>• {t('basic.password.tip2')}</li>
                    <li>• {t('basic.password.tip3')}</li>
                    <li>• {t('basic.password.tip4')}</li>
                </ul>
            </InfoBox>
        </div>
    )
}
