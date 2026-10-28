<p align="center">
  <img src="assets/images/favicon2.png" alt="Chronoflip Logo" width="128" height="128">
</p>

<div align='center'>
<h1>ChronoFlip</h1>
<img src='https://img.shields.io/badge/Status-Archived-lightgrey'></img>
<img src='https://img.shields.io/badge/HTML%20%7C%20CSS%20%7C%20JS-blue'></img>
<img src='https://img.shields.io/badge/License-MIT-yellow'></img>
<br><br><br>
</div>

> **This project is complete and archived.**
>
> ChronoFlip received its final update on October 28, 2026. The repository is read-only: no further changes, issues or pull requests will be accepted. The app still works as-is, and you're welcome to fork it.
>
> **[Live demo](https://aneethkumaar.is-a.dev/ChronoFlip/)**

A minimalist flip clock countdown timer for the browser, built with HTML, CSS, JavaScript, jQuery and [FlipClock.js](https://github.com/objectivehtml/FlipClock).

## Features

- **Flip clock display** that scales to fit any screen size and orientation
- **Preset timers**: 5s, 30s, 1m, 2m, 5m, 10m, 15m, 30m, 1h, 2h
- **Current Time mode** that shows the time of day as a live flip clock
- **Light and dark themes**, remembered between visits
- **Time's Up alert** with a full-screen overlay and a looping alarm, dismissed by click or `Esc`
- **Reliable in background tabs**: completion runs off a Web Worker and a fixed deadline, so throttled tabs don't delay the alarm
- **Screen Wake Lock** keeps the display on during a countdown, where supported

## Usage

1. Pick a preset at the bottom. The timer starts immediately.
2. Use the switch in the top-right corner to change theme.
3. When the timer ends, the alarm plays until you click the overlay or press `Esc`.

Sound is unlocked by your first button click, since browsers block audio that isn't triggered by a user action.


## Browser support

Current versions of Chrome, Edge, Firefox and Safari. Firefox 126 or newer is recommended, since older versions fall back to a softer, transform-based scaling.

## License

MIT