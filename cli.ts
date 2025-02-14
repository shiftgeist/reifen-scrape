import { scrapePage } from './main.ts'

const url = Deno.args[0]?.trim()

if (!url) {
  console.log(
    'Goto (for example) https://www.reifendirekt.de/Motorradreifen.html - "Motorrad-Auswahl", enter your bike and paste the search link (see README.md)'
  )
}

await scrapePage(url)
