---
"uniskin": minor
"@uniskin/shadcn": minor
"@uniskin/daisyui": minor
---

Add `ui-slider` on the native `<input type="range">` (vocabulary v1.15): intents tint the thumb and the filled track, `ui-sm` and `ui-lg` set the size, and `ui-disabled` dims it. The filled part of the track is painted from a `--ui-slider-fill` percentage the consumer sets (one line of script, documented); without it the track is unfilled and the thumb alone shows the value. The track and thumb are styled for both WebKit/Blink and Firefox.
