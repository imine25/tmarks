#!/usr/bin/env node

/**
 * 多浏览器版本构建脚本
 * 
 * 功能：
 * - 根据配置文件自动构建多个浏览器版本
 * - 支持选择性构建特定浏览器
 * - 自动验证配置
 * - 生成构建报告
 * 
 * 使用方式：
 * - 构建所有版本: pnpm build
 * - 构建特定版本: pnpm build chrome
 * - 构建多个版本: pnpm build chrome firefox
 */

import { execSync } from 'child_process'
import { createWriteStream, existsSync, mkdirSync, copyFileSync, readFileSync, readdirSync } from 'fs'
import { readdir, stat, rm } from 'fs/promises'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import archiver from 'archiver'
import { buildConfig, getEnabledBrowsers, getBrowserConfig, validateConfig } from '../build.config.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 项目路径
const TAB_ROOT = resolve(__dirname, '..')
const DIST_DIR = join(TAB_ROOT, buildConfig.output.distDir)
const OUTPUT_DIR = resolve(TAB_ROOT, buildConfig.output.publicDir)

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
}

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`)
}

function logStep(step, total, message) {
    log(`\n[${step}/${total}] ${message}`, colors.blue + colors.bright)
}

function logSuccess(message) {
    log(`✓ ${message}`, colors.green)
}

function logError(message) {
    log(`✗ ${message}`, colors.red)
}

function logWarning(message) {
    log(`⚠ ${message}`, colors.yellow)
}

function logInfo(message) {
    log(`ℹ ${message}`, colors.cyan)
}

/**
 * 执行命令
 */
function runCommand(command, cwd = TAB_ROOT) {
    try {
        log(`  执行: ${command}`, colors.dim)
        execSync(command, { cwd, stdio: 'inherit' })
        return true
    } catch (error) {
        logError(`命令执行失败: ${command}`)
        return false
    }
}

/**
 * 获取目录大小
 */
async function getDirectorySize(dirPath) {
    let totalSize = 0

    async function calculateSize(currentPath) {
        const stats = await stat(currentPath)

        if (stats.isFile()) {
            totalSize += stats.size
        } else if (stats.isDirectory()) {
            const files = await readdir(currentPath)
            await Promise.all(
                files.map(file => calculateSize(join(currentPath, file)))
            )
        }
    }

    await calculateSize(dirPath)
    return totalSize
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * 创建 ZIP 压缩包
 */
async function createZip(sourceDir, outputPath, browser) {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(outputPath)
        const archive = archiver('zip', {
            zlib: { level: buildConfig.buildOptions.compressionLevel }
        })

        output.on('close', () => {
            resolve(archive.pointer())
        })

        archive.on('error', (err) => {
            reject(err)
        })

        archive.pipe(output)

        // 直接添加整个 dist 目录
        archive.directory(sourceDir, false)

        archive.finalize()
    })
}

/**
 * 构建单个浏览器版本
 */
async function buildBrowser(browser, distSize) {
    const outputPath = join(OUTPUT_DIR, browser.outputFile)

    // 删除旧的 ZIP 文件
    if (existsSync(outputPath)) {
        await rm(outputPath, { force: true })
    }

    // 创建 ZIP
    log(`  正在压缩 ${browser.name} 版本...`, colors.dim)
    const zipSize = await createZip(DIST_DIR, outputPath, browser)

    // 验证结果
    if (!existsSync(outputPath)) {
        logError(`${browser.name} ZIP 文件创建失败`)
        return null
    }

    const compressionRatio = ((1 - zipSize / distSize) * 100).toFixed(2)

    return {
        browser: browser.name,
        id: browser.id,
        outputFile: browser.outputFile,
        outputPath,
        size: zipSize,
        compressionRatio,
        success: true
    }
}

/**
 * 主流程
 */
async function main() {
    const startTime = Date.now()

    // 解析命令行参数
    const args = process.argv.slice(2)
    const targetBrowsers = args.length > 0 ? args : null

    log('\n' + '='.repeat(70), colors.bright)
    log('  多浏览器扩展构建工具', colors.bright + colors.cyan)
    log('='.repeat(70) + '\n', colors.bright)

    try {
        // 验证配置
        const validation = validateConfig()
        if (!validation.valid) {
            logError('配置验证失败:')
            validation.errors.forEach(error => log(`  - ${error}`, colors.red))
            process.exit(1)
        }

        // 获取要构建的浏览器
        let browsers = getEnabledBrowsers()

        if (targetBrowsers) {
            browsers = browsers.filter(b => targetBrowsers.includes(b.id))
            if (browsers.length === 0) {
                logError(`未找到指定的浏览器: ${targetBrowsers.join(', ')}`)
                logInfo(`可用的浏览器: ${getEnabledBrowsers().map(b => b.id).join(', ')}`)
                process.exit(1)
            }
            logInfo(`构建目标: ${browsers.map(b => b.name).join(', ')}`)
        } else {
            logInfo(`构建所有启用的浏览器 (${browsers.length} 个)`)
        }

        const totalSteps = 4 + browsers.length
        let currentStep = 0

        // 步骤 1: 检查环境
        currentStep++
        logStep(currentStep, totalSteps, '检查环境')

        if (!existsSync(TAB_ROOT)) {
            logError('项目根目录不存在')
            process.exit(1)
        }
        logSuccess('项目根目录存在')

        // 创建输出目录
        if (!existsSync(OUTPUT_DIR)) {
            mkdirSync(OUTPUT_DIR, { recursive: true })
            logSuccess('已创建输出目录')
        } else {
            logSuccess('输出目录存在')
        }

        // 注意：所有浏览器版本都使用 dist/manifest.json（已被 Vite 正确转换）
        // 不再检查 manifests/ 目录下的文件

        // 步骤 2: 清理旧文件
        currentStep++
        logStep(currentStep, totalSteps, '清理旧文件')

        if (buildConfig.buildOptions.clean) {
            if (existsSync(DIST_DIR)) {
                log('  删除旧的 dist 目录...', colors.dim)
                await rm(DIST_DIR, { recursive: true, force: true })
                logSuccess('已清理构建目录')
            }

            // 清理旧的 ZIP 文件
            let cleanedCount = 0
            for (const browser of browsers) {
                const outputPath = join(OUTPUT_DIR, browser.outputFile)
                if (existsSync(outputPath)) {
                    await rm(outputPath, { force: true })
                    cleanedCount++
                }
            }
            if (cleanedCount > 0) {
                logSuccess(`已清理 ${cleanedCount} 个旧的 ZIP 文件`)
            }
        } else {
            logInfo('跳过清理（配置禁用）')
        }

        // 步骤 3: 构建扩展
        currentStep++
        logStep(currentStep, totalSteps, '构建浏览器扩展')

        if (!runCommand('npm run build:only')) {
            logError('构建失败')
            process.exit(1)
        }
        logSuccess('构建完成')

        // 验证构建产物
        if (!existsSync(DIST_DIR)) {
            logError('构建产物目录不存在')
            process.exit(1)
        }

        // 获取构建产物大小
        const distSize = await getDirectorySize(DIST_DIR)
        log(`  构建产物大小: ${formatSize(distSize)}`, colors.dim)

        // 步骤 4: 创建浏览器版本
        currentStep++
        logStep(currentStep, totalSteps, '创建浏览器版本')

        const results = []

        for (const browser of browsers) {
            log(`\n  📦 ${browser.name}`, colors.cyan + colors.bright)
            log(`     ${browser.description}`, colors.dim)

            const result = await buildBrowser(browser, distSize)

            if (result) {
                results.push(result)
                logSuccess(`${browser.name} 构建成功`)
                log(`     文件: ${result.outputFile}`, colors.dim)
                log(`     大小: ${formatSize(result.size)}`, colors.dim)
                log(`     压缩率: ${result.compressionRatio}%`, colors.dim)
            } else {
                logError(`${browser.name} 构建失败`)
            }
        }

        // 步骤 5: 生成报告
        currentStep++
        logStep(currentStep, totalSteps, '生成构建报告')

        const endTime = Date.now()
        const duration = ((endTime - startTime) / 1000).toFixed(2)

        // 完成
        log('\n' + '='.repeat(70), colors.green + colors.bright)
        log('  ✓ 构建完成！', colors.green + colors.bright)
        log('='.repeat(70) + '\n', colors.green + colors.bright)

        // 构建报告
        log('📊 构建报告:', colors.bright)
        log('')
        log(`  构建时间: ${duration}s`, colors.cyan)
        log(`  成功: ${results.length}/${browsers.length}`, colors.green)
        log(`  输出目录: ${OUTPUT_DIR}`, colors.dim)
        log('')

        if (results.length > 0) {
            log('📦 生成的文件:', colors.bright)
            results.forEach(result => {
                log(`  ✓ ${result.outputFile}`, colors.green)
                log(`    大小: ${formatSize(result.size)} | 压缩率: ${result.compressionRatio}%`, colors.dim)
            })
            log('')
        }

        // 下载地址
        log('🌐 下载地址:', colors.bright)
        results.forEach(result => {
            log(`  ${result.browser}: /extensions/${result.outputFile}`, colors.cyan)
        })
        log('')

        // 下一步提示
        log('📝 下一步:', colors.bright)
        log('  1. 测试扩展: 在各个浏览器中加载测试', colors.dim)
        log('  2. 部署 TMarks: pnpm deploy', colors.dim)
        log('  3. 用户下载: 访问扩展页面下载对应版本', colors.dim)
        log('')

    } catch (error) {
        logError(`发生错误: ${error.message}`)
        console.error(error)
        process.exit(1)
    }
}

// 运行主流程
main()
