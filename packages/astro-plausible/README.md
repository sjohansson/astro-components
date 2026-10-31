# Astro Plausible

First-party [Plausible](https://plausible.io) analytics for Astro sites.

- The official Plausible tracker (the `@plausible-analytics/tracker` package) is bundled into your site's own
  JavaScript. There is no third-party script tag for a blocker to recognise.
- Events go to `/api/event` on your own domain. A small relay there forwards them to Plausible with the visitor's
  IP and user agent. Plausible drops events that arrive without a real visitor IP, so the relay is not optional.
- `astro-plausible init` writes that relay for Azure Static Web Apps. On other hosts it is a few lines around
  `createRelay()`.

## Installation

```bash
pnpm add @sjohansson/astro-plausible
```

## Usage

### 1. Add the integration

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import plausible from "@sjohansson/astro-plausible/integration";

export default defineConfig({
  integrations: [plausible({ domain: "example.com" })],
});
```

It adds one script to every page that starts the tracker. Options:

| Option                 | Default        | Notes                                                                     |
| ---------------------- | -------------- | ------------------------------------------------------------------------- |
| `domain`               |                | Required. The site domain as entered in Plausible.                        |
| `endpoint`             | `"/api/event"` | Where events go. Set `https://plausible.io/api/event` to skip the relay. |
| `enabled`              |                | Defaults to on for `astro build` and off for `astro dev`.                 |
| `autoCapturePageviews` | `true`         | Send a pageview on load and on history navigation.                        |
| `hashBasedRouting`     | `false`        | Track `#` paths as separate pages.                                        |
| `outboundLinks`        | `false`        | Track clicks on links to other sites.                                     |
| `fileDownloads`        | `false`        | `true` for Plausible's default file types, or `{ fileExtensions: [...] }`. |
| `formSubmissions`      | `false`        | Track form submissions.                                                   |
| `captureOnLocalhost`   | `false`        | Also track on localhost.                                                  |
| `logging`              | `true`         | Log ignored events to the console.                                        |
| `customProperties`     |                | Custom properties added to every event.                                   |
| `bindToWindow`         | `true`         | Expose `window.plausible`. Plausible's installation check looks for it.   |

### 2. Add the relay

#### Azure Static Web Apps

```bash
pnpm exec astro-plausible init --domain example.com
```

This writes `api/event/index.mjs` and `api/event/function.json`, plus `api/host.json` and `api/package.json` when
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
--domain <domain>    Site domain as entered in Plausible (or PLAUSIBLE_DOMAIN). Repeat it for several sites.
--upstream <url>     Plausible host, default https://plausible.io. Self-hosted: https://plausible.example.com
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
// src/pages/api/event.ts, an Astro server endpoint
import { createRelay } from "@sjohansson/astro-plausible/relay";
import type { APIRoute } from "astro";

export const prerender = false;

const relay = createRelay({ domain: "example.com" });

export const POST: APIRoute = ({ request, clientAddress }) => relay.handle(request, { clientIp: clientAddress });
```

```ts
// functions/api/event.ts, a Cloudflare Pages function
import { createRelay } from "@sjohansson/astro-plausible/relay";

const relay = createRelay({ domain: "example.com" });

export const onRequestPost = ({ request }) => relay.handle(request);
```

Relay options:

| Option          | Default                  | Notes                                                                     |
| --------------- | ------------------------ | ------------------------------------------------------------------------- |
| `domain`        |                          | Required. One domain or several. Events for other domains get a 400.      |
| `upstream`      | `"https://plausible.io"` | Events are posted to `<upstream>/api/event`.                              |
| `maxBodyLength` | `16384`                  | Largest request body accepted, in bytes.                                  |
| `events`        |                          | Validation for custom events, see below.                                  |
| `onError`       |                          | Called when Plausible cannot be reached. The response is a 502 either way. |

The relay answers 405 for anything but POST, 413 for a body over the limit, 400 for anything it will not forward,
and otherwise passes Plausible's status and body through. The visitor IP goes in `X-Forwarded-For`.

### Validating custom events

If you build anything on custom events, say vote counts, the relay can make sure only well-formed ones get through.
A rule lists the properties an event may carry and a pattern for each. Events with a rule are forwarded only with
those properties, each matching its pattern. Events without a rule pass through untouched.

```ts
import { voteRelayRule } from "@sjohansson/astro-votes";

const relay = createRelay({
  domain: "example.com",
  events: {
    ...voteRelayRule(),
    signup: { plan: /^(free|pro)$/ },
  },
});
```

The same for the CLI:

```bash
pnpm exec astro-plausible init --domain example.com \
  --rule "vote:vote=^[A-Za-z0-9._/-]{1,200}:(?:up|down)(?:-undo)?$" \
  --rule "signup:plan=^(free|pro)$"
```

### Tracking events

`window.plausible("signup")` works as in any Plausible setup. The typed way is the tracker's own `track`:

```ts
import { track } from "@sjohansson/astro-plausible/client";

track("signup", { props: { plan: "pro" } });
```

### Without the integration

Start the tracker yourself when you want a function for `customProperties`, a `transformRequest` hook, or control
over where it runs.

```ts
import { startPlausible } from "@sjohansson/astro-plausible/client";

startPlausible({
  domain: "example.com",
  transformRequest: (payload) => (payload.u.includes("/admin") ? null : payload),
});
```

The first call wins; later calls do nothing. The tracker itself allows a single `init()`.

### A path other than `/api/event`

Set `endpoint` to wherever the relay answers, for example `/stats/api/event`. Static Web Apps managed functions
always live under `/api`; a rewrite from another path to `/api/event` in `staticwebapp.config.json` may do it, but
that is untested and the Static Web Apps documentation says route rules for the API only support redirects and
roles.

### Local development

The integration leaves the tracker out of `astro dev`, and the tracker ignores localhost unless
`captureOnLocalhost` is set. To test the whole chain locally, set both and run the site through something that
serves the relay too, such as the Static Web Apps CLI.

## Keeping the tracker current

The tracker is a normal dependency, so Renovate or a routine upgrade brings new Plausible releases to your site.
Nothing is vendored.

## License

MIT
