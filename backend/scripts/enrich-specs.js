import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const vendorSchema = new mongoose.Schema({ name:String, price:Number, url:String, stock:Boolean }, { _id:false })
const componentSchema = new mongoose.Schema({
  id: Number,
  category: String,
  name: String,
  brand: String,
  ramType: String,
  formFactor: String,
  cores: Number,
  memory: String,
  capacity: String,
  wattage: Number,
  vendors: [vendorSchema],
  specs: mongoose.Schema.Types.Mixed
})
const Component = mongoose.model('Component', componentSchema)

function parseSpecs(category, item){
  const n = (item.name||'').toLowerCase()
  const specs = {...item.specs}
  const grab = (re) => { const m = n.match(re); return m ? m[1] : undefined }

  try{
    switch(category){
      case 'cpu': {
  specs.cores = (item.cores ?? Number(grab(/(\d+)\s*(?:core|c)\b/))) || undefined
        specs.threads = Number(grab(/(\d+)\s*(?:thread|t)\b/)) || undefined
        const ghz = grab(/(\d+(?:\.\d+)?)\s*ghz/)
        if (ghz) specs.baseClock = parseFloat(ghz)
        if (item.wattage) specs.tdp = item.wattage
        specs.socket = item.socket || grab(/(am4|am5|lga\d{3,4})/)
        break
      }
      case 'gpu': {
        specs.vram = grab(/(\d+(?:\.\d+)?)\s*(?:gb|gib)\b/)
        const mhz = grab(/(\d{3,4})\s*mhz/)
        if (mhz) specs.clock = parseInt(mhz)
        break
      }
      case 'ram': {
        specs.type = item.ramType || grab(/(ddr3|ddr4|ddr5)/)
        specs.speedMHz = parseInt(grab(/(\d{3,5})\s*mhz/)) || parseInt(grab(/ddr\d-?(\d{3,5})/)) || undefined
        specs.capacity = item.memory || grab(/(\d+\s*(?:gb|gib|mb))/)
        specs.kit = grab(/(\d)\s*x\s*\d+\s*gb/)
        break
      }
      case 'storage': {
        specs.capacity = item.capacity || grab(/(\d+(?:\.\d+)?\s*(?:tb|gb))/)
        specs.type = grab(/(nvme|ssd|hdd|sata)/) || 'ssd'
        specs.interface = grab(/(sata\s*iii|pcie\s*\d(?:\.\d)?\s*x?\d*)/)
        break
      }
      case 'motherboard': {
        specs.formFactor = item.formFactor || grab(/(atx|micro-?atx|mini-?itx)/)
        specs.socket = item.socket || grab(/(am4|am5|lga\d{3,4})/)
        specs.chipset = grab(/(b\d{3}|x\d{3}|z\d{3}|h\d{3}|a\d{3})/)
        specs.memoryType = item.ramType || grab(/(ddr3|ddr4|ddr5)/)
        break
      }
      case 'psu': {
        specs.wattage = item.wattage || parseInt(grab(/(\d{3,4})\s*w/))
        specs.efficiency = grab(/(80\+\s*(?:bronze|silver|gold|platinum|titanium))/)
        specs.modular = /modular|semi-modular/.test(n) ? true : undefined
        break
      }
      case 'pcCase': {
        specs.formFactor = item.formFactor || grab(/(atx|micro-?atx|mini-?itx)/)
        const inch = grab(/(\d{2})(?:"|\s*-?inch)/)
        if (inch) specs.sizeInches = parseInt(inch)
        break
      }
      case 'monitor': {
        specs.sizeInches = parseInt(grab(/(\d{2})(?:"|\s*-?inch)/)) || undefined
        specs.refreshHz = parseInt(grab(/(\d{2,3})\s*hz/)) || undefined
        const res = grab(/(\d{3,4}x\d{3,4})/)
        if (res) specs.resolution = res
        break
      }
    }
  }catch{}

  // Remove empty/undefined keys
  Object.keys(specs||{}).forEach(k=> specs[k]===undefined && delete specs[k])
  return specs
}

async function main(){
  await mongoose.connect(process.env.MONGO_URI)
  const list = await Component.find({}).lean()
  let updated = 0
  for (const doc of list){
    const specs = parseSpecs(doc.category, doc)
    const changed = JSON.stringify(specs||{}) !== JSON.stringify(doc.specs||{})
    if (changed){
      await Component.updateOne({ _id: doc._id }, { $set: { specs } })
      updated++
    }
  }
  console.log(`Enriched specs for ${updated} components`)
  await mongoose.disconnect()
}

main().catch(e=>{ console.error(e); process.exit(1) })
