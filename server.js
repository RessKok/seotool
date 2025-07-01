const express = require("express")
const path = require("path")
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json({ limit: "20mb" }))
app.use(express.urlencoded({ extended: true }))

const serpRoute = require("./tools/serp")
app.use("/api/serp", serpRoute)

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/index.html"))
})

app.get("/serp", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/serp.html"))
})

app.get("/pagetitle", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/pagetitle.html"))
})

app.get("/description", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/description.html"))
})

app.post("/api/seo-check", (req, res) => {
  try {
    const { metin } = req.body

    if (!metin) {
      return res.status(400).json({ error: "Metin gerekli" })
    }

    const uzunluk = metin.length
    const { pagetitle } = require("./tools/pixelCalculator")
    const piksel = pagetitle(metin)

    const sonuc = {
      karakter: uzunluk,
      piksel: Math.round(piksel),
      uygunMu: uzunluk >= 30 && uzunluk <= 60 && piksel >= 200 && piksel <= 580,
    }

    res.json(sonuc)
  } catch (error) {
    console.error("SEO check hatası:", error)
    res.status(500).json({ error: "İşlem başarısız" })
  }
})

app.post("/api/meta-description", (req, res) => {
  try {
    const { metin } = req.body

    if (!metin) {
      return res.status(400).json({ error: "Metin gerekli" })
    }

    const uzunluk = metin.length
    const { descriptionmeta } = require("./tools/pixelCalculator")
    const piksel = descriptionmeta(metin)

    const sonuc = {
      karakter: uzunluk,
      piksel: Math.round(piksel),
      uygunMu: uzunluk >= 70 && uzunluk <= 155 && piksel >= 400 && piksel <= 990,
    }

    res.json(sonuc)
  } catch (error) {
    console.error("Meta description check hatası:", error)
    res.status(500).json({ error: "İşlem başarısız" })
  }
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Sunucu hatası" })
})

app.use((req, res) => {
  res.status(404).json({ error: "Sayfa bulunamadı" })
})

const server = app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`)
})

process.on("SIGTERM", () => {
  console.log("SIGTERM alındı, server kapatılıyor...")
  server.close(() => {
    console.log("Server kapatıldı")
    process.exit(0)
  })
})
