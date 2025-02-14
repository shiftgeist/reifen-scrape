import { DOMParser, HTMLDocument } from 'jsr:@b-fuze/deno-dom'
import { assert } from 'jsr:@std/assert'
import { DataItem, stringify } from 'jsr:@std/csv'

const base = 'https://www.reifendirekt.de'

type ResultEntry = {
  manufacturer: string
  name: string
  frontPrice: number
  backPrice: number
  setPrice: number
  frontLink: string
  backLink: string
  reportLink?: string | undefined | null
}

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

const results: Array<ResultEntry> = []

async function writeCsv(path: string, data: DataItem[]) {
  const csv = stringify(data, {
    headers: true,
    separator: ',',
    columns: keys,
  })
  assert(csv.length > 0, 'CSV empty')
  assert(data.length > 0 && keys.length === Object.keys(data[0]).length, 'Column names missing')

  await Deno.writeTextFile(path, csv)
}

function parsePrice(raw: string) {
  return Number(raw.trim().replace(' €', '').replace(',', '.'))
}

function parseManufacturer(link: string) {
  return link.split('/')[3]
}

function parsePage(html: HTMLDocument, context: string) {
  const pre = `⛔️ [${context}] `

  return new Promise(resolve => {
    const rows = Array.from(html.querySelectorAll('.tyre_row')).filter(
      el => !el.classList.contains('tyre_row_heading')
    )
    assert(rows.length > 0, pre + `No rows found`)

    rows.forEach(row => {
      const resultEntry: ResultEntry = {} as ResultEntry

      const products = Array.from(row.querySelectorAll('.moto-tyre-subtitle a'))
      assert(products.length === 2, pre + `Did not find all products`)

      const names = products.map(el => el.innerText.trim())
      resultEntry.name = names[0] === names[1] ? names[0] : `${names[0]} / ${names[1]}`

      const links = products.map(p => p.getAttribute('href'))
      assert(links.filter(l => !!l && l.length > 0)?.length === 2, pre + `Not all links are valid`)
      const fullLinks = links.map(l => base + l)
      resultEntry.frontLink = fullLinks[0]
      resultEntry.backLink = fullLinks[1]

      const prices = Array.from(row.querySelectorAll('.moto-tyre-cart')).map(el =>
        parsePrice(el.innerText)
      )
      assert(prices.length === 2, pre + `Did not find both prices`)
      assert(typeof prices[0] === 'number', pre + `First price not a number (${prices[0]})`)
      assert(typeof prices[1] === 'number', pre + `Second price not a number (${prices[1]})`)
      resultEntry.frontPrice = prices[0]
      resultEntry.backPrice = prices[1]

      const reportLink = row
        .querySelector('.moto-tyre-result.moto-tyre-report a')
        ?.getAttribute('href')
      resultEntry.reportLink = reportLink

      resultEntry.manufacturer = reportLink ? parseManufacturer(reportLink) : '?'

      const priceBundleRaw = row.querySelector('.moto-price-bundle')?.innerText
      assert(priceBundleRaw !== undefined, pre + `Bundle price not found`)
      const priceBundle = parsePrice(priceBundleRaw)
      assert(typeof priceBundle === 'number', pre + `Bundle price is not number`)
      resultEntry.setPrice = priceBundle

      results.push(resultEntry)
    })

    resolve(true)
  })
}

function parseUrl(url: string) {
  return url.includes('itemsPerPage') ? url : url + '&itemsPerPage=50'
}

function parseSearchURLToID(url: string) {
  const queryKeys = ['manufacturer', 'model', 'type']
  const searchURL = new URL(url)

  return queryKeys
    .map(key =>
      searchURL.searchParams
        .get(key)
        ?.replace(/[\ \(\)\/]/g, '_')
        .replace(/[_-]+/g, '_')
        .trim()
    )
    .concat(new Date().toISOString().slice(0, 10))
    .join('-')
}

export async function scrapePage(inputUrl: string) {
  const pre = `⛔️ [${inputUrl}] `

  assert(inputUrl.length > 0, pre + `No input URL given`)
  console.log(`🤖 Scraping ${inputUrl}`)

  try {
    const url = parseUrl(inputUrl)
    const id = parseSearchURLToID(inputUrl)

    const res = await fetch(url)
    const html = await res.text()
    assert(html.length > 0, pre + `HTML Length is 0`)

    const document = new DOMParser().parseFromString(html, 'text/html')

    const pageLinks = document.querySelectorAll('.pageLink')
    assert(pageLinks.length > 0, pre + `No page links found`)

    const pageLink = Array.from(pageLinks).find(link => link.innerText.trim() === '›')
    assert(pageLink !== undefined, pre + `No page link found`)

    const nextPageLink = pageLink?.getAttribute('href')

    await parsePage(document, url)

    await writeCsv(`${id}.csv`, results)

    if (!nextPageLink || (nextPageLink && nextPageLink.length < 2)) {
      console.log(`✅ Done`)
      return
    }

    await new Promise(res => setTimeout(res, 1000))

    assert(!!nextPageLink)
    await scrapePage(nextPageLink)
  } catch (error) {
    console.error(pre + error)
  }
}
