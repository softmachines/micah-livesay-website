const Boot = {

    get lines() { return SITE_CONTENT.boot; },

    run(outputEl, onComplete) {
        SoundEngine.play('boot_static');

        const CHAR_DELAY   = 28;   // ms per character typed
        const BLINK_HALF   = 250;  // ms per half-cycle (on or off)
        const BLINK_COUNT  = 2;   // number of complete on/off flashes before moving on

        // Pre-pass: accumulate time added by typewriter lines so all
        // subsequent absolute timestamps stay correctly ordered
        let twOffset = 0;
        const scheduled = this.lines.map(([delay, text, cls, mode]) => {
            const adjustedDelay = delay + twOffset;
            if (mode === 'typewriter') {
                twOffset += text.length * CHAR_DELAY + (BLINK_HALF * BLINK_COUNT * 2) + 80;
            }
            return [adjustedDelay, text, cls, mode];
        });

        let lastTickDelay = -1;
        let maxDelay = 0;

        scheduled.forEach(([delay, text, cls, mode]) => {
            maxDelay = Math.max(maxDelay, delay);

            setTimeout(() => {
                if (text === '__PROGRESS__') {
                    this._renderProgressBar(outputEl);

                } else if (text === '') {
                    outputEl.appendChild(document.createElement('br'));

                } else if (mode === 'typewriter') {
                    // ── Typewriter mode ──────────────────────────────────
                    const span = document.createElement('span');
                    span.className = `line ${cls}`;
                    span.textContent = '';
                    outputEl.appendChild(span);
                    SoundEngine.play('boot_tick');

                    let i = 0;
                    const typeNext = () => {
                        if (i < text.length) {
                            span.textContent = text.slice(0, i + 1);
                            i++;
                            // Play a subtle keypress tick while typing
                            if (i % 3 === 0) SoundEngine.play('keypress');
                            setTimeout(typeNext, CHAR_DELAY);
                        } else {
                            // Typing done — blink cursor exactly BLINK_COUNT times then move on
                            const cur = document.createElement('span');
                            cur.textContent = '█';
                            cur.style.cssText = 'color:var(--green);text-shadow:0 0 8px rgba(0,255,65,0.8);';
                            span.appendChild(cur);

                            let phase = 0; // counts half-cycles (on=even, off=odd)
                            const doBlink = () => {
                                phase++;
                                cur.style.opacity = phase % 2 === 0 ? '1' : '0';
                                if (phase < BLINK_COUNT * 2) {
                                    setTimeout(doBlink, BLINK_HALF);
                                } else {
                                    // All blinks done — remove cursor, add line break
                                    cur.remove();
                                    outputEl.appendChild(document.createElement('br'));
                                    requestAnimationFrame(() => {
                                        const t = outputEl.parentElement;
                                        t.scrollTop = t.scrollHeight;
                                    });
                                }
                            };
                            setTimeout(doBlink, BLINK_HALF); // start first off-phase
                        }
                        requestAnimationFrame(() => {
                            const t = outputEl.parentElement;
                            t.scrollTop = t.scrollHeight;
                        });
                    };
                    typeNext();

                } else if (mode === 'icons') {
                    // ── SVG icon line ─────────────────────────────────────
                    const row = document.createElement('span');
                    row.className = `line ${cls}`;
                    row.style.cssText = 'display:flex;align-items:center;gap:16px;padding-left:3ch;';

                    text.split('|').forEach(src => {
                        const img = document.createElement('img');
                        img.src = src.trim();
                        img.style.cssText = `
                            height:1.6em;
                            width:auto;
                            filter:
                                invert(57%) sepia(88%) saturate(394%)
                                hue-rotate(78deg) brightness(116%) contrast(108%)
                                drop-shadow(0 0 4px rgba(0,255,65,0.7));
                            opacity:0.85;
                        `;
                        row.appendChild(img);
                    });

                    outputEl.appendChild(row);
                    outputEl.appendChild(document.createElement('br'));

                } else {
                    // ── Normal line ──────────────────────────────────────
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

                requestAnimationFrame(() => {
                    const terminal = outputEl.parentElement;
                    terminal.scrollTop = terminal.scrollHeight;
                });
            }, delay);
        });

        setTimeout(() => {
            SoundEngine.play('boot_ready');
            if (onComplete) onComplete();
        }, maxDelay + 300);
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
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            fill.style.width = progress + '%';
            pct.textContent = Math.floor(progress) + '%';
        }, 55);
    },
};
