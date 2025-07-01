let eventSource = null

async function analyze() {
  const keyword = document.getElementById("keyword").value.trim()
  const loading = document.getElementById("loading")
  const container = document.getElementById("results")
  const progressBar = document.getElementById("progress-bar")
  const progressText = document.getElementById("progress-text")

  if (!keyword) {
    alert("Lütfen bir anahtar kelime girin!")
    return
  }

  if (eventSource) {
    eventSource.close()
  }

  loading.style.display = "block"
  container.innerHTML = ""

  if (progressBar) {
    progressBar.style.display = "block"
    progressBar.style.width = "0%"
  }
  if (progressText) {
    progressText.textContent = "Başlatılıyor..."
  }

  try {
    eventSource = new EventSource(`/api/serp/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword }),
    })

    const res = await fetch("/api/serp/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword }),
    })

    if (!res.ok) {
      throw new Error("Analiz başlatılamadı")
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split("\n")

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6))
            handleStreamData(data)
          } catch (e) {
            console.error("JSON parse hatası:", e)
          }
        }
      }
    }
  } catch (error) {
    loading.style.display = "none"
    if (progressBar) progressBar.style.display = "none"
    container.innerHTML = `<p style="color: #ff4444;">Hata: ${error.message}</p>`
    console.error("Analiz hatası:", error)
  }
}

function handleStreamData(data) {
  const loading = document.getElementById("loading")
  const container = document.getElementById("results")
  const progressBar = document.getElementById("progress-bar")
  const progressText = document.getElementById("progress-text")

  switch (data.type) {
    case "start":
    case "found":
    case "scraping":
      if (progressText) {
        progressText.textContent = data.message
      }
      if (progressBar && data.progress) {
        progressBar.style.width = data.progress + "%"
      }
      break

    case "result":
      addResultToPage(data.data)
      if (progressBar && data.progress) {
        progressBar.style.width = data.progress + "%"
      }
      if (progressText) {
        progressText.textContent = `${data.data.index}/5 tamamlandı`
      }
      break

    case "complete":
      loading.style.display = "none"
      if (progressBar) progressBar.style.display = "none"
      if (progressText) {
        progressText.textContent = "Analiz tamamlandı!"
        setTimeout(() => {
          if (progressText) progressText.textContent = ""
        }, 3000)
      }
      break

    case "error":
      loading.style.display = "none"
      if (progressBar) progressBar.style.display = "none"
      container.innerHTML += `<p style="color: #ff4444;">Hata: ${data.message}</p>`
      break
  }
}

function addResultToPage(result) {
  const container = document.getElementById("results")

  const h1Items =
    result.h1List && result.h1List.length > 0
      ? result.h1List.map((t) => `<li>${escapeHtml(t)}</li>`).join("")
      : '<li class="empty-message">H1 etiketi bulunamadı</li>'

  const h2Items =
    result.h2List && result.h2List.length > 0
      ? result.h2List.map((t) => `<li>${escapeHtml(t)}</li>`).join("")
      : '<li class="empty-message">H2 etiketi bulunamadı</li>'

  const resultDiv = document.createElement("div")
  resultDiv.innerHTML = `
    <div class="result-card" style="animation: slideIn 0.5s ease-out;">
        <h3 class="result-title">${result.index}. Sonuç 
          ${
            result.scrapingSuccess
              ? '<span style="color: #00ff88; font-size: 12px;">✓ Analiz edildi</span>'
              : '<span style="color: #ff4444; font-size: 12px;">⚠ Kısmi veri</span>'
          }
        </h3>
        <ul class="result-list">
            <li><strong>URL:</strong> <a href="${result.url}" target="_blank" class="result-link">${escapeHtml(result.url)}</a></li>
            <li><strong>Title:</strong> <span class="result-text">${escapeHtml(result.title)}</span></li>
            <li><strong>Description:</strong> <span class="result-text">${escapeHtml(result.description)}</span></li>
            <li><strong>Canonical:</strong> <span class="result-text">${escapeHtml(result.canonical)}</span></li>
        </ul>

        <details class="tag-details">
            <summary>
                <span>H1 Etiketleri</span>
                <span class="tag-count">${result.h1List ? result.h1List.length : 0}</span>
            </summary>
            <div class="tag-content">
                <ul>${h1Items}</ul>
            </div>
        </details>
        
        <details class="tag-details">
            <summary>
                <span>H2 Etiketleri</span>
                <span class="tag-count">${result.h2List ? result.h2List.length : 0}</span>
            </summary>
            <div class="tag-content">
                <ul>${h2Items}</ul>
            </div>
        </details>
    </div><hr class="result-divider">
  `

  container.appendChild(resultDiv)
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

document.getElementById("keyword").addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    analyze()
  }
})

window.addEventListener("beforeunload", () => {
  if (eventSource) {
    eventSource.close()
  }
})
