const Boot = {

    lines: [
        // [delay_ms, text, cssClass]
        [0,     '╔══════════════════════════════════════════════════════════════╗', 'line-dim'],
        [100,   '║  MICAH_OS  v2.0.77 // CYBERSOUND TERMINAL EDITION            ║', 'line-pink'],
        [200,   '║  AUDIO ENGINEERING SYSTEMS // UNAUTHORIZED ACCESS DENIED     ║', 'line-dim'],
        [300,   '╚══════════════════════════════════════════════════════════════╝', 'line-dim'],
        [750,   '', ''],
        [900,   '>> BIOS v4.2.0 — PHOENIX TECHNOLOGIES', 'line-dim'],
        [1050,  '>> RUNNING POST...', 'line-dim'],
        [1250,  '', ''],
        [1400,  '   [CPU]    Core i∞ Phantom @ 4.20 GHz ................... OK', 'line-green'],
        [1600,  '   [MEM]    65,536 KB Extended RAM ........................ OK', 'line-green'],
        [1800,  '   [AUDIO]  Pro Audio Interface / 24-bit DAC ............. OK', 'line-green'],
        [2000,  '   [GPU]    Phosphor Display Unit ......................... OK', 'line-green'],
        [2200,  '   [NET]    Neural Link established ....................... OK', 'line-green'],
        [2400,  '', ''],
        [2550,  '>> LOADING AUDIO SUBSYSTEM...', 'line-dim'],
        [2800,  '   [DSP]    Digital Signal Processors .................... ONLINE', 'line-green'],
        [3050,  '   [DAW]    Sound Engine v9.1 ............................ READY', 'line-green'],
        [3300,  '   [FX]     Effects chain: EQ / COMP / REVERB / DELAY .... LOADED', 'line-green'],
        [3550,  '   [SYNTH]  Synthesis modules ............................ ARMED', 'line-green'],
        [3800,  '', ''],
        [4000,  '>> MOUNTING FILESYSTEMS...', 'line-dim'],
        [4250,  '   /profile    ........ MOUNTED', 'line-green'],
        [4500,  '   /portfolio  ........ MOUNTED', 'line-green'],
        [4750,  '   /blog       ........ MOUNTED', 'line-green'],
        [4950,  '   /contact    ........ MOUNTED', 'line-green'],
        [5200,  '', ''],
        [5350,  '>> RUNNING DIAGNOSTICS...', 'line-dim'],
        [5600,  '   ALL SYSTEMS NOMINAL', 'line-green'],
        [5850,  '   SIGNAL CHAIN CLEAN', 'line-green'],
        [6100,  '', ''],
        [6300,  '__PROGRESS__', 'progress'],  // special token — renders animated bar
        [7450,  '', ''],
        [7750,  '╔══════════════════════════════════════════════════════════════╗', 'line-pink'],
        [8000,  '║                                                              ║', 'line-pink'],
        [8150,  '║   ██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗   ║', 'line-pink'],
        [8250,  '║   ██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║   ║', 'line-pink'],
        [8350,  '║   ██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║   ║', 'line-pink'],
        [8450,  '║   ██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║   ║', 'line-pink'],
        [8550,  '║   ╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║   ║', 'line-pink'],
        [8650,  '║    ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝   ║', 'line-pink'],
        [8750,  '║                                                              ║', 'line-pink'],
        [8900,  '║   MICAH LIVESAY  //  AUDIO ENGINEER & SOUND DESIGNER        ║', 'line-dim'],
        [9050,  '║                                                              ║', 'line-pink'],
        [9200,  '╚══════════════════════════════════════════════════════════════╝', 'line-pink'],
        [9500,  '', ''],
        [9700,  'System ready...', 'line-dim'],
        [9800,  'Type a command from the list below.', 'line-green'],
        [9900,  '', ''],
    ],

    run(outputEl, onComplete) {
        SoundEngine.play('boot_static');

        let lastTickDelay = -1;
        let maxDelay = 0;

        this.lines.forEach(([delay, text, cls]) => {
            maxDelay = Math.max(maxDelay, delay);

            setTimeout(() => {
                if (text === '__PROGRESS__') {
                    this._renderProgressBar(outputEl);
                } else if (text === '') {
                    outputEl.appendChild(document.createElement('br'));
                } else {
                    const span = document.createElement('span');
                    span.className = `line ${cls}`;
                    span.textContent = text;
                    outputEl.appendChild(span);
                }

                // Play tick every other content line
                if (text && text !== '__PROGRESS__' && delay > 900 && delay !== lastTickDelay) {
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
        label.textContent = 'LOADING ';

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
