import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import fs from 'fs'

// __dirname shim for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from backend
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// Import Component model from server definitions (redefine schema locally to avoid requiring app)
import cors from 'cors' // harmless import to match dependencies
import express from 'express' // unused, but ensures consistency
import mongoosePkg from 'mongoose'

const vendorSchema = new mongoosePkg.Schema({
  name: String,
  price: Number,
  url: String,
  stock: Boolean
}, { _id: false })

const componentSchema = new mongoosePkg.Schema({
  id: { type: Number, index: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  brand: String,
  ramType: String,
  formFactor: String,
  cores: Number,
  memory: String,
  capacity: String,
  wattage: Number,
  vendors: [vendorSchema],
  specs: mongoosePkg.Schema.Types.Mixed
})
componentSchema.index({ category: 1, id: 1 }, { unique: true, sparse: true })

const Component = mongoosePkg.model('Component', componentSchema)

async function loadComponentsFromFrontEnd(){
  const jsPath = path.resolve(__dirname, '..', '..', 'src', 'shared', 'components-data.js')
  const jsonPath = path.resolve(__dirname, 'components-seed.json')
  try {
    // Prefer the original JS source if present
    const mod = await import(pathToFileURL(jsPath).href)
    const { componentsDB } = mod
    const docs = []
    for (const [category, items] of Object.entries(componentsDB)){
      for (const item of items){
        docs.push({
          id: item.id,
          category,
          name: item.name,
          brand: item.brand,
          ramType: item.ramType,
          formFactor: item.formFactor,
          cores: item.cores,
          memory: item.memory,
          capacity: item.capacity,
          wattage: item.wattage,
          vendors: item.vendors || []
        })
      }
    }
    return docs
  } catch (e) {
    // Fallback to JSON seed if available (read via fs for compatibility)
    try {
      if (!fs.existsSync(jsonPath)) throw new Error('no json')
      const raw = fs.readFileSync(jsonPath, 'utf-8')
      const seed = JSON.parse(raw)
      const docs = []
      for (const [category, items] of Object.entries(seed)){
        for (const item of items){
          docs.push({ ...item, category })
        }
      }
      return docs
    } catch (e2) {
      console.log('No seed file found (components-data.js or components-seed.json). Skipping seed.')
      return []
    }
  }
}

async function main(){
  if (!process.env.MONGO_URI){
    console.error('Missing MONGO_URI in backend/.env')
    process.exit(1)
  }
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  const docs = await loadComponentsFromFrontEnd()
  if (!docs.length){
    await mongoose.disconnect()
    return console.log('Nothing to seed.')
  }
  console.log(`Loaded ${docs.length} components from seed source`)

  // Upsert by (category,id)
  let upserts = 0
  for (const d of docs){
    await Component.updateOne({ category: d.category, id: d.id }, { $set: d }, { upsert: true })
    upserts++
  }
  console.log(`Upserted ${upserts} components`)
  await mongoose.disconnect()
  console.log('Done.')
}

main().catch(err=>{ console.error(err); process.exit(1) })
