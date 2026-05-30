const Boot = {

    get lines() { return SITE_CONTENT.boot; },

    // ── State ─────────────────────────────────────────────────────────────────
    _running:   false,
    _outputEl:  null,
    _onComplete: null,
    _timeouts:  [],     // all pending setTimeout IDs
    _scheduled: [],     // pre-computed lines with adjusted timestamps
    _rendered:  null,   // Set of indices already rendered

    // ── Run ───────────────────────────────────────────────────────────────────

    run(outputEl, onComplete) {
        this._outputEl   = outputEl;
        this._onComplete = onComplete;
        this._running    = true;
        this._timeouts   = [];
        this._rendered   = new Set();

        SoundEngine.play('boot_static');

        const CHAR_DELAY  = 28;
        const BLINK_HALF  = 250;
        const BLINK_COUNT = 2;

        // Pre-pass: shift timestamps forward for typewriter lines
        let twOffset = 0;
        this._scheduled = this.lines.map(([delay, text, cls, mode]) => {
            const adjustedDelay = delay + twOffset;
            if (mode === 'typewriter') {
                twOffset += text.length * CHAR_DELAY + (BLINK_HALF * BLINK_COUNT * 2) + 80;
            }
            return [adjustedDelay, text, cls, mode];
        });

        let lastTickDelay = -1;
        let maxDelay = 0;

        this._scheduled.forEach(([delay, text, cls, mode], index) => {
            maxDelay = Math.max(maxDelay, delay);

            const id = setTimeout(() => {
                if (!this._running) return; // skip was called
                this._rendered.add(index);

                if (text === '__PROGRESS__') {
                    this._renderProgressBar(outputEl);

                } else if (text === '') {
                    outputEl.appendChild(document.createElement('br'));

                } else if (mode === 'typewriter') {
                    const span = document.createElement('span');
                    span.className = `line ${cls}`;
                    span.textContent = '';
                    outputEl.appendChild(span);
                    SoundEngine.play('boot_tick');

                    let i = 0;
                    const typeNext = () => {
                        if (!this._running) { span.textContent = text; return; }
                        if (i < text.length) {
                            span.textContent = text.slice(0, i + 1);
                            i++;
                            if (i % 3 === 0) SoundEngine.play('keypress');
                            setTimeout(typeNext, CHAR_DELAY);
                        } else {
                            const cur = document.createElement('span');
                            cur.textContent = '█';
                            cur.style.cssText = 'color:var(--green);text-shadow:0 0 8px rgba(0,255,65,0.8);';
                            span.appendChild(cur);

                            let phase = 0;
                            const doBlink = () => {
                                if (!this._running) { cur.remove(); outputEl.appendChild(document.createElement('br')); return; }
                                phase++;
                                cur.style.opacity = phase % 2 === 0 ? '1' : '0';
                                if (phase < BLINK_COUNT * 2) {
                                    setTimeout(doBlink, BLINK_HALF);
                                } else {
                                    cur.remove();
                                    outputEl.appendChild(document.createElement('br'));
                                    requestAnimationFrame(() => { const t = outputEl.parentElement; t.scrollTop = t.scrollHeight; });
                                }
                            };
                            setTimeout(doBlink, BLINK_HALF);
                        }
                        requestAnimationFrame(() => { const t = outputEl.parentElement; t.scrollTop = t.scrollHeight; });
                    };
                    typeNext();

                } else if (mode === 'icons') {
                    this._renderIcons(outputEl, text, cls);

                } else {
                    const span = document.createElement('span');
                    span.className = `line ${cls}`;
                    span.textContent = text;
                    outputEl.appendChild(span);
                }

                if (text && text !== '__PROGRESS__' && mode !== 'typewriter' &&
                    delay > 900 && delay !== lastTickDelay) {
                    SoundEngine.play('boot_tick');
                    lastTickDelay = delay;
                }

                requestAnimationFrame(() => { const t = outputEl.parentElement; t.scrollTop = t.scrollHeight; });
            }, delay);

            this._timeouts.push(id);
        });

        const completeId = setTimeout(() => {
            this._running = false;
            SoundEngine.play('boot_ready');
            if (this._onComplete) { this._onComplete(); this._onComplete = null; }
        }, maxDelay + 300);
        this._timeouts.push(completeId);
    },

    // ── Skip ──────────────────────────────────────────────────────────────────

    skip() {
        if (!this._running) return;

        // Cancel all pending timeouts
        this._timeouts.forEach(id => clearTimeout(id));
        this._timeouts  = [];
        this._running   = false;

        // Render every line that hasn't appeared yet — instantly, no animation
        const outputEl = this._outputEl;
        this._scheduled.forEach(([, text, cls, mode], index) => {
            if (this._rendered.has(index)) return;

            if (text === '__PROGRESS__') {
                this._renderProgressBarFull(outputEl);
            } else if (text === '') {
                outputEl.appendChild(document.createElement('br'));
            } else if (mode === 'icons') {
                this._renderIcons(outputEl, text, cls);
            } else if (mode === 'typewriter') {
                // Typewriter lines: full text instantly + <br> (matches normal path after cursor blink)
                const span = document.createElement('span');
                span.className = `line ${cls}`;
                span.textContent = text;
                outputEl.appendChild(span);
                outputEl.appendChild(document.createElement('br'));
            } else {
                // Normal lines: no <br> needed — display:block handles line breaks
                const span = document.createElement('span');
                span.className = `line ${cls}`;
                span.textContent = text;
                if (text.startsWith('System ready')) span.id = 'boot-end';
                outputEl.appendChild(span);
            }
        });

        // Scroll and complete
        requestAnimationFrame(() => {
            const t = outputEl.parentElement;
            if (t) t.scrollTop = t.scrollHeight;
        });

        SoundEngine.play('boot_ready');
        if (this._onComplete) { this._onComplete(); this._onComplete = null; }
    },

    // ── Render helpers ────────────────────────────────────────────────────────

    _renderIcons(outputEl, text, cls) {
        const row = document.createElement('span');
        row.className = `line ${cls}`;
        row.style.cssText = 'display:flex;align-items:center;gap:16px;padding-left:3ch;';
        text.split('|').forEach(src => {
            const img = document.createElement('img');
            img.src = src.trim();
            img.style.cssText = `
                height:1.6em; width:auto;
                filter: invert(57%) sepia(88%) saturate(394%)
                        hue-rotate(78deg) brightness(116%) contrast(108%)
                        drop-shadow(0 0 4px rgba(0,255,65,0.7));
                opacity:0.85;
            `;
            row.appendChild(img);
        });
        outputEl.appendChild(row);
        outputEl.appendChild(document.createElement('br'));
    },

    _renderProgressBar(outputEl) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin: 6px 0;';
        const label = document.createElement('span');
        label.className = 'line line-dim';
        label.textContent = 'LOADING SONIC IMPRINT ';
        const track = document.createElement('div');
        track.className = 'progress-track';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        track.appendChild(fill);
        const pct = document.createElement('span');
        pct.className = 'line line-green';
        pct.style.cssText = 'margin-left: 10px; display: inline;';
        pct.textContent = '0%';
        wrapper.appendChild(label);
        wrapper.appendChild(track);
        wrapper.appendChild(pct);
        outputEl.appendChild(wrapper);
        outputEl.appendChild(document.createElement('br'));

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 6 + 1.5;
            if (progress >= 100) { progress = 100; clearInterval(interval); }
            fill.style.width = progress + '%';
            pct.textContent = Math.floor(progress) + '%';
        }, 55);
    },

    // Progress bar rendered instantly at 100% for the skip path
    _renderProgressBarFull(outputEl) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin: 6px 0;';
        const label = document.createElement('span');
        label.className = 'line line-dim';
        label.textContent = 'LOADING SONIC IMPRINT ';
        const track = document.createElement('div');
        track.className = 'progress-track';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = '100%';
        track.appendChild(fill);
        const pct = document.createElement('span');
        pct.className = 'line line-green';
        pct.style.cssText = 'margin-left: 10px; display: inline;';
        pct.textContent = '100%';
        wrapper.appendChild(label);
        wrapper.appendChild(track);
        wrapper.appendChild(pct);
        outputEl.appendChild(wrapper);
        outputEl.appendChild(document.createElement('br'));
    },
};
