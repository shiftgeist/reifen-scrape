# reifen-scrape

## Setup

1. Have [deno installed](https://docs.deno.com/runtime/getting_started/installation/)
2. Clone repository
3. Go to `https://www.reifendirekt.de/Motorradreifen.html - "Motorrad-Auswahl"`
4. Copy URL
5. Run reifen-scrape with URL`deno run --allow-net --allow-write main.ts "$URL"`

## Examples

```sh
deno run --allow-net --allow-write main.ts "https://www.reifendirekt.de/search-moto?manufacturer=SUZUKI&capacity=1200&model=GSF%201200%20%2F%20S%20(2001%20-%202005)&type=WVA9"
```

```sh
deno run --allow-net --allow-write main.ts "https://www.reifendirekt.de/search-moto?manufacturer=SUZUKI&capacity=400&model=DR-Z%20400%20SM%20(2005%20-%202008)&type=WVB8&brand="
```

## Supported providers

- [www.reifendirekt.de](https://www.reifendirekt.de)
