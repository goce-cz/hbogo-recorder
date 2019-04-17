const puppeteer = require('puppeteer-core')
const path = require('path')
const { execFile } = require('child_process')

const [, , chromeExecutable, bandicamExecutable, episodeUrl] = process.argv

const PATTERN = /(https:\/\/hbogo.cz\/serialy\/.+\/.+)\/epizoda-([0-9])+/
const matches = PATTERN.exec(episodeUrl)

if (!matches) {
  throw new Error('invalid episode URL')
}

const [, seriesUrl, episodeNumber] = matches

const waitFor = async (page, selector, timeout) => {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const element = await page.$('#hbo-sdk--player-upnext')
    if (element) {
      return element
    }
    await delay(1000)
  }
  return null
}

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout))
try {
  (async () => {
    try {
      const bandi = path.resolve(bandicamExecutable)
      execFile(bandi, ['/record'])
      await delay(5000)

      const browser = await puppeteer.launch({
        headless: false,
        executablePath: path.resolve(chromeExecutable),
        args: ['--start-fullscreen'],
        userDataDir: './profile'
      })

      const page = await browser.newPage()
      await page.setViewport({
        width: 1366,
        height: 768
      })
      await page.goto(seriesUrl)
      await page.click(`[data-episode-number="${episodeNumber}"]`)
      await delay(2000)

      await page.bringToFront()

      try {
        const startOverButton = await page.$('.hbo-sdk--startpos-secondary-button')
        if (startOverButton) {
          await startOverButton.click()
        }
        await delay(100)

        await waitFor(page, '.hbo-sdk--player-timestamptext', 3 * 60 * 60 * 1000)

        await browser.close()
      } finally {
        execFile(bandi, ['/stop'])
      }
    } catch (error) {
      console.error(error)
    }
  })()

} catch (error) {
  console.error(error)
}
