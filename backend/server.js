import express from 'express'
import cors from 'cors'
import multer from 'multer'
import OpenAI from 'openai'
import pptxgen from 'pptxgenjs'
import officeParser from 'officeparser'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../dist')))

const upload = multer({ dest: 'uploads/' })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.post('/api/ppt-to-notes', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path

    const text = await new Promise((resolve, reject) => {
      officeParser.parseOffice(filePath, (data, err) => {
        if (err) reject(err)
        else resolve(data)
      })
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a study notes generator. Take the raw text from a PowerPoint and convert it into clean, structured study notes with headings, bullet points, and key terms highlighted. Make it easy to read and study from.'
        },
        {
          role: 'user',
          content: `Here is the text from my PowerPoint slides:\n\n${text}`
        }
      ]
    })

    fs.unlinkSync(filePath)

    res.json({ notes: completion.choices[0].message.content })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to process file' })
  }
})

app.post('/api/notes-to-ppt', async (req, res) => {
  try {
    const { text } = req.body

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a PowerPoint slide generator. Take the users notes and convert them into slides. Return ONLY a JSON array like this: [{"title": "Slide Title", "bullets": ["point 1", "point 2", "point 3"]}]. No extra text, just the JSON array.'
        },
        {
          role: 'user',
          content: `Convert these notes into PowerPoint slides:\n\n${text}`
        }
      ]
    })

    const raw = completion.choices[0].message.content
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const slides = JSON.parse(cleaned)

    const pptx = new pptxgen()

    slides.forEach(slide => {
      const s = pptx.addSlide()
      s.addText(slide.title, {
        x: 0.5, y: 0.3, w: '90%', h: 1,
        fontSize: 28, bold: true, color: '363636'
      })
      slide.bullets.forEach((bullet, i) => {
        s.addText(`• ${bullet}`, {
          x: 0.5, y: 1.5 + i * 0.6, w: '90%', h: 0.5,
          fontSize: 16, color: '555555'
        })
      })
    })

    const outputPath = path.join(__dirname, 'output.pptx')
    await pptx.writeFile({ fileName: outputPath })

    res.download(outputPath, 'slidenotes.pptx', () => {
      fs.unlinkSync(outputPath)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate PowerPoint' })
  }
})

app.post('/api/create-quiz', upload.single('file'), async (req, res) => {
  let tempFilePath

  try {
    let text = ''

    if (req.file) {
      tempFilePath = req.file.path
      text = await new Promise((resolve, reject) => {
        officeParser.parseOffice(tempFilePath, (data, err) => {
          if (err) reject(err)
          else resolve(data)
        })
      })
    } else {
      text = req.body.text || ''
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'Please provide PowerPoint content or notes text.' })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a quiz generator. Create 5 multiple-choice questions with four answer options each from the provided study content. Return only valid JSON in this format: [{"question": "...", "options": ["...", "...", "...", "..."], "answer": "...", "explanation": "..."}]. Do not include any extra text.'
        },
        {
          role: 'user',
          content: `Create a quiz from this content:\n\n${text}`
        }
      ]
    })

    const raw = completion.choices[0].message.content
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const quiz = JSON.parse(cleaned)

    res.json({ quiz })
  } catch (err) {
    console.error(err)
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }
    res.status(500).json({ error: 'Failed to generate quiz' })
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }
  }
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))