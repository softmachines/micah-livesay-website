const Main = {

    inputBuffer: '',
    formFocus: false,
    glitchTimer: null,

    init() {
        Boot.run(document.getElementById('output'), () => {
            // Show the input line after boot
            document.getElementById('input-line').style.display = 'flex';

            // Show initial command suggestions
            CLI.showSuggestions();
            CLI.scrollBottom();

            // Start input listener
            this.bindInput();

            // Start ambient glitch engine
            this.scheduleGlitch();
        });
    },

    // ── Input ─────────────────────────────────────────────────────────────────

    bindInput() {
        document.addEventListener('keydown', e => this.handleKey(e));
    },

    handleKey(e) {
        // Let the form handle its own typing
        if (this.formFocus) return;
        if (document.activeElement && (
            document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA'
        )) return;

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

    // Called by CLI suggestion buttons
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
    // Fires random CRT glitch visuals + sound at unpredictable intervals

    scheduleGlitch() {
        const delay = 6000 + Math.random() * 14000; // 6–20 seconds between glitches
        this.glitchTimer = setTimeout(() => {
            this.fireGlitch();
            this.scheduleGlitch();
        }, delay);
    },

    fireGlitch() {
        SoundEngine.play('glitch_burst');

        const overlay = document.getElementById('glitch-overlay');
        overlay.classList.remove('active');
        // Force reflow so the animation re-triggers
        void overlay.offsetWidth;
        overlay.classList.add('active');

        // Briefly shift the terminal text (chromatic aberration feel)
        const terminal = document.getElementById('terminal');
        terminal.style.textShadow = '2px 0 #ff2d78, -2px 0 #00ffcc';
        terminal.style.transform = `translate(${(Math.random() - 0.5) * 3}px, 0)`;

        setTimeout(() => {
            terminal.style.textShadow = '';
            terminal.style.transform = '';
            overlay.classList.remove('active');
        }, 180);
    },
};

document.addEventListener('DOMContentLoaded', () => Main.init());
