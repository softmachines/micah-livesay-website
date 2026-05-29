# Sound Map — Micah Livesay Terminal

Drop your audio files here (`.wav` or `.mp3`) and name them to match the map below.
All hooks are already wired — just add the files and they'll play automatically.

---

## Sound Hooks & Design Notes

| File                   | Triggers when...                           | Design suggestion                                               |
|------------------------|--------------------------------------------|-----------------------------------------------------------------|
| `boot_static.wav`      | Very first moment of page load             | CRT static burst / white noise hit, short (0.5–1s)             |
| `boot_tick.wav`        | Each line prints during boot sequence      | Soft mechanical tick or typewriter click, very short (<0.1s)   |
| `boot_ready.wav`       | Boot complete — system ready               | A satisfying chime or system-on tone, 1–2s                      |
| `keypress.wav`         | Every character typed in the CLI input     | Single click. Mechanical keyboard hit or soft synth tap         |
| `command_enter.wav`    | Enter key pressed (submitting a command)   | Slightly heavier click or a short "process" blip                |
| `command_success.wav`  | Valid command — output appears             | Data return tone, satisfying confirm — short rising beep        |
| `command_error.wav`    | Unknown command typed                      | Error buzz or low-pitched glitch hit                            |
| `hover.wav`            | Mouse over a command button                | Very subtle hover tone — barely audible, < 0.05s                |
| `click_cmd.wav`        | Clicking a command button                  | Clean click, slightly punchier than keypress                    |
| `glitch_burst.wav`     | Random CRT glitch visual fires             | Short distortion hit, bitcrushed or ring-modded burst            |
| `transmit.wav`         | Contact form send button pressed           | Transmission sound — radio sweep, modem tone, or data blip      |
| `scroll_output.wav`    | New output lines appear (optional)         | Very subtle whoosh or paper tick — can leave silent             |
| `toggle_sound.wav`     | Sound toggled on/off                       | Simple confirm blip                                             |

---

## Tips for Sound Design

- **Boot sequence**: Think CRT cold-start — power hum building, capacitors charging, then
  the phosphor glow settling. That's the arc from `boot_static` to `boot_ready`.

- **Keypress**: The density of this sound defines how the whole interface feels. 
  Mechanical = industrial/hard. Soft synth = futuristic/clean. Experiment with pitch 
  variation (subtle random pitch shift ±5%) to keep it from feeling repetitive.

- **Glitch burst**: This fires every 6–20 seconds randomly. Should feel like a 
  brief electrical fault — not scary, but alive. Bitcrushing, ring mod, or a 
  very short convolution reverb on a spark recording works great here.

- **Transmit**: This is a key emotional moment — make it feel significant. 
  A Morse-code-style blip burst, a modem handshake excerpt, or a custom 
  synthesized "data packet" sweep all work well.

- **Volume balance**: The `volumes` object in `js/sound-engine.js` has per-sound 
  multipliers. `hover` is set to 0.25 (very quiet) and `boot_ready` to 0.9 (loud). 
  Adjust those values to dial in your mix without re-exporting files.

---

## Updating the Sound Map

If you want to use different filenames, edit the `sounds` object at the top of 
`js/sound-engine.js` and update the path strings there.
