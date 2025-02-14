import { scrapePage } from './main.ts'

await Promise.all(
  [
    'https://www.reifendirekt.de/search-moto?manufacturer=SUZUKI&capacity=1200&model=GSF%201200%20%2F%20S%20(2001%20-%202005)&type=WVA9',
    'https://www.reifendirekt.de/search-moto?manufacturer=SUZUKI&capacity=400&model=DR-Z%20400%20SM%20(2005%20-%202008)&type=WVB8&brand=',
    'https://www.reifendirekt.de/search-moto?manufacturer=SUZUKI&capacity=650&model=SV+650+%282023+-+%29&type=WCX0',
    'https://www.reifendirekt.de/search-moto?manufacturer=HUSQVARNA&capacity=690&model=701+Supermoto+%282016+-+%29&type=A',
    'https://www.reifendirekt.de/search-moto?manufacturer=SUZUKI&capacity=600&model=GSF+600+%282000+-+2004%29&type=WVA8',
  ].map(url => scrapePage(url))
)
