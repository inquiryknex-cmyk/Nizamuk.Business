# Ambient audio

The opt-in ambient-sound control (home + Interdash pages) expects **one**
licensed track at:

```
/assets/audio/nizamok-ambient.mp3
```

Requirements for the file you add here:

- **Licensing:** royalty-free / properly licensed for commercial web use. Do
  not use copyrighted music without confirmed rights.
- **Character:** calm, warm, low-key ambient — designed to loop seamlessly
  (no hard start/stop, no vocals, no strong beat).
- **Format:** MP3, mono or stereo, modest bitrate (~96–128 kbps is plenty for
  a quiet ambient bed and keeps the download small).
- **Length:** a few minutes is fine; the player loops it continuously.

The feature is already wired and **degrades gracefully when this file is
absent** — the control simply stays in its inactive state and no broken player,
popup, or console-error loop appears. Add the MP3 at the path above and the
control becomes fully functional with no further code changes.

Playback behaviour (handled in `assets/js/main.js`): never autoplays, starts
only on an explicit press, loops, fades in/out (~1.5 s), initial volume ~0.12,
persists the on/off choice and approximate position in `localStorage`, and
pauses/ducks whenever another video or audio element plays.
