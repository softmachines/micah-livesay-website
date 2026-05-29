/**
 * SoundEngine — all audio hooks for the terminal.
 *
 * HOW TO ADD SOUNDS:
 * 1. Drop your audio files into /sounds/
 * 2. Update the `sounds` map below with the filename
 * 3. That's it — every hook is already wired to the right moment
 *
 * HOOKS IN USE (listed by trigger moment):
 *   boot_static      — very start of boot sequence (CRT power-on static burst)
 *   boot_tick        — each line printed during boot (subtle click/type sound)
 *   boot_ready       — boot complete, system ready chime
 *   keypress         — every key typed in the CLI input
 *   command_enter    — Enter key pressed (submitting a command)
 *   command_success  — valid command executed (data return sound)
 *   command_error    — unknown command typed (error buzz)
 *   hover            — hovering over a clickable command button
 *   click_cmd        — clicking a command button
 *   glitch_burst     — screen glitch visual fires (distortion hit)
 *   transmit         — contact form sent (transmission sound)
 *   scroll_output    — new output scrolls in (optional soft whoosh)
 *   toggle_sound     — sound toggled on/off
 */

const SoundEngine = {

    sounds: {
        boot_static:     'sounds/boot_static.wav',
        boot_tick:       'sounds/boot_tick.wav',
        boot_ready:      'sounds/boot_ready.wav',
        keypress:        'sounds/keypress.wav',
        command_enter:   'sounds/command_enter.wav',
        command_success: 'sounds/command_success.wav',
        command_error:   'sounds/command_error.wav',
        hover:           'sounds/hover.wav',
        click_cmd:       'sounds/click_cmd.wav',
        glitch_burst:    'sounds/glitch_burst.wav',
        transmit:        'sounds/transmit.wav',
        scroll_output:   'sounds/scroll_output.wav',
        toggle_sound:    'sounds/toggle_sound.wav',
    },

    enabled: true,
    masterVolume: 0.65,

    // Per-sound volume multipliers (tune these to balance your mix)
    volumes: {
        boot_static:     1.0,
        boot_tick:       0.4,
        boot_ready:      0.9,
        keypress:        0.35,
        command_enter:   0.7,
        command_success: 0.8,
        command_error:   0.75,
        hover:           0.25,
        click_cmd:       0.55,
        glitch_burst:    0.85,
        transmit:        1.0,
        scroll_output:   0.3,
        toggle_sound:    0.6,
    },

    play(name, opts = {}) {
        if (!this.enabled && name !== 'toggle_sound') return null;
        const path = this.sounds[name];
        if (!path) return null;

        try {
            const audio = new Audio(path);
            const vol = (this.volumes[name] ?? 1.0) * (opts.volume ?? this.masterVolume);
            audio.volume = Math.min(1, Math.max(0, vol));
            if (opts.loop) audio.loop = true;
            if (opts.rate) audio.playbackRate = opts.rate;
            audio.play().catch(() => {}); // silently fail if file not yet added
            return audio;
        } catch (_) {
            return null;
        }
    },

    stop(instance) {
        if (!instance) return;
        instance.pause();
        instance.currentTime = 0;
    },

    toggle() {
        this.enabled = !this.enabled;
        this.play('toggle_sound');
        return this.enabled;
    },

    setMasterVolume(v) {
        this.masterVolume = Math.max(0, Math.min(1, v));
    },
};
