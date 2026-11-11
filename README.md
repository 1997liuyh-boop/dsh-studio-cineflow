# dsh-studio-cineflow

[简体中文](README.zh.md)

**Repository name:** `dsh-studio-cineflow`

**Repository description:** CineFlow studio for discovering films and shows, managing sources, resuming playback, and casting on a local network.

`dsh-studio-cineflow` adapts [CineFlow](https://github.com/incldue/CineFlow) as an independently installed DSH studio. It owns the embedded CineFlow page and bridge integration. The DSH worktable supplies the studio container; the external CineFlow service and its data remain separately managed.

## Features

- Browse recommendations and categorized libraries for films, series, and anime.
- Search by title, filter by region, type, date range, popularity, rating, and release order.
- Import, deduplicate, test, enable, and remove playback sources while retaining source metadata.
- Track playback history, resume from a saved position, and choose subtitles and quality when supported.
- Cast playback to compatible devices on the same local network.
- Show service, source, and playback failures from real state instead of replacing them with sample data.
- Keep embedded layouts usable in narrow windows, with internal scrolling for lists, details, and settings.

## Installation

This repository declares a DSH bundle at `package.json` → `dsh.bundle.patch`. Install with the DSH Desktop plugin manager. Add the control package first, then this exact tagged source:

```text
github:1997liuyh-boop/dsh-studio-library#v0.1.3
github:1997liuyh-boop/dsh-studio-cineflow#v0.2.8
```

Confirm that the plugin manager lists `dsh-studio-cineflow` version `0.2.2`, then open CineFlow. The package requires compatible `dsh-worktable` `^0.6.0` and `dsh-studio-projects` `^0.5.0`, supplied by the control package.

Windows development and service checks use Node.js 22 and npm:

```sh
npm install --include=dev --legacy-peer-deps
npm run build
npm run check
```

The Windows service launcher is `scripts/start.ps1` and requires PowerShell 7.4+. Electron is not bundled; provide `-ElectronPath` or `DSH_STUDIO_ELECTRON` for a local Electron executable. The shared-library builder can build this repository with `node scripts/build.mjs cineflow`.

## Requirements and limitations

TMDB credentials, source credentials, external media services, and casting devices are configured by the user. Without TMDB credentials, the studio uses its public-list mode and does not fabricate recommendations. Sources may expire or require authentication. Casting requires a compatible device on the same network. The plugin does not include streaming keys, automatically start broadcasting, or install the external Electron service and database.

## Sources and license

The application source is [incldue/CineFlow](https://github.com/incldue/CineFlow), commit `b32fd8a6ba43dcde4494b7487ebf5d949f65a306`, version `3.4.4`, MIT. Adaptations and the lock record are listed in [UPSTREAM.json](UPSTREAM.json), with third-party notices in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). This DSH adaptation is MIT licensed; see [LICENSE](LICENSE).
