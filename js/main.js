const Main = {

    inputBuffer: '',
    formFocus: false,
    glitchTimer: null,
    _started: false,
    _splashFx: null,
    _cursorX: 0,
    _cursorY: 0,
    _glitching: false,

    // ── Splash + session start ────────────────────────────────────────────────

    setup() {
        this.initCursorHide();
        this.initCursorTrail();
        const splash = document.getElementById('splash');

        const start = () => {
            if (this._started) return;
            this._started = true;

            // Phase 1: glitch out the splash text (0.65s)
            const content = splash.querySelector('.splash-content');
            if (content) content.classList.add('glitch-out');

            // Phase 2: after text is gone, go fullscreen then fade the splash container
            setTimeout(() => {
                this.requestFullscreen();
                splash.classList.add('fade-out');
                setTimeout(() => {
                    splash.style.display = 'none';
                    this.init();
                }, 580);
            }, 680);
        };

        // Any real key dismisses the splash (ignore lone modifiers)
        document.addEventListener('keydown', (e) => {
            if (['Shift','Control','Alt','Meta','CapsLock','Tab'].includes(e.key)) return;
            start();
        });

        splash.addEventListener('click', start);
    },

    // ── Phosphor cursor trail ─────────────────────────────────────────────────

    initCursorTrail() {
        const canvas = document.getElementById('cursor-trail');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const trail   = [];
        const DURATION = 280; // ms — how long each trail point persists

        document.addEventListener('mousemove', (e) => {
            trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        });

        const draw = () => {
            // Glitch animation has full control of the canvas — skip trail draw
            if (this._glitching) { requestAnimationFrame(draw); return; }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Only render trail when cursor is visible
            if (!document.documentElement.classList.contains('cursor-hidden')) {
                const now = performance.now();

                // Drop expired points
                while (trail.length > 0 && now - trail[0].t > DURATION) trail.shift();

                // Draw trail — skip the last 3 points (essentially current cursor pos)
                for (let i = 0; i < trail.length - 3; i++) {
                    const p    = trail[i];
                    const life = 1 - (now - p.t) / DURATION; // 1 → 0 as it ages
                    const size = Math.max(0.4, 1.8 * life);

                    ctx.save();
                    ctx.globalAlpha = life * 0.28; // very faint — max ~28% opacity
                    ctx.shadowBlur  = 5 * life;
                    ctx.shadowColor = '#00ff41';
                    ctx.fillStyle   = '#00ff41';
                    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
                    ctx.restore();
                }
            }

            requestAnimationFrame(draw);
        };

        requestAnimationFrame(draw);
    },

    // ── Cursor hide / show on idle ────────────────────────────────────────────

    initCursorHide() {
        const root = document.documentElement;
        let hideTimer = null;

        const hideCursor = () => {
            // If we have a known position, play the glitch-out before hiding
            if (this._cursorX || this._cursorY) {
                this._triggerGlitchHide(() => root.classList.add('cursor-hidden'));
            } else {
                root.classList.add('cursor-hidden');
            }
        };

        const showCursor = () => {
            root.classList.remove('cursor-hidden');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(hideCursor, 1000);
        };

        hideCursor();
        document.addEventListener('mousemove', (e) => {
            this._cursorX = e.clientX;
            this._cursorY = e.clientY;
            showCursor();
        });
    },

    // ── Chromatic aberration glitch on cursor hide ────────────────────────────

    _triggerGlitchHide(onDone) {
        // Hide the cursor sprite immediately — the glitch canvas effect
        // plays but the actual cursor is never visible during the animation
        document.documentElement.classList.add('cursor-hidden');

        const canvas = document.getElementById('cursor-trail');
        if (!canvas) { onDone(); return; }

        const ctx    = canvas.getContext('2d');
        const x      = this._cursorX;
        const y      = this._cursorY;
        const FRAMES = 7;
        let   frame  = 0;

        this._glitching = true;

        // Draw one channel of the cursor crosshair at an offset position
        const drawChannel = (cx, cy, color, alpha) => {
            ctx.save();
            ctx.globalAlpha  = alpha;
            ctx.strokeStyle  = color;
            ctx.fillStyle    = color;
            ctx.lineWidth    = 1.5;
            ctx.shadowBlur   = 10;
            ctx.shadowColor  = color;
            ctx.beginPath();
            ctx.moveTo(cx - 14, cy); ctx.lineTo(cx - 4, cy);
            ctx.moveTo(cx +  4, cy); ctx.lineTo(cx + 14, cy);
            ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy - 4);
            ctx.moveTo(cx, cy +  4); ctx.lineTo(cx, cy + 14);
            ctx.stroke();
            ctx.fillRect(cx - 1, cy - 1, 2, 2);
            ctx.restore();
        };

        const animate = () => {
            if (frame >= FRAMES) {
                // Hide cursor BEFORE clearing canvas so there's no gap frame
                // where the canvas is empty but cursor-hidden isn't applied yet
                onDone();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this._glitching = false;
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const progress = frame / FRAMES;
            // Spread starts wide and reduces slightly — channels stay separated
            const spread  = 10 - progress * 4;
            const alpha   = 1 - progress * 0.25;
            // Random jitter increases chaos on later frames
            const jx = (Math.random() - 0.5) * (2 + progress * 4);
            const jy = (Math.random() - 0.5) * (1 + progress * 2);

            drawChannel(x - spread + jx,      y + jy,      'rgba(255,45,120,0.9)',  alpha * 0.9); // pink left
            drawChannel(x + spread + jx * 0.5, y - jy * 0.5, 'rgba(0,255,204,0.9)', alpha * 0.9); // cyan right
            drawChannel(x + jx * 0.3,          y + jy * 0.3, '#00ff41',              alpha);       // green centre

            frame++;
            setTimeout(animate, 28); // ~7 frames × 28ms ≈ 200ms total
        };

        animate();
    },

    // ── Splash image-in-static effect ────────────────────────────────────────

    initSplashEffect() {
        const splash = document.getElementById('splash');
        if (!splash) return;

        // Create the effect immediately — no delay, no pop-in
        // bloomBlend:'normal' avoids mix-blend-mode:screen leaking through
        // the fixed splash container onto the CRT wrapper behind it
        this._splashFx = new StaticEffect(splash, {
            brightness:      0.85,
            bloomOpacity:    0.4,
            bloomBlur:       6,
            bloomBrightness: 1.8,
            bloomBlend:      'screen',
            zIndex:          1,
        });

        const build = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            const off  = document.createElement('canvas');
            off.width  = w;
            off.height = h;
            const octx = off.getContext('2d');

            octx.fillStyle = '#000';
            octx.fillRect(0, 0, w, h);
            octx.fillStyle    = '#fff';
            octx.textAlign    = 'center';
            octx.textBaseline = 'middle';

            const els = splash.querySelectorAll(
                '.splash-sysid span, .splash-divider, .splash-status span'
            );

            const drawEls = (alpha) => {
                octx.globalAlpha = alpha;
                els.forEach(el => {
                    const r  = el.getBoundingClientRect();
                    const cs = getComputedStyle(el);
                    octx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
                    octx.fillText(el.textContent.trim(), r.left + r.width / 2, r.top + r.height / 2);
                });
            };

            drawEls(1);
            octx.filter = 'blur(6px)';
            drawEls(0.3);
            octx.filter      = 'none';
            octx.globalAlpha = 1;

            const img = new Image();
            img.onload = () => this._splashFx.setImage(img);
            img.src = off.toDataURL();
        };

        // Build source immediately with whatever font is available,
        // then rebuild once web fonts are confirmed loaded
        build();
        document.fonts.ready.then(build);
    },

    stopSplashEffect() {
        if (this._splashFx) {
            this._splashFx.destroy();
            this._splashFx = null;
        }
    },

    // ── Boot + input init ─────────────────────────────────────────────────────

    init() {
        Boot.run(document.getElementById('output'), () => {
            document.getElementById('input-line').style.display = 'flex';
            CLI.showSuggestions();
            CLI.scrollBottom();
            this.bindInput();
            this.scheduleGlitch();
        });
    },

    // ── Fullscreen API ────────────────────────────────────────────────────────

    requestFullscreen() {
        const el = document.documentElement;
        try {
            if      (el.requestFullscreen)       el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
        } catch (_) {}
    },

    exitFullscreen() {
        try {
            if      (document.exitFullscreen)       document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.mozCancelFullScreen)  document.mozCancelFullScreen();
        } catch (_) {}
    },

    // ── Keyboard input ────────────────────────────────────────────────────────

    bindInput() {
        document.addEventListener('keydown', e => this.handleKey(e));
    },

    handleKey(e) {
        if (this.formFocus) return;
        if (document.activeElement &&
            (document.activeElement.tagName === 'INPUT' ||
             document.activeElement.tagName === 'TEXTAREA')) return;

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.submit();
                break;

            case 'Backspace':
                e.preventDefault();
                this.inputBuffer = this.inputBuffer.slice(0, -1);
                this.updateDisplay();
                SoundEngine.play('keypress');
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (CLI.history.length > 0) {
                    CLI.historyIndex = Math.min(CLI.historyIndex + 1, CLI.history.length - 1);
                    this.inputBuffer = CLI.history[CLI.historyIndex];
                    this.updateDisplay();
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                CLI.historyIndex = Math.max(CLI.historyIndex - 1, -1);
                this.inputBuffer = CLI.historyIndex >= 0 ? CLI.history[CLI.historyIndex] : '';
                this.updateDisplay();
                break;

            case 'Tab':
                e.preventDefault();
                this.autocomplete();
                break;

            default:
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    this.inputBuffer += e.key;
                    this.updateDisplay();
                    SoundEngine.play('keypress');
                }
        }
    },

    submit() {
        const cmd = this.inputBuffer;
        this.inputBuffer = '';
        this.updateDisplay();
        CLI.execute(cmd);
    },

    submitCommand(cmd) {
        this.inputBuffer = '';
        this.updateDisplay();
        CLI.execute(cmd);
    },

    updateDisplay() {
        document.getElementById('input-display').textContent = this.inputBuffer;
    },

    autocomplete() {
        const partial = this.inputBuffer.toLowerCase();
        if (!partial) return;
        const match = Object.keys(CLI.commands).find(c => c.startsWith(partial));
        if (match) {
            this.inputBuffer = match;
            this.updateDisplay();
            SoundEngine.play('keypress');
        }
    },

    // ── Ambient glitch engine ─────────────────────────────────────────────────

    scheduleGlitch() {
        const delay = 6000 + Math.random() * 14000;
        this.glitchTimer = setTimeout(() => {
            this.fireGlitch();
            this.scheduleGlitch();
        }, delay);
    },

    fireGlitch() {
        SoundEngine.play('glitch_burst');

        const overlay = document.getElementById('glitch-overlay');
        overlay.classList.remove('active');
        void overlay.offsetWidth;
        overlay.classList.add('active');

        // Apply CA glitch keyframes to all terminal content —
        // temporarily overrides the crtDrift animation
        const panes = document.getElementById('pane-container');
        panes.style.animation = 'caGlitch 0.25s linear forwards';

        setTimeout(() => {
            // Remove inline override — CSS crtDrift resumes automatically
            panes.style.animation = '';
            overlay.classList.remove('active');
        }, 480);
    },
};

document.addEventListener('DOMContentLoaded', () => Main.setup());
