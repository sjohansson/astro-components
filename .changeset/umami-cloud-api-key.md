---
"@sjohansson/astro-votes": patch
---

Fix `astro-votes-sync` against Umami Cloud. It now sends the API key in the `x-umami-api-key` header Umami Cloud
expects instead of as a bearer token, so requests to `api.umami.is` no longer fail with 401. Self-hosted instances
still get `Authorization: Bearer`.
