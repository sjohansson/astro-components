#!/usr/bin/env node
/**
 * astro-votes-sync - pulls vote totals from Umami and writes the data file.
 *
 * Reads the API key from UMAMI_API_KEY only, so it never shows up in a
 * command line or CI log.
 */
import { parseArgs } from "node:util";
import { buildVoteData, fetchUmamiValues, fold, readVoteData, sameItems, writeVoteData } from "./sync";
import { DEFAULT_EVENT_NAME, DEFAULT_PROPERTY_NAME } from "./wire";

const HELP = `Usage: astro-votes-sync [options]

Pulls vote totals from Umami and writes them to a JSON file for the site build.

Options:
  --website <id>     Umami website id (or UMAMI_WEBSITE_ID)
  --api-url <url>    API base (or UMAMI_API_URL), default https://api.umami.is/v1
                     Self-hosted: https://<host>/api
  --event <name>     Event name, default "${DEFAULT_EVENT_NAME}"
  --property <name>  Event property, default "${DEFAULT_PROPERTY_NAME}"
  --since <date>     Count votes from this date, default 2020-01-01
  --out <path>       Output file, default src/data/votes.json
  --dry-run          Print the result instead of writing it
  -h, --help         Show this help

Environment:
  UMAMI_API_KEY      Umami Cloud API key or self-hosted bearer token (required)
`;

export async function main(argv: string[], env: Record<string, string | undefined>): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      website: { type: "string" },
      "api-url": { type: "string" },
      event: { type: "string" },
      property: { type: "string" },
      since: { type: "string" },
      out: { type: "string" },
      "dry-run": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    process.stdout.write(HELP);
    return 0;
  }

  const apiKey = env["UMAMI_API_KEY"];
  const websiteId = values.website ?? env["UMAMI_WEBSITE_ID"];
  const apiUrl = values["api-url"] ?? env["UMAMI_API_URL"] ?? "https://api.umami.is/v1";
  const out = values.out ?? "src/data/votes.json";
  const startAt = Date.parse(values.since ?? "2020-01-01");

  if (!apiKey) return fail("UMAMI_API_KEY is not set.");
  if (!websiteId) return fail("No website id. Pass --website or set UMAMI_WEBSITE_ID.");
  if (Number.isNaN(startAt)) return fail(`--since is not a date: ${values.since}`);

  const now = new Date();
  const rows = await fetchUmamiValues({
    apiUrl,
    apiKey,
    websiteId,
    eventName: values.event ?? DEFAULT_EVENT_NAME,
    propertyName: values.property ?? DEFAULT_PROPERTY_NAME,
    startAt,
    endAt: now.getTime(),
  });
  const data = buildVoteData(fold(rows), now);
  const count = Object.keys(data.items).length;

  if (values["dry-run"]) {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
    return 0;
  }

  // Leave the file alone when nothing changed, so a scheduled job does not commit a new timestamp every run.
  const previous = await readVoteData(out);
  if (previous && sameItems(previous.items, data.items)) {
    process.stdout.write(`No vote changes, ${out} left as is\n`);
    return 0;
  }

  await writeVoteData(out, data);
  process.stdout.write(`Wrote votes for ${count} item(s) to ${out}\n`);
  return 0;
}

function fail(message: string): number {
  process.stderr.write(`astro-votes-sync: ${message}\n`);
  return 1;
}

main(process.argv.slice(2), process.env).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.exitCode = fail(error instanceof Error ? error.message : String(error));
  },
);
