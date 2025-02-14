import { assert } from 'jsr:@std/assert'
import { scrapePage } from './main.ts'

function validInput(url: string) {
  assert(url.includes('manufacturer='), 'No manufacturer given')
  assert(url.includes('capacity='), 'No capacity given')
  assert(url.includes('model='), 'No model given')
  assert(url.includes('type='), 'No type given')

  return url
}

if (!Deno.args[0]) {
  console.log(
    'Goto https://www.reifendirekt.de/Motorradreifen.html - "Motorrad-Auswahl", enter your bike and paste the search link (see README.md)'
  )
}

await scrapePage(validInput(Deno.args[0]))
