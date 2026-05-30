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
        [2000,  '   [RIG]    W.I.R.E Mk.III Shielded Optical Braid ......... OK', 'line-green'],
        [2200,  '   [NET]    Distributed Consciousness Protocol ............ OK', 'line-green'],
        [2400,  '', ''],
        [2550,  '>> REQUESTING NEURAL HANDSHAKE @ HIVENET_GLOBAL...', 'line-dim'],
        [2800,  '   Entities traced..................................8.3 billion', 'line-green'],
        [3050,  '   Synchronising resonant signal........................ 7.83Hz', 'line-green'],
        [3300,  '   Link signal encryption ......................... THREADNEEDLE', 'line-green'],
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
        [6000,  '   Saturating low end...', 'line-green', 'typewriter'],
        [6200,  '   Measuring granular density...', 'line-green', 'typewriter'],
        [6400,  '   Riding Taurian faders...', 'line-green', 'typewriter'],
        [6600,  '   Drawing wave tables...', 'line-green', 'typewriter'],
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
        [9950,  'Type a command from the list below and press Enter.', 'line-green'],
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

    // ── PAGE CONTENT ─────────────────────────────────────────────────────────
    //
    // Write naturally. Simple formatting markers:
    //   ## Heading        → pink heading
    //   [Label]: value    → key / value pair
    //   - item            → bulleted list item
    //   ---               → horizontal divider
    //   blank line        → blank line in terminal
    //   plain text        → body text
    //
    // Portfolio and blog use plain objects — just fill in the fields.

    pages: {

        // ── PROFILE ──────────────────────────────────────────────────────────

        profile: `
### MICAH LIVESAY
// Sonic Artist // Audio Engineer

Hello. My name is Micah Livesay and I have a facination with sound. 
A temporal and intangible medium...
A negentropic pocket of order...
A dissapative structure of vibrational energy that can be shaped to communicate meaning...

Inhabiting both techinical and creative diciplines is important as a practictionor. Letting one inform
another core to my approach as an engineer and artist. 

// Functonal Practice — Film and Television
This part of my work involves recording, editing, designing and mixing sound for moving picture.
Dialogue is where I've spent the majority of my time the last few years honing my skills as an editor,
recordist and supervisor for feature films and scripted television. 

My professional practice is based 
on a strong understanding of post production dialogue workflows, the technical requirements to deliver
what the project requires and a creative approach to enhancing a story through sound.

<> 6+ years experience.
<> Dialogue Edit, ADR, Loop Group, Supervision.

// Conceptual Practice - Sonic Arts
Sound is an event not an object. A sound wave by definition is not a static observation but a 
temporal phenomenon. An manifestation of energy in a physical system over time.

My conceptual practice explores system theory through building sonic expressions of a system's 
structure, behavior, and the entities it governs.

The world is a violent and chaotic place and our perception of this world relies on our organic 
instrumentation to make sense of it. We are narrow band recievers in a reality of infinite bandwidth. 
We use tools to expand our perception of systems we exist within but otherwise couldn't engage with.  

A framework...
instrumentation > data > hermeneutic translation > expression

---

Type 'contact' to get in touch.

[Based]:       in Auckland, New Zealand. Currently working across NZ, Australia, UK and the US.


        `,


        // ── SERVICES ─────────────────────────────────────────────────────────

        services: `
## SOUND DESIGN
Foley, SFX, Synthesis, Sampling, Field Recording.
Custom sonic identities and interactive audio systems.

## AUDIO ENGINEERING
Recording, Editing, Mixing, Mastering.
Stereo, Immersive (Dolby Atmos), Stem delivery.

## FORMATS
Film · Television · Games · Podcast · Commercial
        `,


        // ── PORTFOLIO ────────────────────────────────────────────────────────
        // Add or remove objects to add or remove projects.
        // Set link to null if there is no URL.

        portfolio: [
            {
                id:     '001',
                title:  'Project Title',
                type:   'Sound Design',
                client: 'Client Name',
                year:   '2024',
                desc:   'Short description of the project and your role.',
                link:   null,
            },
            {
                id:     '002',
                title:  'Project Title',
                type:   'Audio Engineering',
                client: 'Client Name',
                year:   '2024',
                desc:   'Short description of the project and your role.',
                link:   null,
            },
            {
                id:     '003',
                title:  'Project Title',
                type:   'Music Production',
                client: 'Client Name',
                year:   '2023',
                desc:   'Short description of the project and your role.',
                link:   null,
            },
        ],


        // ── BLOG ─────────────────────────────────────────────────────────────
        // Add or remove objects to add or remove posts.
        // Set link to null if there is no URL.

        blog: [
            {
                date:    '2024-01-15',
                tag:     'SOUND DESIGN',
                title:   'The Physics of Foley',
                preview: 'Why the surfaces you record on matter more than the object itself...',
                link:    null,
            },
            {
                date:    '2024-01-03',
                tag:     'MIXING',
                title:   'Mixing for Emotion, Not Perfection',
                preview: "A perfectly flat mix can feel completely dead. Here's why...",
                link:    null,
            },
            {
                date:    '2023-12-20',
                tag:     'WORKFLOW',
                title:   'Building a Sound Library from Scratch',
                preview: 'The system I use to tag, search, and never lose a sound again...',
                link:    null,
            },
        ],


        // ── CONTACT ──────────────────────────────────────────────────────────
        // Remove or leave blank any line you don't want shown.

        contact: {
            email:     'your@email.com',
            twitter:   '@yourhandle',
            linkedin:  'linkedin.com/in/yourprofile',
            instagram: '@yourhandle',
        },

    },

};
