# Projectotron

Project undistorted sewing patterns onto fabric using a consumer projector and phone camera.

## Problem

Projectors keystone and viewing angle warp projected images. For sewing, the pattern must appear **undistorted and at correct scale** on the fabric surface.

## Solution

Three modes work together:

| Mode | Device | Purpose |
|------|--------|---------|
| **Calibration** | Projector | Full-screen AprilTag `tag36h11` pattern at known positions |
| **Camera** | Phone | Detect tags, compute homography, sync via GUN |
| **Reprojection** | Projector | Pre-warp image/PDF and project without distortion |

## Architecture

```
Projector (calibration) → Phone (camera + AprilTag WASM) → GUN P2P session
       ↓                                                      ↓
Projector (reprojection) ← calibration JSON ←────────────────┘
```

- **Homography**: 4+ point correspondences between projector pixel space and camera space.
- **Pre-warp**: Inverse mapping from projector quad to source image (pattern).
- **Fine-tune**: Draggable reference rectangle with real-world dimensions, or zoom slider.
- **Sync**: [GUN](https://github.com/amark/gun) with public relay peers; 6-character session code links devices.
- **Fallback**: Export/import calibration JSON if relays are unavailable.

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

1. **Projector**: Create session → open **Calibration** fullscreen.
2. **Phone**: Join same code → open **Camera**, point at tags until locked.
3. **Projector**: Open **Reprojection**, upload pattern, adjust reference rect or zoom, go fullscreen.

## Calibration plane

Homography assumes a **planar** surface. The calibration plane should match the fabric/table plane during reprojection.

## Tech stack

- SvelteKit + Svelte 5 runes + Tailwind CSS
- AprilTag WASM ([apriltag-js-standalone](https://github.com/arenaxr/apriltag-js-standalone))
- `perspective-transform` for homography
- `pdfjs-dist` for PDF patterns
- GUN for P2P session sync
