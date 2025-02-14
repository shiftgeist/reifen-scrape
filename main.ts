import { DOMParser } from 'jsr:@b-fuze/deno-dom'
import { assert } from 'jsr:@std/assert'
import { DataItem, stringify } from 'jsr:@std/csv'
import { BaseSupplier, SupplierReifendirekt } from './providers/index.ts'

export type ResultEntry = {
  manufacturer: string
  name: string
  frontPrice: number
  backPrice: number
  setPrice: number
  frontLink: string
  backLink: string
  reportLink?: string | undefined | null
}

async function writeCsv(path: string, data: DataItem[]) {
  const keys: Array<keyof ResultEntry> = [
    'manufacturer',
    'name',
    'frontPrice',
    'frontLink',
    'backPrice',
    'backLink',
    'setPrice',
    'reportLink',
  ]

  const csv = stringify(data, {
    headers: true,
    separator: ',',
    columns: keys,
  })
  assert(csv.length > 0, 'CSV empty')
  assert(data.length > 0 && keys.length === Object.keys(data[0]).length, 'Column names missing')

  await Deno.writeTextFile(path, csv)
}

function selectSupplier(url: string) {
  if (url.includes('reifendirekt.de')) {
    return new SupplierReifendirekt()
  }

  throw Error('Supplier not supported')
}

export async function scrapePage(inputUrl: string, s?: BaseSupplier) {
  const pre = `⛔️ [${inputUrl}] `

  assert(inputUrl.length > 0, pre + `No input URL given`)
  console.log(`🤖 Scraping ${inputUrl}`)

  try {
    s = s ? s : selectSupplier(inputUrl)
    assert(s !== undefined, pre + 'Supplier undefined')
    const url = s.validInputUrl(inputUrl)
    const id = s.urlToID(inputUrl)

    const res = await fetch(url)
    const html = await res.text()
    assert(html.length > 0, pre + `HTML Length is 0`)

    const document = new DOMParser().parseFromString(html, 'text/html')

    const nextPageLink = await s.findNextLink(document, url)

    const results = await s.parsePage(document, url)

    await writeCsv(`${id}.csv`, results)

    if (!nextPageLink || (nextPageLink && nextPageLink.length < 2)) {
      console.log(`✅ Done ${inputUrl}`)
      return
    }

    await new Promise(res => setTimeout(res, 1000))

    await scrapePage(nextPageLink, s)
  } catch (error) {
    console.error(pre + error)
  }
}
