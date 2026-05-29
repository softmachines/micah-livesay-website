const Main = {

    inputBuffer: '',
    formFocus: false,
    glitchTimer: null,
    _started: false,

    // ── Splash + session start ────────────────────────────────────────────────

    setup() {
        const splash = document.getElementById('splash');

        const start = () => {
            if (this._started) return;
            this._started = true;

            this.requestFullscreen();

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
