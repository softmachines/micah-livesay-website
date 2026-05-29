const Main = {

    inputBuffer: '',
    formFocus: false,
    glitchTimer: null,
    _started: false,
    _cursorX: 0,
    _cursorY: 0,
    _glitching: false,

    // ── Splash + session start ────────────────────────────────────────────────

    setup() {
        this.initCursorHide();
        this.initCursorTrail();
        this.initSplashEffect();
        const splash = document.getElementById('splash');

        const start = () => {
            if (this._started) return;
            this._started = true;

            this.requestFullscreen();
            this.stopSplashEffect();

            // Flash → fade the splash out
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
                this.init();
            }, 580);
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (frame >= FRAMES) {
                this._glitching = false;
                onDone();
                return;
            }

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

    _splashFrameId: null,
    _splashRunning: false,

    initSplashEffect() {
        const canvas = document.getElementById('splash-canvas');
        if (!canvas) return;

        const ctx       = canvas.getContext('2d');
        const srcCanvas = document.createElement('canvas');
        const srcCtx    = srcCanvas.getContext('2d');
        const INF       = 0.20; // 20% image influence — matches slider position user found

        this._splashRunning = true;
        let srcReady        = false;
        let lastFrame       = 0;
        const TARGET_MS     = 1000 / 30; // cap at ~30fps to stay light on CPU

        const sizeCanvases = () => {
            canvas.width    = window.innerWidth;
            canvas.height   = window.innerHeight;
            srcCanvas.width  = canvas.width;
            srcCanvas.height = canvas.height;
            if (srcReady) drawSrc();
        };

        // Draw image cover-fitted into srcCanvas (like background-size: cover)
        const img = new Image();
        const drawSrc = () => {
            const w = srcCanvas.width, h = srcCanvas.height;
            const iw = img.naturalWidth, ih = img.naturalHeight;
            const scale = Math.max(w / iw, h / ih);
            const sw = iw * scale, sh = ih * scale;
            srcCtx.clearRect(0, 0, w, h);
            srcCtx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
        };

        img.onload = () => {
            srcReady = true;
            drawSrc();
        };
        img.src = 'images/we.webp';

        const drawFrame = () => {
            const w = canvas.width, h = canvas.height;
            const out = ctx.createImageData(w, h);
            const d   = out.data;
            const src = srcReady ? srcCtx.getImageData(0, 0, w, h).data : null;

            const rowMod = new Float32Array(h);
            for (let y = 0; y < h; y++) rowMod[y] = 0.55 + Math.random() * 0.9;

            for (let y = 0; y < h; y++) {
                const rm = rowMod[y];
                for (let x = 0; x < w; x++) {
                    const p = (y * w + x) * 4;

                    const luma = src
                        ? (src[p] * 0.299 + src[p+1] * 0.587 + src[p+2] * 0.114) / 255
                        : Math.random(); // pure noise before image loads

                    const randBright = Math.random();
                    const imgBright  = luma * (0.6 + Math.random() * 0.8);
                    const bright     = randBright * (1 - INF) + imgBright * INF;
                    const v          = bright * rm;
                    const roll       = Math.random();

                    if (roll > 0.988) {
                        // White spark
                        const sp = Math.min(1, v * 1.5);
                        d[p] = d[p+1] = d[p+2] = Math.floor(sp * 235);
                        d[p+3] = 255;
                    } else if (roll > 0.970) {
                        // Pink aberration
                        const b = Math.floor(v * 240);
                        d[p] = b; d[p+1] = 0; d[p+2] = Math.floor(b * 0.55);
                        d[p+3] = 255;
                    } else if (roll > 0.952) {
                        // Cyan aberration
                        d[p] = 0; d[p+1] = Math.floor(v * 220); d[p+2] = Math.floor(v * 180);
                        d[p+3] = 255;
                    } else {
                        // Green static
                        d[p] = 0; d[p+1] = Math.floor(v * 255); d[p+2] = Math.floor(v * 20);
                        d[p+3] = 255;
                    }
                }
            }

            ctx.putImageData(out, 0, 0);

            // Occasional horizontal interference line
            if (Math.random() > 0.55) {
                const ly = Math.floor(Math.random() * h);
                ctx.fillStyle = `rgba(0,255,65,${Math.random() * 0.18 * INF})`;
                ctx.fillRect(0, ly, w, 1 + Math.floor(Math.random() * 2));
            }
        };

        const loop = (ts) => {
            if (!this._splashRunning) return;
            if (ts - lastFrame >= TARGET_MS) {
                lastFrame = ts;
                drawFrame();
            }
            this._splashFrameId = requestAnimationFrame(loop);
        };

        sizeCanvases();
        this._splashFrameId = requestAnimationFrame(loop);
    },

    stopSplashEffect() {
        this._splashRunning = false;
        if (this._splashFrameId) {
            cancelAnimationFrame(this._splashFrameId);
            this._splashFrameId = null;
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

        const panes = document.getElementById('pane-container');
        panes.style.textShadow = '2px 0 #ff2d78, -2px 0 #00ffcc';
        panes.style.transform  = `translate(${(Math.random() - 0.5) * 3}px, 0)`;

        setTimeout(() => {
            panes.style.textShadow = '';
            panes.style.transform  = '';
            overlay.classList.remove('active');
        }, 180);
    },
};

document.addEventListener('DOMContentLoaded', () => Main.setup());
