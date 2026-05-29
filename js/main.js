const Main = {

    inputBuffer: '',
    formFocus: false,
    glitchTimer: null,
    _started: false,

    // ── Splash + session start ────────────────────────────────────────────────

    setup() {
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
