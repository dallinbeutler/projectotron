# OVERVIEW

Project undistorted sewing patterns onto fabric using a consumer projector and phone camera.

## Problem

Projectors keystone and viewing angle warp projected images. For sewing, the pattern must appear **undistorted and at correct scale** on the fabric surface.

## Solution

Two devices work together:

| Mode | Device | Purpose |
|------|--------|---------|
| **Calibration** | Projector | Full-screen AprilTag `tag36h11` pattern at known positions |
| **Camera** | Phone | Detect tags, compute homography, sync via WebRTC |
| **Reprojection** | Projector | Once calibrated with camera, switch to a viewer that will Pre-warp image/PDF and project without distortion |

## Architecture

- **Homography**: 4+ point correspondences between projector pixel space and camera space.
- **Pre-warp**: Inverse mapping from projector quad to source image (pattern).
- **Fine-tune**: Draggable reference rectangle for the media input with real-world dimensions, or zoom slider.
- **Sync**: [Trystero](https://trystero.dev/) (Nostr + WebRTC); QR on calibration screen links the phone; JSON export/import fallback.

## Development

```bash
npm install
npm run dev
```

## Build & deploy

Static site via `@sveltejs/adapter-static`. GitHub Actions deploys to GitHub Pages on push to `master`.

```bash
npm run build
npm run preview
```

Set `BASE_PATH=/YourRepoName` for GitHub Pages project sites (configured in CI).

## Usage

1. **Projector**: Open the site (calibration screen). switches to fullscreen and gets the resolution information. A QR code will appear.
2. **Phone**: Scan the QR on projector → opens **Camera** with information to connect to the **projector**'s session. the **projector** switches to showing tags.the corners of the tags can be adjusted to fit a specific worktable size.
3. **Phone**'s camera is pointed at tags until all information about tag position is confirmed, then relayed back to **projector**.
3. **Projector**: Open **Reprojection**, upload pattern, adjust reference rect or zoom.

## Calibration plane

Homography assumes a **planar** surface. The calibration plane should match the fabric/table plane during reprojection.

## Tech stack

- SvelteKit + Svelte 5 runes + Tailwind CSS
- AprilTag WASM ([apriltag-js-standalone](https://github.com/arenaxr/apriltag-js-standalone))
- In-house DLT homography (`src/lib/calibration/homography.ts`)
- `pdfjs-dist` for PDF patterns
- Trystero + `qrcode` for session sync and join links
