// ─────────────────────────────────────────────────────────────────────────────
// main.js — Entry point and orchestrator for the entire site
//
// This file is the "conductor" — it doesn't contain large amounts of logic
// itself, but it wires together every other system:
//
//   StaticEffect  →  splash screen noise animation
//   Boot          →  typed boot sequence text
//   CLI           →  command parsing and page rendering
//   SoundEngine   →  audio feedback on keypresses
//
// EXECUTION ORDER:
//   1. Browser parses the HTML and builds the DOM
//   2. Browser loads this script (last <script> tag in index.html)
//   3. DOMContentLoaded fires → Main.setup() runs
//   4. User presses a key → splash dismisses → Main.init() runs
//   5. Boot sequence plays → on completion → Main.bindInput() activates
//
// OBJECT LITERAL PATTERN:
//   Everything lives inside a single object `const Main = { ... }`.
//   This avoids polluting the global scope with dozens of loose functions
//   and variables. The properties (e.g. Main.inputBuffer) are shared state
//   that all the methods inside can access via `this`.
// ─────────────────────────────────────────────────────────────────────────────

const Main = {

    // ─── PROPERTIES (shared state) ────────────────────────────────────────────
    // These are like "instance variables" — data that persists across method calls.
    // JavaScript objects don't need formal declarations; you just list them here.

    inputBuffer: '',    // The string the user is currently typing at the CLI prompt.
                        // Builds up on each keypress, cleared on Enter.

    formFocus: false,   // Guard flag. If a real <input> or <textarea> has focus
                        // (e.g. inside a tool), keyboard events should NOT be
                        // intercepted by our custom CLI handler.

    glitchTimer: null,  // Stores the setTimeout ID for the ambient glitch scheduler
                        // so it can be cancelled if needed (not currently used, but
                        // good practice — prevents memory leaks).

    _started: false,    // One-shot guard. The splash "start" function can be triggered
                        // by both keydown AND click — this ensures it only runs once
                        // even if both events fire together.

    _splashFx: null,    // Holds the StaticEffect instance running on the splash screen.
                        // Stored here so stopSplashEffect() can call .destroy() on it.

    _cursorX: 0,        // Most recent mouse X position. Used by the glitch-hide
    _cursorY: 0,        // animation to know where to draw the crosshair effect.

    _glitching: false,  // Flag that tells the cursor trail draw loop to pause
                        // while the chromatic aberration glitch animation is running.
                        // Prevents the trail from drawing over the glitch frames.


    // ─── SETUP ───────────────────────────────────────────────────────────────
    // Called once, immediately when the DOM is ready (see bottom of file).
    // Initialises all persistent systems and sets up the splash dismissal.

    setup() {
        // These three systems run for the entire lifetime of the page,
        // so they're started here before anything else happens.
        this.initCursorHide();    // Start the 1-second idle timer for cursor hiding
        this.initCursorTrail();   // Start the rAF loop that draws the phosphor trail
        this.initRightScrollbar(); // Wire up the custom scrollbar on the right pane

        const splash = document.getElementById('splash');

        // ── SPLASH DISMISSAL ──────────────────────────────────────────────────
        // `start` is a local function (not a method) defined inside setup().
        // It can still access `this` because of how arrow functions work —
        // they inherit `this` from the surrounding scope (setup's `this` = Main).
        const start = () => {
            // Guard: if start() somehow fires twice (key + click simultaneously),
            // do nothing on the second call.
            if (this._started) return;
            this._started = true;

            // PHASE 1 — Glitch out the splash text (runs for ~680ms)
            // querySelector finds the first element matching a CSS selector
            // inside the splash div — equivalent to splash.getElementById
            // but scoped to just this parent element.
            // classList.add() applies a CSS class that triggers a keyframe animation.
            const content = splash.querySelector('.splash-content');
            if (content) content.classList.add('glitch-out');

            // PHASE 2 — After text animation, fullscreen + fade the container
            // setTimeout(fn, ms) schedules fn to run after ms milliseconds.
            // It doesn't block — the browser continues other work while waiting.
            setTimeout(() => {
                this.requestFullscreen(); // Ask browser to go fullscreen
                splash.classList.add('fade-out'); // CSS transition fades opacity to 0

                // PHASE 3 — After fade, hide the splash entirely and start boot
                // 580ms matches the CSS transition-duration on .splash-screen.fade-out.
                // Using display:none after the opacity fade means the element is
                // gone from layout and no longer interactable.
                setTimeout(() => {
                    splash.style.display = 'none';
                    this.init(); // Hand off to the boot sequence
                }, 580);

            }, 680); // 680ms gives the glitch-out animation time to finish
        };

        // KEYBOARD DISMISSAL
        // addEventListener attaches an event handler that fires whenever the
        // specified event occurs. 'keydown' fires as soon as a key is pressed.
        // We ignore lone modifier keys (Shift, Ctrl etc.) because pressing
        // e.g. Shift alone to capitalise something shouldn't trigger the boot.
        document.addEventListener('keydown', (e) => {
            if (['Shift','Control','Alt','Meta','CapsLock','Tab'].includes(e.key)) return;
            start();
        });

        // MOUSE CLICK DISMISSAL — any click on the splash also starts boot
        splash.addEventListener('click', start);
    },


    // ─── PHOSPHOR CURSOR TRAIL ───────────────────────────────────────────────
    // Draws a fading trail of green squares that follow the mouse cursor,
    // mimicking the afterglow (phosphor persistence) of an old CRT monitor.

    initCursorTrail() {
        const canvas = document.getElementById('cursor-trail');
        if (!canvas) return; // Safety check — do nothing if element missing

        // getContext('2d') gives us a CanvasRenderingContext2D — the API for
        // drawing 2D shapes, text, and images onto the canvas element.
        const ctx = canvas.getContext('2d');

        // CANVAS SIZING
        // Canvas pixels ≠ CSS pixels — you must set canvas.width/height
        // explicitly. If you only set the CSS size the image will be blurry.
        // This resize function matches the canvas to the full viewport.
        const resize = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize(); // Run once immediately
        window.addEventListener('resize', resize); // Re-run if window size changes

        // TRAIL DATA STRUCTURE
        // An array of point objects: { x, y, t }
        //   x, y — screen coordinates
        //   t     — timestamp (from performance.now(), which gives milliseconds
        //           since page load, accurate to fractions of a millisecond)
        const trail   = [];
        const DURATION = 280; // Each point fades over 280ms

        // COLLECT MOUSE POSITIONS
        // Every time the mouse moves, push a new point onto the trail array.
        // We don't draw here — drawing happens in the rAF loop below.
        // Separating collection and drawing keeps the code clean.
        document.addEventListener('mousemove', (e) => {
            trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        });

        // DRAW LOOP
        // requestAnimationFrame(fn) asks the browser to call fn before the
        // next repaint — typically 60 times per second (every ~16ms).
        // By calling requestAnimationFrame(draw) INSIDE draw(), it creates
        // a continuous loop that runs every frame for the lifetime of the page.
        const draw = () => {
            // If the glitch animation is playing, skip this frame entirely.
            // The glitch draws directly to this canvas, so we must not interfere.
            if (this._glitching) { requestAnimationFrame(draw); return; }

            // clearRect wipes the entire canvas each frame.
            // Without this, every new frame would draw ON TOP of old ones.
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Only draw the trail when the cursor is visible (not hidden)
            if (!document.documentElement.classList.contains('cursor-hidden')) {
                const now = performance.now();

                // REMOVE EXPIRED POINTS
                // trail[0] is always the oldest point. Keep shifting the front
                // of the array off until all remaining points are still within
                // their DURATION. This is efficient because we only ever
                // remove from the front (array.shift is O(n) but trail is short).
                while (trail.length > 0 && now - trail[0].t > DURATION) trail.shift();

                // DRAW EACH TRAIL POINT
                // Skip the last 3 points — those are essentially the current
                // cursor position, which already has the OS cursor on top of it.
                for (let i = 0; i < trail.length - 3; i++) {
                    const p    = trail[i];
                    // `life` goes from 1.0 (just created) to 0.0 (about to expire)
                    const life = 1 - (now - p.t) / DURATION;
                    // Dots shrink as they age
                    const size = Math.max(0.4, 1.8 * life);

                    // ctx.save() / ctx.restore() bracket any drawing that changes
                    // global canvas state (like globalAlpha). save() pushes the
                    // current state onto a stack; restore() pops it back.
                    // This prevents settings leaking into subsequent draw calls.
                    ctx.save();
                    ctx.globalAlpha = life * 0.28; // Semi-transparent — max ~28% opacity
                    ctx.shadowBlur  = 5 * life;    // Glow effect — stronger when fresh
                    ctx.shadowColor = '#00ff41';   // Green glow (the site's primary colour)
                    ctx.fillStyle   = '#00ff41';
                    // fillRect(x, y, width, height) draws a filled rectangle.
                    // We centre it on the trail point by offsetting by size/2.
                    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
                    ctx.restore();
                }
            }

            // Schedule the next frame — this keeps the loop going indefinitely
            requestAnimationFrame(draw);
        };

        // Kick off the first frame to start the loop
        requestAnimationFrame(draw);
    },


    // ─── CURSOR HIDE / SHOW ───────────────────────────────────────────────────
    // The OS mouse cursor is hidden after 1 second of inactivity.
    // Moving the mouse shows it again and resets the timer.

    initCursorHide() {
        // document.documentElement is the <html> element — the root of the page.
        // Adding 'cursor-hidden' to it applies a CSS rule:
        //   html.cursor-hidden * { cursor: none; }
        // which hides the cursor on every element at once.
        const root = document.documentElement;
        let hideTimer = null;

        const hideCursor = () => {
            // If we know where the cursor is, play the glitch-out animation first.
            // The cursor position is tracked via mousemove (see below).
            if (this._cursorX || this._cursorY) {
                // _triggerGlitchHide runs the animation and calls the callback
                // when it's done — the callback is the actual hide action.
                this._triggerGlitchHide(() => root.classList.add('cursor-hidden'));
            } else {
                // No known position — hide immediately without animation
                root.classList.add('cursor-hidden');
            }
        };

        const showCursor = () => {
            root.classList.remove('cursor-hidden'); // Make cursor visible
            clearTimeout(hideTimer);                // Cancel any pending hide
            hideTimer = setTimeout(hideCursor, 1000); // Schedule new hide in 1s
        };

        // Hide immediately on page load (no cursor visible at start)
        hideCursor();

        // Show the cursor whenever the mouse moves, and restart the idle timer
        document.addEventListener('mousemove', (e) => {
            this._cursorX = e.clientX; // Track position for the glitch animation
            this._cursorY = e.clientY;
            showCursor();
        });
    },


    // ─── CHROMATIC ABERRATION GLITCH ON CURSOR HIDE ──────────────────────────
    // When the cursor is about to be hidden, this method plays a short
    // multi-channel crosshair animation on the cursor-trail canvas —
    // three overlapping crosshairs in pink, cyan, and green that drift apart,
    // mimicking a chromatic aberration / signal-break effect.

    _triggerGlitchHide(onDone) {
        // The underscore prefix on _triggerGlitchHide is a naming convention
        // that signals "this is a private/internal method, not for external use".
        // JavaScript doesn't enforce this — it's just a readable signal to developers.

        // Hide the OS cursor sprite immediately (the animation uses canvas drawing)
        document.documentElement.classList.add('cursor-hidden');

        const canvas = document.getElementById('cursor-trail');
        if (!canvas) { onDone(); return; } // Safety: if canvas missing, just call callback

        const ctx    = canvas.getContext('2d');
        const x      = this._cursorX; // Snapshot the position — it might change during animation
        const y      = this._cursorY;
        const FRAMES = 7;
        let   frame  = 0;

        this._glitching = true; // Tell the trail draw loop to pause

        // HELPER: draw one crosshair at a given position in a given colour.
        // The crosshair is four short line segments forming a + shape with
        // a gap in the centre (gap from -4 to +4 around the cursor position).
        const drawChannel = (cx, cy, color, alpha) => {
            ctx.save();
            ctx.globalAlpha  = alpha;
            ctx.strokeStyle  = color;
            ctx.fillStyle    = color;
            ctx.lineWidth    = 1.5;
            ctx.shadowBlur   = 10;
            ctx.shadowColor  = color;
            // beginPath() starts a new path — without this, lines accumulate
            ctx.beginPath();
            // Horizontal arms: left side (cx-14 to cx-4) and right side (cx+4 to cx+14)
            ctx.moveTo(cx - 14, cy); ctx.lineTo(cx - 4, cy);
            ctx.moveTo(cx +  4, cy); ctx.lineTo(cx + 14, cy);
            // Vertical arms: top (cy-14 to cy-4) and bottom (cy+4 to cy+14)
            ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy - 4);
            ctx.moveTo(cx, cy +  4); ctx.lineTo(cx, cy + 14);
            ctx.stroke(); // Actually draw the lines
            // Tiny centre dot
            ctx.fillRect(cx - 1, cy - 1, 2, 2);
            ctx.restore();
        };

        // ANIMATION LOOP
        // This uses setTimeout instead of requestAnimationFrame because
        // we want a fixed step of ~28ms per frame (not variable rAF timing),
        // and it's only 7 frames so the imprecision doesn't matter.
        const animate = () => {
            if (frame >= FRAMES) {
                // Animation complete — call the callback (which was the actual
                // cursor-hide action), clean up, and restore normal trail drawing.
                onDone();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this._glitching = false;
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // progress goes from 0.0 (first frame) to ~0.86 (last frame)
            const progress = frame / FRAMES;

            // Channels start spread apart and converge slightly over time
            const spread  = 10 - progress * 4;
            const alpha   = 1 - progress * 0.25; // Fade out slightly

            // Random jitter creates the chaotic "signal error" feel.
            // Math.random() returns 0.0–1.0; subtracting 0.5 centres it at 0.
            // Multiplying by a growing value makes jitter increase on later frames.
            const jx = (Math.random() - 0.5) * (2 + progress * 4);
            const jy = (Math.random() - 0.5) * (1 + progress * 2);

            // Three channels at different offsets — RGB chromatic aberration split
            drawChannel(x - spread + jx,       y + jy,       'rgba(255,45,120,0.9)',  alpha * 0.9); // Pink — shifted left
            drawChannel(x + spread + jx * 0.5, y - jy * 0.5, 'rgba(0,255,204,0.9)',  alpha * 0.9); // Cyan — shifted right
            drawChannel(x + jx * 0.3,          y + jy * 0.3, '#00ff41',              alpha);       // Green — roughly centred

            frame++;
            setTimeout(animate, 28); // Schedule next frame in 28ms
        };

        animate(); // Kick off the first frame
    },


    // ─── SPLASH STATIC EFFECT ─────────────────────────────────────────────────
    // Creates the animated TV-noise effect on the splash screen.
    // The StaticEffect class (StaticEffect.js) renders noise pixel-by-pixel
    // on a canvas and composites a content image through it.

    initSplashEffect() {
        const splash = document.getElementById('splash');
        if (!splash) return;

        // Instantiate StaticEffect, passing options as an object literal.
        // `new` creates an instance of the class, calling its constructor.
        this._splashFx = new StaticEffect(splash, {
            brightness:      0.85,   // How bright the static noise is
            bloomOpacity:    0.4,    // Glow halo intensity
            bloomBlur:       6,      // Glow spread radius (px)
            bloomBrightness: 1.8,    // Glow brightness multiplier
            bloomBlend:      'screen', // CSS mix-blend-mode for compositing
            zIndex:          1,      // Stack order (1 = just above the raw HTML content)
        });

        // BUILD A SNAPSHOT IMAGE OF THE SPLASH CONTENT
        // StaticEffect needs a greyscale image to composite its noise through.
        // We can't directly use the HTML elements, so we render them onto an
        // offscreen canvas (a canvas not attached to the DOM) and pass that.
        const build = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            // Offscreen canvas — exists in memory but isn't visible on the page
            const off  = document.createElement('canvas');
            off.width  = w;
            off.height = h;
            const octx = off.getContext('2d');

            octx.fillStyle = '#000'; // Black background
            octx.fillRect(0, 0, w, h);
            octx.fillStyle    = '#fff'; // White text (greyscale source for the effect)
            octx.textAlign    = 'center';
            octx.textBaseline = 'middle';

            // querySelectorAll returns a NodeList of all matching elements.
            // We collect all the visible text elements from the splash to draw.
            const els = splash.querySelectorAll(
                '.splash-sysid span, .splash-divider, .splash-status span'
            );

            // Helper: draw all elements at a given opacity
            const drawEls = (alpha) => {
                octx.globalAlpha = alpha;
                els.forEach(el => {
                    // getBoundingClientRect() returns an element's position and
                    // size in viewport coordinates — exactly what we need to
                    // replicate the layout on our offscreen canvas.
                    const r  = el.getBoundingClientRect();
                    // getComputedStyle() reads the actual CSS values currently
                    // applied to an element (including inherited values from parent rules).
                    const cs = getComputedStyle(el);
                    octx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
                    // Draw the text centred on the element's bounding box
                    octx.fillText(el.textContent.trim(), r.left + r.width / 2, r.top + r.height / 2);
                });
            };

            drawEls(1);           // Sharp version at full opacity
            octx.filter = 'blur(6px)';
            drawEls(0.3);         // Blurred, faint copy for a soft glow feel
            octx.filter      = 'none';
            octx.globalAlpha = 1;

            // Convert the offscreen canvas to a data URL (a base64 PNG string)
            // then load it as an Image so StaticEffect can use it as its source.
            const img = new Image();
            img.onload = () => this._splashFx.setImage(img);
            img.src = off.toDataURL(); // "data:image/png;base64,..."
        };

        // Build with whatever fonts are loaded right now (may be fallback fonts),
        // then rebuild once document.fonts.ready resolves — a Promise that fulfils
        // when all web fonts (Share Tech Mono, VT323) have finished downloading.
        build();
        document.fonts.ready.then(build);
    },

    // Stop and clean up the splash effect instance
    stopSplashEffect() {
        if (this._splashFx) {
            this._splashFx.destroy(); // StaticEffect.destroy() cancels its rAF loop
            this._splashFx = null;    // Clear the reference so it can be garbage-collected
        }
    },


    // ─── RIGHT PANE CUSTOM SCROLLBAR ─────────────────────────────────────────
    // The browser's native scrollbar is hidden in CSS.
    // These two thin divs (#right-ghost-track and #right-ghost-thumb) replace it.
    // The thumb position is calculated from the scroll state of #right-content
    // and updated whenever the content scrolls or changes.

    initRightScrollbar() {
        const content = document.getElementById('right-content');
        const track   = document.getElementById('right-ghost-track');
        const thumb   = document.getElementById('right-ghost-thumb');
        if (!content || !track || !thumb) return;

        // CALCULATE AND APPLY THUMB POSITION
        const update = () => {
            const viewH  = content.clientHeight;   // Height of the visible area
            const totalH = content.scrollHeight;   // Total height including overflow

            // If content fits without scrolling, hide the thumb entirely
            if (totalH <= viewH) { thumb.style.height = '0'; return; }

            // Thumb height is proportional to how much of the content is visible.
            // Math.max(20, ...) ensures a minimum size so tiny content still gives a usable thumb.
            const thumbH  = Math.max(20, (viewH / totalH) * viewH);

            // scrollR = 0 at the top, 1 at the bottom
            const maxTop  = viewH - thumbH;
            const scrollR = content.scrollTop / (totalH - viewH);

            // Move the thumb by setting its CSS top position
            thumb.style.height = thumbH + 'px';
            thumb.style.top    = (scrollR * maxTop) + 'px';
        };

        // Recalculate on user scroll and on window resize
        content.addEventListener('scroll', update);
        window.addEventListener('resize', update);

        // MUTATION OBSERVER
        // Fires whenever the DOM inside #right-content changes (new elements added).
        // This catches the case where content is injected by cli.js — without this,
        // the scrollbar wouldn't know the content height changed.
        // childList:true — watch for added/removed child elements
        // subtree:true   — watch descendants too, not just direct children
        new MutationObserver(update).observe(content, { childList: true, subtree: true });

        // DRAG-TO-SCROLL
        // Lets the user drag the thumb to scroll, like a real scrollbar.
        let dragging    = false; // Is a drag currently in progress?
        let startY      = 0;    // Mouse Y when drag began
        let startScroll = 0;    // content.scrollTop when drag began

        thumb.addEventListener('mousedown', e => {
            dragging    = true;
            startY      = e.clientY;
            startScroll = content.scrollTop;
            e.preventDefault(); // Prevent text selection during drag
        });

        // mousemove is on the whole document (not just the thumb) so dragging
        // still works even if the mouse moves outside the thumb element.
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            const trackH      = track.clientHeight;
            const thumbH      = thumb.offsetHeight;
            const scrollRange = content.scrollHeight - content.clientHeight;
            // Convert mouse delta into scroll delta using the same ratio
            content.scrollTop = startScroll + (e.clientY - startY) * (scrollRange / (trackH - thumbH));
        });

        document.addEventListener('mouseup', () => { dragging = false; });
    },


    // ─── BOOT + INPUT INITIALISATION ─────────────────────────────────────────
    // Called once, after the splash screen has been dismissed.
    // Starts the boot sequence and sets up a skip handler.

    init() {
        // Allow Enter to skip the boot animation and jump to the end.
        // We define the handler as a named variable so we can remove it later —
        // removeEventListener requires the exact same function reference that
        // was passed to addEventListener, so anonymous arrows won't work here.
        const skipHandler = (e) => {
            if (e.key === 'Enter' && Boot._running) {
                e.preventDefault(); // Prevent form submission / other default actions
                Boot.skip();        // Boot.skip() renders all remaining lines instantly
            }
        };
        document.addEventListener('keydown', skipHandler);

        // Boot.run() starts the animated boot sequence.
        // It takes two arguments:
        //   1. The DOM element to append lines to (#output div)
        //   2. A callback function to run when the sequence finishes
        // Callbacks are a core JavaScript pattern for "do this, then do that" —
        // instead of waiting (which would freeze the browser), you pass a function
        // that will be called when the async work is done.
        Boot.run(document.getElementById('output'), () => {
            // Boot is finished — clean up the skip handler (no longer needed)
            document.removeEventListener('keydown', skipHandler);

            // Show the CLI input line (it was hidden with display:none)
            document.getElementById('input-line').style.display = 'flex';

            // Show command suggestions below the prompt (defined in cli.js)
            CLI.showSuggestions();

            // Scroll to the bottom of the output so the prompt is visible
            CLI.scrollBottom();

            // Start listening for keyboard input at the CLI prompt
            this.bindInput();

            // Start the random ambient glitch engine
            this.scheduleGlitch();
        });
    },


    // ─── FULLSCREEN API ───────────────────────────────────────────────────────
    // The Fullscreen API is unprefixed in modern browsers but older versions
    // used vendor prefixes (webkit for Safari/Chrome, moz for Firefox).
    // Using a chain of if/else checks makes the code work across all versions.
    // The try/catch swallows any errors silently — fullscreen can fail if the
    // user denies the permission, but that shouldn't crash the site.

    requestFullscreen() {
        const el = document.documentElement; // fullscreen the entire page
        try {
            if      (el.requestFullscreen)       el.requestFullscreen();       // Standard
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); // Safari
            else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();    // Old Firefox
        } catch (_) {} // _ is a convention for "we intentionally ignore this value"
    },

    exitFullscreen() {
        try {
            if      (document.exitFullscreen)       document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.mozCancelFullScreen)  document.mozCancelFullScreen();
        } catch (_) {}
    },


    // ─── KEYBOARD INPUT ───────────────────────────────────────────────────────
    // The CLI uses no <input> element. Instead, we intercept every keydown
    // event on the document and manually manage a string (inputBuffer).
    // This gives complete control over what characters are accepted and how
    // they appear — essential for the retro terminal aesthetic.

    // bindInput() is called once, after the boot sequence completes.
    // It attaches the keydown handler for the rest of the session.
    // The arrow function (e) => this.handleKey(e) is needed rather than
    // just this.handleKey directly, because passing a method as a callback
    // loses its `this` binding — the arrow function preserves it.
    bindInput() {
        document.addEventListener('keydown', e => this.handleKey(e));
    },

    handleKey(e) {
        // formFocus guard — don't steal keypresses from real form inputs
        if (this.formFocus) return;

        // Also check if a real input or textarea is currently focused
        // (document.activeElement is the element that currently has focus)
        if (document.activeElement &&
            (document.activeElement.tagName === 'INPUT' ||
             document.activeElement.tagName === 'TEXTAREA')) return;

        // switch/case is like a series of if/else if blocks but more readable
        // when comparing one value against many possible strings.
        switch (e.key) {

            case 'Enter':
                e.preventDefault(); // Prevent browser's default Enter behaviour
                this.submit();      // Process whatever is in inputBuffer
                break;              // `break` exits the switch — without it, execution
                                    // would "fall through" into the next case.

            case 'Backspace':
                e.preventDefault();
                // slice(0, -1) returns everything except the last character —
                // this is how you delete the last typed character
                this.inputBuffer = this.inputBuffer.slice(0, -1);
                this.updateDisplay();
                SoundEngine.play('keypress'); // Subtle audio feedback
                break;

            case 'ArrowUp':
                e.preventDefault();
                // Navigate backwards through command history (older commands)
                // Math.min prevents the index going past the end of the array
                if (CLI.history.length > 0) {
                    CLI.historyIndex = Math.min(CLI.historyIndex + 1, CLI.history.length - 1);
                    this.inputBuffer = CLI.history[CLI.historyIndex];
                    this.updateDisplay();
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                // Navigate forwards through history (newer commands)
                // When index reaches -1 we're back at a blank prompt
                CLI.historyIndex = Math.max(CLI.historyIndex - 1, -1);
                this.inputBuffer = CLI.historyIndex >= 0 ? CLI.history[CLI.historyIndex] : '';
                this.updateDisplay();
                break;

            case 'Tab':
                e.preventDefault(); // Prevent Tab from focusing the next page element
                this.autocomplete();
                break;

            default:
                // Only add printable characters (length === 1 filters out special
                // keys like 'Shift', 'F1', 'ArrowLeft' etc. which have longer key names).
                // Ctrl/Meta/Alt combinations (e.g. Ctrl+C) are excluded to avoid
                // capturing browser shortcuts.
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    this.inputBuffer += e.key; // Append the character to the buffer
                    this.updateDisplay();
                    SoundEngine.play('keypress');
                }
        }
    },

    // Called when Enter is pressed — reads the buffer, clears it, and runs the command
    submit() {
        const cmd = this.inputBuffer;
        this.inputBuffer = '';        // Clear the buffer immediately
        this.updateDisplay();         // Update the visual display to show empty input
        CLI.execute(cmd);             // Hand the command string to the CLI parser
    },

    // submitCommand() is called programmatically (e.g. from links in page content)
    // rather than from keyboard input — same logic as submit() but takes the
    // command string directly rather than reading from the buffer.
    submitCommand(cmd) {
        this.inputBuffer = '';
        this.updateDisplay();
        CLI.execute(cmd);
    },

    // Sync the visual display element with the current inputBuffer string.
    // Called after every buffer change (keypress, backspace, history navigation).
    updateDisplay() {
        document.getElementById('input-display').textContent = this.inputBuffer;
    },

    // TAB AUTOCOMPLETE
    // Looks through all registered CLI commands for one that starts with
    // whatever the user has typed so far. If found, fill in the full command.
    autocomplete() {
        const partial = this.inputBuffer.toLowerCase();
        if (!partial) return; // Nothing typed — nothing to complete

        // Object.keys() returns an array of an object's property names.
        // Array.find() returns the first element that passes the test function.
        // String.startsWith() checks if a string begins with a given substring.
        const match = Object.keys(CLI.commands).find(c => c.startsWith(partial));
        if (match) {
            this.inputBuffer = match;
            this.updateDisplay();
            SoundEngine.play('keypress');
        }
    },


    // ─── AMBIENT GLITCH ENGINE ────────────────────────────────────────────────
    // After boot, random glitch effects fire every 6–20 seconds.
    // This makes the terminal feel alive — like an unstable signal.

    scheduleGlitch() {
        // Random delay between 6s and 20s
        // Math.random() is 0.0–1.0, so * 14000 gives 0–14000ms, plus 6000ms minimum
        const delay = 6000 + Math.random() * 14000;

        // setTimeout returns an ID that can be used to cancel the timer.
        // We store it in glitchTimer in case we ever want to cancel the loop.
        this.glitchTimer = setTimeout(() => {
            this.fireGlitch();     // Play the effect
            this.scheduleGlitch(); // Schedule the NEXT one (self-perpetuating loop)
        }, delay);
    },

    fireGlitch() {
        SoundEngine.play('glitch_burst'); // Play the glitch sound effect

        const overlay = document.getElementById('glitch-overlay');

        // FORCE ANIMATION RESTART TRICK:
        // If we just add 'active' when it's already active, the CSS animation
        // won't restart. The trick is:
        //   1. Remove the class
        //   2. Read a layout property (offsetWidth) — this forces the browser to
        //      flush its rendering pipeline and process the class removal
        //   3. Add the class back — now the animation starts fresh
        // `void` discards the return value (we only care about the side effect).
        overlay.classList.remove('active');
        void overlay.offsetWidth; // Force reflow — browser must recalculate layout
        overlay.classList.add('active');

        // Apply the chromatic aberration keyframe animation to the pane container.
        // Setting style.animation directly (an inline style) overrides the CSS
        // file's animation declaration (which runs the subtle crtDrift animation).
        const panes = document.getElementById('pane-container');
        panes.style.animation = 'caGlitch 0.25s linear forwards';

        // After the glitch, remove the inline style override.
        // The browser then falls back to the CSS file's animation (crtDrift resumes).
        setTimeout(() => {
            panes.style.animation = ''; // Empty string removes the inline style
            overlay.classList.remove('active');
        }, 480); // 480ms is slightly longer than the 0.25s glitch to allow it to finish
    },
};


// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
// DOMContentLoaded fires when the browser has finished parsing all the HTML
// and built the DOM — but before images and stylesheets have fully loaded.
// This is the earliest safe point to look up elements with getElementById().
//
// We wait for this event (rather than running code immediately) because this
// script tag is at the bottom of <body> — in practice the DOM is always ready
// by the time we get here, but the event listener is the correct, safe pattern.
document.addEventListener('DOMContentLoaded', () => Main.setup());
