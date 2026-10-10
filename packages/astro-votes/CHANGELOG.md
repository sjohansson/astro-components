# @sjohansson/astro-votes

## 0.1.1

### Patch Changes

- d2b5bfa: Fix `astro-votes-sync` against Umami Cloud. It now sends the API key in the `x-umami-api-key` header Umami Cloud
  expects instead of as a bearer token, so requests to `api.umami.is` no longer fail with 401. Self-hosted instances
  still get `Authorization: Bearer`.

## 0.1.0

### Minor Changes

- d3ffc52: Add `@sjohansson/astro-votes`: like and dislike buttons for static Astro sites. Votes go to Umami (or any analytics
  tool) as events, `astro-votes-sync` writes the totals to a JSON file in CI, and the site shows them at build time.
