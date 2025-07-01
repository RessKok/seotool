const sonucDiv = document.querySelector("#sonuc")

document.querySelector("#kontrolBtn").addEventListener("click", () => {
    sonucDiv.innerHTML = ""
    const metin = document.querySelector("#metin").value
    seoKontrolEt(metin)
})

document.querySelector("#kontrolTxtBtn").addEventListener("click", () => {
    sonucDiv.innerHTML = ""
    const file = document.querySelector("#fileInput").files[0]
    if (!file) return alert("Lütfen bir .txt dosyası seçin!")

    const reader = new FileReader()
    reader.onload = function(e) {
        const lines = e.target.result.split(/\r?\n/)
        lines.forEach(line => {
            if (line.trim() !== "") seoKontrolEt(line)
        })
    }
    reader.readAsText(file, "UTF-8")
})

function seoKontrolEt(metin) {
    fetch("/api/meta-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metin })
    })
    .then(res => res.json())
    .then(data => {
        const renk = data.uygunMu ? "#00ff88" : "#ff4444"
        const mesaj = data.uygunMu ? "SEO için uygun" : "SEO için uygun değil"

        const kart = document.createElement("div")
        kart.classList.add("seo-card")

        const id = `id-${Math.random().toString(36).substr(2, 9)}`
        kart.innerHTML = `
            <p class="seo-baslik" id="${id}">${metin}</p>
            <button class="copy-btn" onclick="kopyala('${id}', this)">Kopyala</button>
            <p><strong>Karakter:</strong> ${data.karakter}</p>
            <p><strong>Piksel:</strong> ${Math.round(data.piksel)} px</p>
            <p style="color: ${renk}; font-weight: bold;">${mesaj}</p>
        `
        sonucDiv.appendChild(kart)
    })
}

function kopyala(id, btn) {
    const text = document.getElementById(id).textContent
    navigator.clipboard.writeText(text).then(() => {
        const orijinal = btn.textContent
        btn.textContent = "Kopyalandı!"
        btn.disabled = true
        setTimeout(() => {
            btn.textContent = orijinal
            btn.disabled = false
        }, 1500)
    })
}
