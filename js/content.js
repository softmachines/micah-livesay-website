/**
 * content.js — all editable site text in one place.
 *
 * Edit this file to update the boot sequence, shutdown sequence,
 * splash screen text, and CLI page content without touching any
 * other JavaScript files.
 */

const SITE_CONTENT = {

    // ── SPLASH SCREEN ─────────────────────────────────────────────────────────
    // Edited directly in index.html — search for id="splash"

    // ── BOOT SEQUENCE ─────────────────────────────────────────────────────────
    // Each entry: [delay_ms, 'text', 'css-class']
    // css-class options: 'line-green'  'line-pink'  'line-cyan'  'line-dim'
    // Special tokens:    '' (blank line)   '__PROGRESS__' (loading bar)

    boot: [
        [0,     '╔══════════════════════════════════════════════════════════════╗', 'line-dim'],
        [100,   '║  MicahWarez_OS v2.0.77 // N.I.T                              ║', 'line-pink'],
        [200,   '║  NEURAL RESONATOR KERNEL MOD // HIVE_Pwn Edition             ║', 'line-dim'],
        [300,   '╚══════════════════════════════════════════════════════════════╝', 'line-dim'],
        [750,   '', ''],
        [900,   '>> BIOS v4.2.0 — SONICALLY SYNCHRONOUS TECHNOLOGIES', 'line-dim'],
        [970,   '', ''],
        [1050,  '>> POWER ON SELF TEST...', 'line-dim'],
        [1400,  '   [DECK]   Ono-Sendai Cyberspace 7 ....................... OK', 'line-green'],
        [1600,  '   [ARRY]   Synchron Stentrode ............................ OK', 'line-green'],
        [1800,  '   [SIGAMP] Hosaka SA-11 Signal Amplifier ................. OK', 'line-green'],
        [2000,  '   [GPU]    W.I.R.E Mk.III Shielded Optical Braid ......... OK', 'line-green'],
        [2200,  '   [NET]    Distributed Consciousness Protocol ............ OK', 'line-green'],
        [2400,  '', ''],
        [2550,  '>> REQUESTING NEURAL HANDSHAKE @ HIVENET_GLOBAL...', 'line-dim'],
        [2800,  '   Entities traced..................................8.3 billion', 'line-green'],
        [3050,  '   Synchronising resonant signal........................ 7.83Hz', 'line-green'],
        [3300,  '   Link signal encrytion ......................... THREADNEEDLE', 'line-green'],
        [3550,  '   HIVENET collective flagelation ................... INITIATED', 'line-green'],
        [3800,  '', ''],
        [3900,  '   >> WARNING: autonomous cognition detected', 'line-warning'],
        [3901,  '   >> WARNING: unmerged thought pattern present', 'line-warning'],
        [3920,  '', ''],
        [3950,  '   Encrypting signal...', 'line-green', 'typewriter'],
        [4050,  '', ''],
        [4250,  '>> SCRAPING SYNAPTIC RECORDS...', 'line-dim'],
        [4450,  '   Neural profile detected ............. Micah Sterling Livesay', 'line-green'],
        [4650,  '   /profile    ........................................ MOUNTED', 'line-green'],
        [4850,  '   /portfolio  ........................................ MOUNTED', 'line-green'],
        [5050,  '   /blog       ........................................ MOUNTED', 'line-green'],
        [5250,  '   /contact    ........................................ MOUNTED', 'line-green'],
        [5500,  '', ''],
        [5650,  '>> INITIALIZING AUDIO SUBSYSTEMS...', 'line-dim'],
        [5850,  '', ''],
        [6000,  '   Applying tastful saturation to signals...', 'line-green', 'typewriter'],
        [6200,  '   Cleaning granular windows...', 'line-green', 'typewriter'],
        [6400,  '   Riding faders...', 'line-green', 'typewriter'],
        [6600,  '   Setting wave tables...', 'line-green', 'typewriter'],
        [6750,  '', ''],
        [6900,  '   NETWORK WEATHER: Spectral clouds forming late evening.', 'line-green', 'typewriter'],
        [6950,  '   Isolated bursts of stochastic noise probable. Dress appropriately', 'line-green', 'typewriter'],
        [7050,  'images/rainjacket.svg | images/umbrella.svg | images/void.svg', 'line-dim', 'icons'],
        [7200,  '', ''],
        [7350,  '__PROGRESS__', 'progress'],
        [7450,  '', ''],
        [7750,  '════════════════════════════════════════════════════════════════', 'line-pink'],
        [8000,  '', ''],
        [8150,  ' ██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗███████╗   ', 'line-pink'],
        [8250,  ' ██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝  ', 'line-pink'],
        [8350,  ' ██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║█████╗     ', 'line-pink'],
        [8450,  ' ██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝     ', 'line-pink'],
        [8550,  ' ╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗ ', 'line-pink'],
        [8650,  '  ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝  ', 'line-pink'],
        [8750,  '', ''],
        [8900,  '   To the neural record of an entropic audio engineer...', 'line-dim'],
        [9000,  '   named Micah Livesay.', 'line-dim'],
        [9100,  '', ''],
        [9200,  '════════════════════════════════════════════════════════════════', 'line-pink'],
        [9500,  '', ''],
        [9700,  'System ready...', 'line-dim'],
        [9800,  '', ''],
        [9950,  'Type a command from the list below.', 'line-green'],
        [10100, '', ''],
    ],

    // ── SHUTDOWN SEQUENCE ─────────────────────────────────────────────────────
    // Plays when the user types 'exit'

    shutdown: [
        ['>> INITIATING SHUTDOWN SEQUENCE...', 'line-pink'],
        ['', ''],
        ['   [AUDIO]   Signal chain terminated ......... OK', 'line-dim'],
        ['   [DSP]     Processors offline .............. OK', 'line-dim'],
        ['   [FX]      Effects chain unloaded .......... OK', 'line-dim'],
        ['   [NET]     Neural link severed ............. OK', 'line-dim'],
        ['   [MEM]     Flushing memory buffers ......... OK', 'line-dim'],
        ['   [FS]      Unmounting filesystems .......... OK', 'line-dim'],
        ['', ''],
        ['>> SYSTEM HALTED.', 'line-pink'],
        ['', ''],
        ['   GOODBYE, OPERATOR.', 'line-green'],
    ],

    // ── CLI PROMPT ────────────────────────────────────────────────────────────

    prompt: 'MICAH@LIVESAY',

};
