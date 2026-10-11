# Astro Votes

Like and dislike buttons for static Astro sites, with no database and no backend of your own.

- A click is sent to your analytics tool as a custom event (Umami built in, anything else through a callback).
- A scheduled CI job runs `astro-votes-sync`, which pulls the totals from the analytics API and writes one JSON file.
- The site reads that file at build time. Counts refresh with every build.

The visitor's own vote is kept in `localStorage` and shown straight away, on top of the built counts, until a sync
includes it. It is an honour system: a determined visitor can vote twice by clearing storage. That is the trade for
having no server state.

## Installation

```bash
pnpm add @sjohansson/astro-votes
```

## Usage

### 1. Add the integration

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import votes from "@sjohansson/astro-votes/integration";

export default defineConfig({
  integrations: [votes({ transport: "umami" })],
});
```

It registers `<vote-buttons>` on every page and sets the transport. Options:

| Option      | Default   | Notes                                                              |
| ----------- | --------- | ------------------------------------------------------------------ |
| `transport` | `"umami"` | `"umami"` calls `window.umami.track`. `"none"` sends nothing.      |
| `eventName` | `"vote"`  | Analytics event name. Must match `--event` on the sync.            |

### 2. Commit an empty data file

```json
{ "updated": null, "items": {} }
```

Save it as `src/data/votes.json`. Builds work without an API key; unknown items show 0.

### 3. Render the buttons

```astro
---
import { voteAttributes, voteButtonsHTML } from "@sjohansson/astro-votes";
import votes from "../data/votes.json";

const attrs = voteAttributes(votes, post.data.slug);
---

<vote-buttons {...attrs} set:html={voteButtonsHTML(attrs)}></vote-buttons>
```

`set:html` is optional. It renders the buttons into the static HTML so nothing shifts when the element upgrades.

Attributes:

| Attribute     | Notes                                                          |
| ------------- | -------------------------------------------------------------- |
| `item`        | Id of the thing being voted on. `[A-Za-z0-9._/-]`, max 200.    |
| `up`, `down`  | Counts from the data file.                                     |
| `synced-at`   | `updated` from the data file. Stops a vote being counted twice. |
| `event-name`  | Overrides the page-wide event name.                            |
| `label-up`, `label-down`, `group-label` | Accessible labels. Defaults `Like`, `Dislike`, `Rate this page`. |

### 4. Sync the counts on a schedule

Create an API key in Umami Cloud (Settings, API keys), or use a bearer token on a self-hosted instance. Store it as
the `UMAMI_API_KEY` repository secret.

```yaml
# .github/workflows/sync-votes.yml
name: Sync votes

on:
  schedule:
    - cron: "30 18 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec astro-votes-sync --website "$UMAMI_WEBSITE_ID"
        env:
          UMAMI_API_KEY: ${{ secrets.UMAMI_API_KEY }}
          UMAMI_WEBSITE_ID: your-website-id
      - name: Commit if changed
        run: |
          git diff --quiet -- src/data/votes.json && exit 0
          git config user.name "github-actions[bot]"
          git config user.email "41898283+github-actions[bot]@users.noreply.github.com"
          git commit -m "chore: sync votes" -- src/data/votes.json
          git push
```

A push made with `GITHUB_TOKEN` does not start other workflows. Schedule your deploy after the sync, or deploy from
this workflow.

CLI options:

```text
--website <id>     Umami website id (or UMAMI_WEBSITE_ID)
--api-url <url>    API base (or UMAMI_API_URL), default https://api.umami.is/v1
                   Self-hosted: https://<host>/api
--event <name>     Event name, default "vote"
--property <name>  Event property, default "vote"
--since <date>     Count votes from this date, default 2020-01-01
--out <path>       Output file, default src/data/votes.json
--dry-run          Print the result instead of writing it
```

Umami returns at most 100 rows per query, so the sync splits the time range in half until every part fits. Results
stay exact however many items you have.

## Wire format

Each change is one or more events named `vote` with a single property `vote` whose value is `<item>:<op>`. There are
four ops, `up`, `up-undo`, `down`, and `down-undo`, and six possible changes:

| Change          | Ops sent          |
| --------------- | ----------------- |
| none to like    | `up`              |
| none to dislike | `down`            |
| like to none    | `up-undo`         |
| dislike to none | `down-undo`       |
| like to dislike | `up-undo`, `down` |
| dislike to like | `down-undo`, `up` |

Totals are `up - up-undo` and `down - down-undo`, never below zero. Every toggle sends a balanced pair over time, so
click spam nets out.

If you relay analytics through your own endpoint, validate vote events there with the exported pattern:

```js
import { VOTE_VALUE_PATTERN } from "@sjohansson/astro-votes";

if (payload.name === "vote" && !VOTE_VALUE_PATTERN.test(payload.data?.vote ?? "")) reject();
```

## Other analytics tools

Set the transport to `"none"` and send the events yourself, or pass a function:

```js
import { configureVotes } from "@sjohansson/astro-votes";

configureVotes({
  transport: ({ eventName, value }) => window.plausible?.(eventName, { props: { vote: value } }),
});
```

Every change also fires a bubbling `vote-change` event with `{ item, from, to, ops }`. The sync CLI only reads from
Umami today; for another provider, build the file with `fold()` and `writeVoteData()` from
`@sjohansson/astro-votes/sync`.

## Styling

Light DOM, so your CSS applies directly. The built-in styles sit inside `:where()` and read these custom properties:

```css
vote-buttons {
  --votes-gap: 0.5rem;
  --votes-fg: currentColor;
  --votes-bg: transparent;
  --votes-border: currentColor;
  --votes-accent: currentColor; /* pressed background */
  --votes-accent-fg: Canvas; /* pressed text */
  --votes-radius: 999px;
  --votes-focus: currentColor;
}
```

Class hooks: `.vote-buttons`, `.vote-buttons__button`, `.vote-buttons__count`, `.vote-buttons__label` (visually
hidden), `[aria-pressed="true"]`.

## License

MIT
