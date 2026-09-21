# Quickstart

This project is a local-first virtual wardrobe app built with Expo + React Native. It is designed to let you:

- add garments from your photo library or camera
- browse and filter your wardrobe
- open a garment in the studio for try-on
- use pose-aware auto-placement when the MoveNet model is available
- save and share looks locally

## Prerequisites

- Node.js 22 LTS recommended
- npm
- Expo CLI via the project dependencies
- A mobile device or a web browser for local testing

If you use `nvm`, run:

```bash
nvm use 22
```

> The repo notes that newer Node versions may not work cleanly with the Expo toolchain used here.

## 1. Install dependencies

```bash
npm install
```

## 2. Prepare the pose model for web try-on

The web studio can use MoveNet SinglePose Lite for automatic garment placement. The model is intentionally kept local and is not downloaded at runtime.

Run:

```bash
npm run fetch:pose
```

If that command fails because the upstream model URL has moved, see [docs/dev-setup.md](docs/dev-setup.md) for the fallback steps.

## 3. Start the app

### Web

```bash
npm run web
```

Then open the Expo dev server in your browser, or use the local URL printed in the terminal.

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

## 4. First run workflow

1. Open the app.
2. Accept the onboarding camera permission prompt if prompted.
3. You will be redirected to the wardrobe screen.
4. Tap the plus button to add a garment image.
5. Choose a photo from your library or take one with the camera.
6. Open a garment from the wardrobe and launch the studio.
7. Adjust the garment position, scale, rotation, and opacity.
8. Save or share the result.

## 5. Common commands

```bash
npm start
npm run typecheck
npm run lint
npm test
```

## Project status note

This is an active development app with planned roadmap milestones in the [Plans](Plans) folder. Some features are fully implemented, while others are still under construction.
