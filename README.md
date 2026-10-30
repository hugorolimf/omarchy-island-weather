<div align="center">

# Island Weather

**Omarchy's Weather panel, in the Island look.**
Current weather, the next hours and days, and the city search, drawn with thin stroke icons and a dark anatomy panel that opens right under its icon.

![Island Weather](preview.png)

</div>

## Why this one

- ✏️ **The Island look.** Same stroke icons as [Island Bar](https://github.com/hugorolimf/omarchy-bar),
  colour only when it means something, one easing curve for every transition.
- 🧭 **Opens under its icon**, with the keyboard: Esc closes, Tab moves to the next panel.
- 🌍 **English or Portuguese**, following your system language.
- 🔄 **Drop-in.** It's Omarchy's own `omarchy.weather` underneath (same behaviour, same
  shortcuts and IPC): enabling it takes the original's place on the bar.

## Requirements

[Island Kit](https://github.com/hugorolimf/omarchy-island-kit): the panel is drawn with it.
Install the Kit first, or install this panel from the Kit's catalog.
Without the Kit, the plugin shows an "Install Island Kit" button on the bar
(in Portuguese, "Instale o Island Kit"); clicking it installs the Kit and
restarts the shell.

## Install

```bash
omarchy plugin add https://github.com/hugorolimf/omarchy-island-kit --enable
omarchy plugin add https://github.com/hugorolimf/omarchy-island-weather --enable
```

## Remove

```bash
omarchy plugin remove io.github.hugorolimf.weather
```

Omarchy's own weather panel comes back to the bar.

## Credits

A clone of Omarchy's `omarchy.weather` panel by David Heinemeier Hansson and the
[Omarchy](https://github.com/basecamp/omarchy) contributors (MIT); the look, icons and the
Portuguese wording are this plugin's.

## The other Island panels

[Island Sound](https://github.com/hugorolimf/omarchy-island-audio) · [Island Bluetooth](https://github.com/hugorolimf/omarchy-island-bluetooth) · [Island Network](https://github.com/hugorolimf/omarchy-island-network) · [Island Power](https://github.com/hugorolimf/omarchy-island-power) · [Island Display](https://github.com/hugorolimf/omarchy-island-display) · [Island Weather](https://github.com/hugorolimf/omarchy-island-weather)

## License

[MIT](LICENSE)
