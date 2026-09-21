# App Usage Guide

This guide explains how the app is meant to work in its current development state.

## Onboarding

On first launch, the app asks for camera permission as part of onboarding. After permission is granted, the user enters the wardrobe flow.

The onboarding screen includes:

- a welcome message
- camera permission request
- language switching
- a button to continue into the app

## Wardrobe screen

The wardrobe screen is the main home experience.

You can:

- search for garments by name or tags
- filter by category
- filter by color
- refresh the list
- open an item detail view
- launch a try-on session from a garment card
- add a new garment using the floating plus button

If the wardrobe is empty, the app prompts the user to add their first item.

## Capture and import

From the add-item flow, the user can:

- choose a photo from the device library
- take a new photo with the camera
- provide an optional category hint for the item

The inserted record is stored locally and then shows up in the wardrobe view.

## Studio / try-on screen

The studio is where the user places a garment over a body photo.

Available controls include:

- drag to reposition the garment
- scale controls to resize it
- rotation controls to angle it
- opacity adjustment
- reset to auto-placement if pose detection has placed it
- save the final look
- share the final composition

### Pose behavior

When a pose model is available, the app can estimate keypoints and auto-place the garment based on the detected body pose.

When the model is not available, the app falls back to the manual controls with a banner explaining that auto-drape is unavailable.

## Catalog and looks

The app also includes supporting areas for:

- catalog browsing
- saved looks or recent try-on results
- stacking multiple saved transformations if needed in later milestones

## Suggested user flow

A good first test flow is:

1. Open the app
2. Complete onboarding
3. Add a garment image
4. Open the wardrobe
5. Tap Try on on a garment
6. Use the studio to position it
7. Save the result

## Notes for current development

This is a development build, so not every polished interaction is final. Some flows are intentionally minimal and some roadmap features are still pending. The plan documents under [Plans](Plans) describe the intended milestones and implementation order.
