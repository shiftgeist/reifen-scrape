import { HTMLDocument } from 'jsr:@b-fuze/deno-dom'
import { ResultEntry } from '../main.ts'

export abstract class BaseSupplier {
  base: string

  constructor(name: string) {
    this.base = name
  }

  protected parsePriceEuro(raw: string) {
    return Number(raw.trim().replace(' €', '').replace(',', '.'))
  }

  protected pre(ctx: string) {
    return `⛔️ [${ctx}] `
  }

  findNextLink(
    _html: HTMLDocument,
    _url: string
  ): string | undefined | null | Promise<string | undefined | null> {
    return null
  }

  abstract parsePage(html: HTMLDocument, url: string): Promise<ResultEntry[]>

  abstract validInputUrl(url: string): string

  abstract urlToID(url: string): string
}
