/**
 * After `vite build`, renders public SPA routes in headless Chromium and writes
 * HTML to disk so crawlers and SEO scanners see real text in the first response.
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')

const PREVIEW_PORT = Number(process.env.PRERENDER_PORT || 4173)
const ROUTES = ['/', '/services', '/gallery', '/prices', '/about', '/contact']

function tryConnectOnce(port, host) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ port, host }, () => {
      socket.end()
      resolve(host)
    })
    socket.on('error', reject)
  })
}

/** Vite may bind ::1 only; try both loopbacks. */
function waitForPort(port, timeout = 60_000) {
  const deadline = Date.now() + timeout
  const hosts = ['127.0.0.1', '::1']
  return new Promise((resolve, reject) => {
    async function poll() {
      for (const host of hosts) {
        try {
          const h = await tryConnectOnce(port, host)
          resolve(h)
          return
        } catch {
          /* try next host */
        }
      }
      if (Date.now() > deadline) {
        reject(new Error(`Nothing listening on port ${port} (tried ${hosts.join(', ')}) after ${timeout}ms`))
        return
      }
      setTimeout(poll, 120)
    }
    poll()
  })
}

function startPreview() {
  const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  return spawn(process.execPath, [viteBin, 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, BROWSER: 'none' },
  })
}

async function main() {
  const { chromium } = await import('playwright')
  let preview = null
  try {
    preview = startPreview()
    const loopbackHost = await waitForPort(PREVIEW_PORT)
    const hostBracket = loopbackHost.includes(':') ? `[${loopbackHost}]` : loopbackHost

    const browser = await chromium.launch({
      headless: true,
      args: process.env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
    })

    const base = `http://${hostBracket}:${PREVIEW_PORT}`

    for (const route of ROUTES) {
      const page = await browser.newPage()
      const url = route === '/' ? `${base}/` : `${base}${route}`
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 })
      await page.waitForSelector('main h1', { state: 'attached', timeout: 25_000 })
      await page.evaluate(() => new Promise((r) => setTimeout(r, 400)))

      const html = await page.content()
      await page.close()

      const outFile =
        route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html')
      await mkdir(path.dirname(outFile), { recursive: true })
      await writeFile(outFile, html, 'utf8')
      console.log(`prerender: ${route} -> ${path.relative(root, outFile)}`)
    }

    await browser.close()
  } finally {
    if (preview && !preview.killed) {
      preview.kill('SIGTERM')
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
