# ChronoFlip

A minimalist, elegant flip clock timer web application built with modern web technologies.

## Overview

ChronoFlip is a sleek, user-friendly countdown timer that features a visually appealing flip clock animation. Built with simplicity and functionality in mind, it offers an intuitive interface for setting and monitoring countdown timers.

## Features

- **Flip Clock Display**: Large, easy-to-read flip clock animation
- **Preset Timers**: Quick access buttons for common time intervals
  - 30 seconds
  - 1 minute
  - 2 minutes
  - 5 minutes
  - 10 minutes
  - 30 minutes
  - 1 hour
  - 2 hours
- **Theme Toggle**: Switch between light and dark modes
- **Completion Alert**: Visual overlay and sound notification when timer completes
- **Responsive Design**: Adapts to different screen sizes
- **Theme Persistence**: Remembers user's theme preference

## Technical Details

### Technologies Used
- HTML5
- CSS3
- JavaScript/jQuery
- FlipClock.js library

### Key Components
- **Theme System**: Uses CSS variables for seamless theme switching
- **Local Storage**: Maintains theme preferences across sessions
- **Responsive Layout**: CSS media queries for various screen sizes
- **Audio Feedback**: Multiple sound sources for better compatibility

### Design Features
- Minimalist UI
- Smooth animations
- Glass-morphism effects
- Adaptive color schemes
- Shadow effects for depth

## Usage

1. Select a preset time duration from the buttons at the bottom
2. Timer starts automatically upon selection
3. Toggle theme using the switch in the top-right corner
4. When timer completes:
   - Visual "Time's Up!" overlay appears
   - Sound notification plays
   - Timer resets automatically after 3 seconds

## Responsive Breakpoints
- 1400px: Large displays
- 1200px: Desktop
- 768px: Tablet
- 480px: Mobile

## Credits
- Developed by Aneeth Kumaar with Cursor.
- Copyright © 2024 ChronoFlip (No, not really)

## Browser Compatibility
- Chrome
- Firefox
- Safari
- Edge

## Things to Fix
- Timer when hitting zero is a bit laggy, when overlay is shown. Mainly due to the blur effect. Should optimise js.
