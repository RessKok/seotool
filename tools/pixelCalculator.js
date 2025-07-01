const { createCanvas } = require("canvas")

function pagetitle(text, font = "Arial, sans-serif", size = 20) {
    const canvas = createCanvas(0, 0)
    const ctx = canvas.getContext("2d")
    ctx.font = `${size}px ${font}`
    return ctx.measureText(text).width
}

function descriptionmeta(text, font = "Arial, sans-serif", size = 14) {
    const canvas = createCanvas(0, 0)
    const ctx = canvas.getContext("2d")
    ctx.font = `${size}px ${font}`
    return ctx.measureText(text).width
}

module.exports = { pagetitle, descriptionmeta }
