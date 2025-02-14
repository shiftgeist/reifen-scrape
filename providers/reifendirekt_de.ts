import { HTMLDocument } from 'jsr:@b-fuze/deno-dom'
import { ResultEntry } from '../main.ts'
import { assert } from 'jsr:@std/assert'
import { BaseSupplier } from './_base.ts'

export class SupplierReifendirekt extends BaseSupplier {
  constructor() {
    super('reifendirekt.de')
  }

  _parseManufacturer(link: string) {
    return link.split('/')[3]
  }

  override findNextLink(html: HTMLDocument, ctx: string): string | undefined | null {
    const pageLinks = html.querySelectorAll('.pageLink')
    assert(pageLinks.length > 0, this.pre(ctx) + `No page links found`)

    const pageLink = Array.from(pageLinks).find(link => link.innerText.trim() === '›')
    assert(pageLink !== undefined, this.pre(ctx) + `No page link found`)

    return pageLink?.getAttribute('href')
  }

  parsePage(html: HTMLDocument, ctx: string): Promise<ResultEntry[]> {
    const pre = this.pre(ctx)

    return new Promise(resolve => {
      const rows = Array.from(html.querySelectorAll('.tyre_row')).filter(
        el => !el.classList.contains('tyre_row_heading')
      )
      assert(rows.length > 0, pre + `No rows found`)

      const result = rows.map(row => {
        const resultEntry: ResultEntry = {} as ResultEntry

        const products = Array.from(row.querySelectorAll('.moto-tyre-subtitle a'))
        assert(products.length === 2, pre + `Did not find all products`)

        const names = products.map(el => el.innerText.trim())
        resultEntry.name = names[0] === names[1] ? names[0] : `${names[0]} / ${names[1]}`

        const links = products.map(p => p.getAttribute('href'))
        assert(
          links.filter(l => !!l && l.length > 0)?.length === 2,
          pre + `Not all links are valid`
        )
        const fullLinks = links.map(l => this.base + l)
        resultEntry.frontLink = fullLinks[0]
        resultEntry.backLink = fullLinks[1]

        const prices = Array.from(row.querySelectorAll('.moto-tyre-cart')).map(el =>
          this.parsePriceEuro(el.innerText)
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

        resultEntry.manufacturer = reportLink ? this._parseManufacturer(reportLink) : '?'

        const priceBundleRaw = row.querySelector('.moto-price-bundle')?.innerText
        assert(priceBundleRaw !== undefined, pre + `Bundle price not found`)
        const priceBundle = this.parsePriceEuro(priceBundleRaw)
        assert(typeof priceBundle === 'number', pre + `Bundle price is not number`)
        resultEntry.setPrice = priceBundle

        return resultEntry
      })

      resolve(result)
    })
  }

  validInputUrl(url: string) {
    assert(url.includes('manufacturer='), 'No manufacturer given')
    assert(url.includes('capacity='), 'No capacity given')
    assert(url.includes('model='), 'No model given')
    assert(url.includes('type='), 'No type given')

    return url.includes('itemsPerPage') ? url : url + '&itemsPerPage=50'
  }

  urlToID(url: string) {
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
}
