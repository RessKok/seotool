const puppeteer = require("puppeteer")
const axios = require("axios")
const express = require("express")
const router = express.Router()

let browser

async function initBrowser() {
  if (!browser || !browser.isConnected()) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      })
    } catch (error) {
      console.error("Browser başlatılamadı:", error)
      throw error
    }
  }
  return browser
}

async function scrapePage(url) {
  let page
  try {
    const browser = await initBrowser()
    page = await browser.newPage()

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    )
    await page.setViewport({ width: 1366, height: 768 })

    await page.setRequestInterception(true)
    page.on("request", (req) => {
      const resourceType = req.resourceType()
      if (resourceType === "image" || resourceType === "stylesheet" || resourceType === "font") {
        req.abort()
      } else {
        req.continue()
      }
    })


    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 20000,
    })

    await new Promise((resolve) => setTimeout(resolve, 3000))


    const pageData = await page.evaluate(() => {
      try {
        const h1Elements = document.querySelectorAll("h1")
        const h1List = []
        h1Elements.forEach((el) => {
          const text = el.innerText || el.textContent || ""
          if (text.trim().length > 0) {
            h1List.push(text.trim())
          }
        })

        const h2Elements = document.querySelectorAll("h2")
        const h2List = []
        h2Elements.forEach((el) => {
          const text = el.innerText || el.textContent || ""
          if (text.trim().length > 0) {
            h2List.push(text.trim())
          }
        })

        let canonical = "Yok"
        const canonicalElement = document.querySelector('link[rel="canonical"]')
        if (canonicalElement && canonicalElement.href) {
          canonical = canonicalElement.href
        } else {
          const ogUrl = document.querySelector('meta[property="og:url"]')
          if (ogUrl && ogUrl.content) {
            canonical = ogUrl.content
          } else {
            canonical = window.location.href
          }
        }

        return {
          h1List,
          h2List,
          canonical,
          url: window.location.href,
          title: document.title || "Başlık bulunamadı",
        }
      } catch (error) {
        return {
          h1List: [],
          h2List: [],
          canonical: "Evaluate hatası: " + error.message,
          url: "",
          title: "",
        }
      }
    })

    

    return pageData
  } catch (error) {
    return {
      h1List: [],
      h2List: [],
      canonical: `Hata: ${error.message}`,
      url: url,
      title: "Hata",
    }
  } finally {
    if (page) {
      try {
        await page.close()
      } catch (closeError) {
        console.error("Sayfa kapatma hatası:", closeError.message)
      }
    }
  }
}

async function closeBrowser() {
  if (browser) {
    await browser.close()
    browser = null
  }
}

process.on("SIGINT", async () => {
  await closeBrowser()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await closeBrowser()
  process.exit(0)
})

router.post("/", async (req, res) => {
  const keyword = req.body.keyword

  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({ error: "Anahtar kelime gerekli" })
  }

  try {
    console.log(`SERP analizi başlatılıyor: ${keyword}`)

    const searchRes = await axios.post(
      "https://google.serper.dev/search",
      {
        q: keyword,
        gl: "tr",
        hl: "tr",
        num: 10,
      },
      {
        headers: {
          "X-API-KEY": "1ab5157a018ac8e0d2778b33ae80ebb716c74ff4",
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    )

    const rawResults = searchRes.data.organic?.slice(0, 5) || []

    if (rawResults.length === 0) {
      return res.json({ results: [], message: "Sonuç bulunamadı" })
    }


    const results = []
    for (let i = 0; i < rawResults.length; i++) {
      const item = rawResults[i]

      let scraped = { h1List: [], h2List: [], canonical: "Yok" }

      try {
        scraped = await scrapePage(item.link)

        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Scraping hatası (${item.link}):`, error.message)
        scraped = {
          h1List: [],
          h2List: [],
          canonical: `Scraping hatası: ${error.message}`,
        }
      }

      results.push({
        index: i + 1,
        url: item.link || "Yok",
        title: item.title || "Yok",
        description: item.snippet || "Yok",
        canonical: scraped.canonical,
        h1List: scraped.h1List || [],
        h2List: scraped.h2List || [],
        scrapingSuccess: scraped.h1List.length > 0 || scraped.h2List.length > 0,
      })

      
    }

    res.json({ results, totalScraped: results.length })
  } catch (err) {
    console.error("SERP API hatası:", err.message)

    if (err.code === "ECONNABORTED") {
      res.status(408).json({ error: "İstek zaman aşımına uğradı" })
    } else if (err.response?.status === 429) {
      res.status(429).json({ error: "API limit aşıldı, lütfen bekleyin" })
    } else {
      res.status(500).json({ error: "Veri alınamadı: " + err.message })
    }
  }
})

router.post("/stream", async (req, res) => {
  const keyword = req.body.keyword

  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({ error: "Anahtar kelime gerekli" })
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  })

  try {

    res.write(`data: ${JSON.stringify({ type: "start", message: "Arama başlatılıyor..." })}\n\n`)

    const searchRes = await axios.post(
      "https://google.serper.dev/search",
      {
        q: keyword,
        gl: "tr",
        hl: "tr",
        num: 10,
      },
      {
        headers: {
          "X-API-KEY": "1ab5157a018ac8e0d2778b33ae80ebb716c74ff4",
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    )

    const rawResults = searchRes.data.organic?.slice(0, 5) || []

    if (rawResults.length === 0) {
      res.write(`data: ${JSON.stringify({ type: "error", message: "Sonuç bulunamadı" })}\n\n`)
      res.end()
      return
    }

    res.write(
      `data: ${JSON.stringify({ type: "found", message: `${rawResults.length} sonuç bulundu, analiz başlatılıyor...` })}\n\n`,
    )

    for (let i = 0; i < rawResults.length; i++) {
      const item = rawResults[i]

      res.write(
        `data: ${JSON.stringify({
          type: "scraping",
          message: `${i + 1}/${rawResults.length} - ${item.title} analiz ediliyor...`,
          progress: Math.round((i / rawResults.length) * 100),
        })}\n\n`,
      )

      let scraped = { h1List: [], h2List: [], canonical: "Yok" }

      try {
        scraped = await scrapePage(item.link)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Scraping hatası (${item.link}):`, error.message)
        scraped = {
          h1List: [],
          h2List: [],
          canonical: `Scraping hatası: ${error.message}`,
        }
      }

      const result = {
        index: i + 1,
        url: item.link || "Yok",
        title: item.title || "Yok",
        description: item.snippet || "Yok",
        canonical: scraped.canonical,
        h1List: scraped.h1List || [],
        h2List: scraped.h2List || [],
        scrapingSuccess: scraped.h1List.length > 0 || scraped.h2List.length > 0,
      }

      res.write(
        `data: ${JSON.stringify({
          type: "result",
          data: result,
          progress: Math.round(((i + 1) / rawResults.length) * 100),
        })}\n\n`,
      )
    }

    res.write(`data: ${JSON.stringify({ type: "complete", message: "Analiz tamamlandı!" })}\n\n`)
    res.end()
  } catch (err) {
    console.error("SERP Stream hatası:", err.message)
    res.write(`data: ${JSON.stringify({ type: "error", message: "Analiz hatası: " + err.message })}\n\n`)
    res.end()
  }
})

module.exports = router