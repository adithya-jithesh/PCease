import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const vendorSchema = new mongoose.Schema({ name:String, price:Number, url:String, stock:Boolean }, { _id:false })
const componentSchema = new mongoose.Schema({ vendors:[vendorSchema] })
const Component = mongoose.model('Component', componentSchema)

async function main(){
  await mongoose.connect(process.env.MONGO_URI)
  const cursor = Component.find({ 'vendors.url': /computech\.in/ }).cursor()
  let count = 0
  for await (const doc of cursor){
    const vendors = (doc.vendors||[]).map(v => v?.url?.includes('computech.in') ? { ...v.toObject?.() ?? v, url: v.url.replace('computech.in','computechstore.in') } : v)
    await Component.updateOne({ _id: doc._id }, { $set: { vendors } })
    count++
  }
  console.log(`Updated ${count} components with new vendor domain`)
  await mongoose.disconnect()
}

main().catch(e=>{ console.error(e); process.exit(1) })
