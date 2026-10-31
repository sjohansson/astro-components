# Astro Umami

First-party [Umami](https://umami.is) analytics for Astro sites.

- The Umami tracker is bundled into your site's own JavaScript. There is no third-party script tag for a blocker
  to recognise.
- Events go to `/api/send` on your own domain. A small relay there forwards them to Umami with the visitor's IP and
  user agent, so the dashboard shows real visitors rather than the relay.
- `astro-umami init` writes that relay for Azure Static Web Apps. On other hosts it is a few lines around
  `createRelay()`.

## Installation

```bash
pnpm add @sjohansson/astro-umami
```

## Usage

### 1. Add the integration

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import umami from "@sjohansson/astro-umami/integration";

export default defineConfig({
  integrations: [umami({ websiteId: "930ef364-ec51-4ca5-b5af-2b09ca6a0a21" })],
});
```

It adds one script to every page that starts the tracker. Options:

| Option          | Default | Notes                                                                           |
| --------------- | ------- | ------------------------------------------------------------------------------- |
| `websiteId`     |         | Required. The website id from the Umami dashboard.                              |
| `hostUrl`       | `"/"`   | The tracker posts to `<hostUrl>/api/send`. `/` is the relay on your own domain. |
| `enabled`       |         | Defaults to on for `astro build` and off for `astro dev`.                       |
| `autoTrack`     | `true`  | Track pageviews and `data-umami-event` clicks automatically.                    |
| `domains`       |         | Only track on these hostnames.                                                  |
| `excludeSearch` | `false` | Leave the query string out of tracked URLs.                                     |
| `excludeHash`   | `false` | Leave the hash out of tracked URLs.                                             |
| `doNotTrack`    | `false` | Respect the browser's Do Not Track setting.                                     |
| `tag`           |         | A tag sent with every event.                                                    |

### 2. Add the relay

#### Azure Static Web Apps

```bash
pnpm exec astro-umami init --website-id 930ef364-ec51-4ca5-b5af-2b09ca6a0a21
```

This writes `api/send/index.mjs` and `api/send/function.json`, plus `api/host.json` and `api/package.json` when
they are missing. The function is one file with no imports, so the `api/` folder has no dependencies and the deploy
can skip the API build. Commit the files. Re-run the command after upgrading the package; it rewrites the function
and leaves the other files alone.

Deploy settings:

```json
// public/staticwebapp.config.json
{ "platform": { "apiRuntime": "node:22" } }
```

```yaml
# The deploy step
- uses: Azure/static-web-apps-deploy@v1
  with:
    app_location: "dist"
    api_location: "api"
    skip_app_build: true
    skip_api_build: true
```

CLI options:

```text
--target <name>      Hosting target. "swa" is the only one today.
--website-id <id>    Umami website id (or UMAMI_WEBSITE_ID). Repeat it for several sites.
--upstream <url>     Umami host, default https://gateway.umami.is. Self-hosted: https://umami.example.com
--dir <path>         API folder, default "api"
--rule <spec>        Validate a custom event: <event>:<property>=<regex>. Repeatable.
--max-body <bytes>   Reject bodies larger than this, default 16384
--dry-run            Print the files instead of writing them
```

#### Other hosts

The relay works on the web standard `Request` and `Response`. Give it the visitor IP when the platform provides one;
otherwise it reads the usual headers (`x-azure-clientip`, `cf-connecting-ip`, `x-real-ip`, `x-forwarded-for`, and
so on).

```ts
// src/pages/api/send.ts, an Astro server endpoint
import { createRelay } from "@sjohansson/astro-umami/relay";
import type { APIRoute } from "astro";

export const prerender = false;

const relay = createRelay({ websiteId: "930ef364-ec51-4ca5-b5af-2b09ca6a0a21" });

export const POST: APIRoute = ({ request, clientAddress }) => relay.handle(request, { clientIp: clientAddress });
```

```ts
// functions/api/send.ts, a Cloudflare Pages function
import { createRelay } from "@sjohansson/astro-umami/relay";

const relay = createRelay({ websiteId: "930ef364-ec51-4ca5-b5af-2b09ca6a0a21" });

export const onRequestPost = ({ request }) => relay.handle(request);
```

Relay options:

| Option          | Default                      | Notes                                                                 |
| --------------- | ---------------------------- | --------------------------------------------------------------------- |
| `websiteId`     |                              | Required. One id or several. Events for other ids get a 400.          |
| `upstream`      | `"https://gateway.umami.is"` | Events are posted to `<upstream>/api/send`.                            |
| `maxBodyLength` | `16384`                      | Largest request body accepted, in bytes.                              |
| `events`        |                              | Validation for custom events, see below.                              |
| `onError`       |                              | Called when Umami cannot be reached. The response is a 502 either way. |

The relay answers 405 for anything but POST, 413 for a body over the limit, 400 for anything it will not forward,
and otherwise passes Umami's status and body through. An `ip` sent by the browser is always dropped.

### Validating custom events

If you build anything on custom events, say vote counts, the relay can make sure only well-formed ones get through.
A rule lists the properties an event may carry and a pattern for each. Events with a rule are forwarded only with
those properties, each matching its pattern. Events without a rule pass through untouched.

```ts
import { voteRelayRule } from "@sjohansson/astro-votes";

const relay = createRelay({
  websiteId: "930ef364-ec51-4ca5-b5af-2b09ca6a0a21",
  events: {
    ...voteRelayRule(),
    signup: { plan: /^(free|pro)$/ },
  },
});
```

The same for the CLI:

```bash
pnpm exec astro-umami init --website-id <id> \
  --rule "vote:vote=^[A-Za-z0-9._/-]{1,200}:(?:up|down)(?:-undo)?$" \
  --rule "signup:plan=^(free|pro)$"
```

### Tracking events

Everything Umami offers works as usual: `data-umami-event` attributes, and `window.umami.track()` for anything
else. `getUmami()` is the typed way to the same object.

```ts
import { getUmami } from "@sjohansson/astro-umami/client";

getUmami()?.track("signup", { plan: "pro" });
```

### Without the integration

Start the tracker yourself when you want a `beforeSend` hook or control over where it runs.

```ts
import { startUmami } from "@sjohansson/astro-umami/client";

startUmami({
  websiteId: "930ef364-ec51-4ca5-b5af-2b09ca6a0a21",
  beforeSend: (type, payload) => (payload.url?.startsWith("/admin") ? null : payload),
});
```

The first call wins; later calls do nothing.

### A path other than `/api/send`

The tracker always posts to `<hostUrl>/api/send`, so with `hostUrl: "/stats"` the relay has to answer at
`/stats/api/send`. On most hosts that is only a matter of where you put the endpoint. Static Web Apps managed
functions always live under `/api`; a rewrite from `/stats/api/send` to `/api/send` in `staticwebapp.config.json`
may do it, but that is untested and the Static Web Apps documentation says route rules for the API only support
redirects and roles.

### Local development

The integration leaves the tracker out of `astro dev`. To test the whole chain locally, set `enabled: true` and run
the site through something that serves the relay too, such as the Static Web Apps CLI.

## Keeping the tracker current

The package carries a byte-for-byte copy of the Umami Cloud tracker in `vendor/umami.js`. A daily workflow in the
package repository compares it with upstream and opens a pull request when it changes; merging releases a patch, so
Renovate or a routine upgrade brings it to your site. Umami is MIT licensed; the notice is in `vendor/README.md`.

## License

MIT
