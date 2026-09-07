# @trylinky/tinybird

Tinybird project (Forward) for Linky analytics, plus the browser tracking client.

## Layout

- `project/datasources/` – landing data source (`analytics_events`) and the aggregating materialized-view targets
- `project/materializations/` – materialized pipes that feed the `*_mv` data sources
- `project/endpoints/` – published API endpoints consumed by `apps/api` (`page_analytics_stats`, `page_analytics_locations`, ...)
- `browser/` – the `tracker.js` client, built with `pnpm build:tracker` and copied into `apps/frontend/public/assets`

## Working with the Tinybird project

Uses the Tinybird Forward CLI (`tb`, install with `curl https://tinybird.co | sh`). Run all commands from this directory; `tinybird.config.json` points the CLI at `project/`, which must stay free of `.ts` files or the CLI will treat the package as a TypeScript SDK project.

```sh
tb login --host https://api.us-west-2.aws.tinybird.co   # writes a gitignored .tinyb here
tb build                                                 # validate against Tinybird Local
tb --cloud deploy --check                                # dry-run against the cloud workspace
tb --cloud deploy                                        # deploy
```

The cloud workspace is `linky_production` in `us-west-2`. Endpoint URLs and the `tracker` / `dashboard` tokens are unchanged from Tinybird Classic.
