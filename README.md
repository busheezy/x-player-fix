# X Player Fix

**The main purpose of this Firefox extension is to fix X/Twitter's video-slider drag drift, particularly noticeable with high-refresh-rate setups and fast mouse movements.** The slider thumb can lag behind the cursor or lose alignment while scrubbing.

It keeps X's own video player and controls. It does not replace them with Firefox's native player or change how X manages volume, mute, autoplay, captions, or streaming. A thin cyan outline indicates that the extension is loaded; there is no overlay badge.

**Hold-to-2× playback is just an extra I added because I like it.** It is a convenience feature, separate from the slider fix.

## Why the slider drifts

[Mozilla bug 1815596](https://bugzilla.mozilla.org/show_bug.cgi?id=1815596#c9) documents X's gesture code skipping movement updates when consecutive mouse events have the same timestamp. That can lose part of the accumulated drag distance. [Bug 1979725](https://bugzilla.mozilla.org/show_bug.cgi?id=1979725) tracks the related Firefox event-timestamp behavior.

High refresh rate is the motivation for this project, not a claim that every high-refresh display is affected. The workaround targets duplicate or decreasing event timestamps, not a particular monitor refresh rate, DPI, or browser zoom setting.

During a left-mouse drag on a video slider, the extension makes those timestamps strictly increasing before X reads them. Normally increasing timestamps are unchanged. The original event, pointer coordinates, and trusted status are preserved; the slider workaround does not cancel input, generate replacement events, or modify media properties.

Thumb clicks and track clicks within a single-slider wrapper are supported. Detection stays inside X's video-player container and avoids wrappers containing unrelated controls. Keyboard and touch slider interactions remain X's responsibility.

## Hold for 2× speed

Hold the left mouse button on a playing video's surface for 350 milliseconds to temporarily use 2× speed. Release to restore the previous playback rate. Short clicks retain X's normal behavior; the release click after an activated hold is suppressed so it does not pause the video.

Buttons and sliders are excluded. Moving more than eight pixels before activation cancels the hold. Leaving the player, scrolling, switching tabs, losing focus, pausing, or unloading the video also ends it. The feature does not start paused videos or save a speed preference. A different speed selected during the hold is preserved on release.

## Install

Requires Firefox 142 or newer. A signed Mozilla release is not available yet.

For temporary installation:

1. Build the project using the commands below.
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on** and choose `dist/manifest.json`.
4. Reload your X/Twitter tabs.

After rebuilding, reload the extension in `about:debugging` and reload the page. Temporary installations last until Firefox closes. Regular Firefox requires a Mozilla-signed package for permanent installation; renaming the unsigned ZIP does not sign it.

## Build

The release build was produced on Windows with Node.js **24.16.0** and npm **11.13.0**. Install [Node.js](https://nodejs.org/en/download), which includes npm. Build-tool versions are locked in `package-lock.json`; the scripts use Node APIs rather than platform-specific shell commands.

```sh
npm ci
npm run build
```

`dist/` contains the complete extension: `manifest.json`, `content.js`, and `content.css`. Each build clears that directory first. esbuild bundles the TypeScript without minification; there are no runtime third-party dependencies or downloaded scripts.

Other commands:

| Command           | Purpose                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| `npm run check`   | Check Oxfmt formatting, Oxlint, TypeScript, build, and Firefox manifest validation |
| `npm run format`  | Format with Oxfmt                                                                  |
| `npm run dev`     | Watch TypeScript and CSS; restart after manifest changes                           |
| `npm start`       | Open a separate Firefox development profile                                        |
| `npm run package` | Validate and create the unsigned extension ZIP in `artifacts/`                     |

## Mozilla submission

Upload `artifacts/x_player_fix-0.3.0.zip` as the extension package. Because the extension is compiled and bundled, also supply a source archive containing this README, `src/`, `scripts/`, `extension/`, `package.json`, `package-lock.json`, `tsconfig.json`, and the formatter/linter configuration. Do not include `node_modules/`, `dist/`, or `.git/` in that source archive.

To reproduce the submitted extension from the source archive, run `npm ci` followed by `npm run build`. To validate and package it, run `npm run package`. See [Mozilla's source-submission requirements](https://extensionworkshop.com/documentation/publish/source-code-submission/).

Reviewer notes: the document-start script runs in the page's `MAIN` world so per-event timestamp adjustments are visible to X's handlers. It raises duplicate/decreasing mousemove timestamps by 0.001 milliseconds beyond the preceding event during an eligible drag. This establishes ordering, not a higher-resolution clock. It does not patch browser prototypes or change browser preferences. Hold-to-2× temporarily changes the selected video's `playbackRate` and suppresses only the completed hold's release click.

## Privacy and scope

- Runs only on X/Twitter pages; no background service or privileged extension APIs.
- No analytics, account access, remote code, or extension-initiated network requests.
- No stored settings and no reads or writes to X's volume/mute preferences.
- Drag and hold listeners are cleaned up when their interaction ends. There is no continuous DOM polling.

## Limitations

X can change its DOM and gesture implementation. Live verification across display scaling settings and current X layouts remains incomplete; passing build checks does not establish compatibility with every player. If a timestamp adjustment fails, that drag workaround stops and the document is marked `data-x-player-fix="unsupported"`.

The extension deliberately leaves X's default muted-preview behavior alone. The extension ID retains its original development name for update continuity. This is an independent project, not affiliated with X or Mozilla.

## License

[ISC](LICENSE)
