const CLI = {

    history: [],
    historyIndex: -1,
    _animDelay: 0,      // left pane print delay accumulator
    _rightDelay: 0,     // right pane print delay accumulator
    _lineInterval: 48,  // ms between each line
    splitOpen: false,

    commands: {
        help:      { desc: 'Show available commands',             run: () => CLI.showHelp() },
        profile:   { desc: 'About Micah Livesay',                 run: () => CLI.showProfile() },
        portfolio: { desc: 'Sound design & audio work',           run: () => CLI.showPortfolio() },
        blog:      { desc: 'Articles & sound diaries',            run: () => CLI.showBlog() },
        contact:   { desc: 'Get in touch',                        run: () => CLI.showContact() },
        services:  { desc: 'What I offer',                        run: () => CLI.showServices() },
        whoami:    { desc: 'Quick identity readout',              run: () => CLI.whoami() },
        sound:     { desc: 'Toggle audio on / off',               run: () => CLI.toggleSound() },
        clear:     { desc: 'Clear the terminal screen',           run: () => CLI.clearScreen() },
        exit:      { desc: 'Terminate session & exit fullscreen', run: () => CLI.shutdown() },
    },

    // Commands that open the right pane
    _contentCommands: new Set(['help','profile','portfolio','blog','contact','services','whoami']),

    // ── Execute ───────────────────────────────────────────────────────────────

    execute(raw) {
        const input = raw.trim().toLowerCase();
        if (!input) return;

        this.history.unshift(raw.trim());
        this.historyIndex = -1;
        this._animDelay = 0;

        this.print(`MICAH@LIVESAY:~$ ${raw.trim()}`, 'line-cmd-echo');
        this.br();

        SoundEngine.play('command_enter');

        // Unknown command — show tree as a reminder
        if (!this.commands[input]) {
            this.print(`bash: ${input}: command not found`, 'line-error');
            SoundEngine.play('command_error');
            const d = this._animDelay + 100;
            setTimeout(() => { this.br(); this.showSuggestions(); this.scrollBottom(); }, d);
            return;
        }

        // Utility: sound (stays in left pane, no split)
        if (input === 'sound') {
            this.commands.sound.run();
            setTimeout(() => { this.scrollBottom(); }, this._animDelay + 100);
            return;
        }

        // Utility: clear
        if (input === 'clear') {
            this.commands.clear.run();
            return;
        }

        // Utility: exit (never opens right pane)
        if (input === 'exit') {
            this.commands.exit.run();
            return;
        }

        // Content command → right pane — no tree reprint
        SoundEngine.play('command_success');

        const leftDone = this._animDelay + 100;
        setTimeout(() => { this.scrollBottom(); }, leftDone);

        // Content command → right pane
        if (!this.splitOpen) {
            // First time: open the split, then run the command
            this._openSplit();
            setTimeout(() => {
                this._rightDelay = 0;
                this.commands[input].run();
            }, 1000);
        } else {
            // Split already open: static burst clears old content, then run command
            this._staticBurstSwitch(() => {
                this._rightDelay = 0;
                this.commands[input].run();
            });
        }
    },

    // ── Split pane management ─────────────────────────────────────────────────

    _openSplit() {
        const divider = document.getElementById('pane-divider');
        const leftPane = document.getElementById('left-pane');
        const rightPane = document.getElementById('right-pane');

        // Phase 1: draw the divider line (100 → 500ms)
        setTimeout(() => divider.classList.add('draw'), 100);

        // Phase 2: compress left + expand right simultaneously (520 → 870ms)
        setTimeout(() => {
            leftPane.classList.add('compressing');
            rightPane.classList.add('expanding');
        }, 520);

        // Phase 3: lock final state (920ms)
        setTimeout(() => {
            leftPane.classList.remove('compressing');
            leftPane.classList.add('compressed');
            divider.classList.remove('draw');
            divider.classList.add('drawn');
            rightPane.classList.remove('expanding');
            rightPane.classList.add('expanded');
            this.splitOpen = true;
        }, 920);
    },

    _clearRightContent() {
        document.getElementById('right-content').innerHTML = '';
        document.getElementById('right-header').textContent = '';
    },

    _staticBurstSwitch(onDone) {
        const canvas = document.getElementById('switch-canvas');
        const ctx    = canvas.getContext('2d');
        const pane   = canvas.parentElement;
        const rect   = pane.getBoundingClientRect();

        canvas.width  = Math.ceil(rect.width);
        canvas.height = Math.ceil(rect.height);
        canvas.style.display  = 'block';
        canvas.style.opacity  = '0';
        canvas.style.transition = 'none';

        let frame          = 0;
        const glitchFrames = 9;   // random on/off flicker
        const holdFrames   = 14;  // full static
        const total        = glitchFrames + holdFrames;
        let swapped        = false;

        const drawNoise = () => {
            const w = canvas.width, h = canvas.height;
            const img = ctx.createImageData(w, h);
            const d   = img.data;

            const rowMod = new Float32Array(h);
            for (let y = 0; y < h; y++) rowMod[y] = 0.72 + Math.random() * 0.56;

            for (let y = 0; y < h; y++) {
                const rm = rowMod[y];
                for (let x = 0; x < w; x++) {
                    const p = (y * w + x) * 4;
                    const v = Math.random();
                    const b = Math.floor(v * 204 * rm); // 255 * 0.8
                    if (v > 0.987) {
                        d[p] = d[p+1] = d[p+2] = 184; d[p+3] = 255; // 230 * 0.8
                    } else if (v > 0.968) {
                        d[p] = Math.floor(b*0.9); d[p+1] = 0; d[p+2] = Math.floor(b*0.6); d[p+3] = 255;
                    } else if (v > 0.950) {
                        d[p] = 0; d[p+1] = Math.floor(b*0.9); d[p+2] = Math.floor(b*0.8); d[p+3] = 255;
                    } else {
                        const g = Math.floor(Math.random() * 204 * rm); // 255 * 0.8
                        d[p] = 0; d[p+1] = g; d[p+2] = Math.floor(g*0.08); d[p+3] = 255;
                    }
                }
            }
            ctx.putImageData(img, 0, 0);

            if (Math.random() > 0.5) {
                const ly = Math.floor(Math.random() * h);
                ctx.fillStyle = `rgba(0,255,65,${Math.random() * 0.22})`;
                ctx.fillRect(0, ly, w, 1 + Math.floor(Math.random() * 2));
            }
        };

        const loop = () => {
            if (frame < glitchFrames) {
                // Hard flicker: probability of visible ramps 0% → 100% over 9 frames
                canvas.style.opacity = Math.random() < (frame / (glitchFrames - 1)) ? '1' : '0';
                drawNoise();
            } else {
                canvas.style.opacity = '1';
                drawNoise();

                // Swap header + clear content on first full-static frame (hidden under static)
                if (!swapped) {
                    swapped = true;
                    this._clearRightContent();
                }
            }

            frame++;
            if (frame < total) {
                requestAnimationFrame(loop);
            } else {
                // Flash
                ctx.fillStyle = 'rgba(195,255,210,0.9)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                setTimeout(() => {
                    // Snap to dark
                    ctx.fillStyle = '#010802';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    setTimeout(() => {
                        canvas.style.display = 'none';
                        canvas.style.opacity = '0';
                        if (onDone) onDone();
                    }, 40);
                }, 60);
            }
        };

        requestAnimationFrame(loop);
    },

    _setRightHeader(text) {
        document.getElementById('right-header').textContent = text;
    },

    // ── Left pane print helpers ───────────────────────────────────────────────

    print(text, cls = 'line-green') {
        const delay = this._animDelay;
        this._animDelay += this._lineInterval;
        setTimeout(() => {
            const output = document.getElementById('output');
            const span = document.createElement('span');
            span.className = `line ${cls}`;
            span.textContent = text;
            output.appendChild(span);
            output.appendChild(document.createElement('br'));
            requestAnimationFrame(() => {
                const lp = document.getElementById('left-pane');
                if (lp) lp.scrollTop = lp.scrollHeight;
            });
        }, delay);
    },

    printEl(el) {
        const delay = this._animDelay;
        this._animDelay += this._lineInterval;
        setTimeout(() => {
            document.getElementById('output').appendChild(el);
            requestAnimationFrame(() => {
                const lp = document.getElementById('left-pane');
                if (lp) lp.scrollTop = lp.scrollHeight;
            });
        }, delay);
    },

    br() {
        const delay = this._animDelay;
        this._animDelay += 8;
        setTimeout(() => {
            document.getElementById('output').appendChild(document.createElement('br'));
        }, delay);
    },

    scrollBottom() {
        setTimeout(() => {
            const lp = document.getElementById('left-pane');
            if (lp) lp.scrollTop = lp.scrollHeight;
        }, 60);
    },

    // ── Right pane print helpers ──────────────────────────────────────────────

    printRight(text, cls = 'line-green') {
        const delay = this._rightDelay;
        this._rightDelay += this._lineInterval;
        setTimeout(() => {
            const content = document.getElementById('right-content');
            const span = document.createElement('span');
            span.className = `line ${cls}`;
            span.textContent = text;
            content.appendChild(span);
            SoundEngine.play('scroll_output');
        }, delay);
    },

    printElRight(el, onInserted) {
        const delay = this._rightDelay;
        this._rightDelay += this._lineInterval;
        setTimeout(() => {
            const content = document.getElementById('right-content');
            content.appendChild(el);
            if (onInserted) onInserted(el);
        }, delay);
    },

    brRight() {
        const delay = this._rightDelay;
        this._rightDelay += 8;
        setTimeout(() => {
            document.getElementById('right-content').appendChild(document.createElement('br'));
        }, delay);
    },

    // ── Commands ──────────────────────────────────────────────────────────────

    showHelp() {
        this._setRightHeader('[ HELP.SYS ] — AVAILABLE COMMANDS');
        this.brRight();
        const hidden = new Set(['clear', 'whoami', 'sound']);
        Object.entries(this.commands).forEach(([name, cmd]) => {
            if (hidden.has(name)) return;
            this.printRight(`  ${name.padEnd(12)} ${cmd.desc}`, 'line-green');
        });
        this.brRight();
        this.printRight('Type a command and press ENTER.', 'line-dim');
    },

    whoami() {
        this._setRightHeader('[ WHOAMI.EXE ]');
        this.brRight();
        this.printRight('MICAH LIVESAY', 'line-pink');
        this.printRight('Audio Engineer // Sound Designer // Sonic Architect', 'line-green');
        this.brRight();
        this.printRight('Status:   Available for work', 'line-cyan');
        this.printRight('Location: [Your City]', 'line-green');
    },

    showProfile() {
        this._setRightHeader('[ PROFILE.SYS ]');
        this.printParsed(SITE_CONTENT.pages.profile);
    },

    showPortfolio() {
        this._setRightHeader('[ PORTFOLIO.DAT ] — SELECTED WORKS');
        SITE_CONTENT.pages.portfolio.forEach(p => {
            const item = document.createElement('div');
            item.className = 'portfolio-item';
            item.innerHTML = `
                <span class="portfolio-title">[${p.id}] ${p.title}</span><br>
                <span class="portfolio-meta">${p.type} &nbsp;·&nbsp; ${p.client} &nbsp;·&nbsp; ${p.year}</span><br>
                <span class="line line-dim">${p.desc}</span>
                ${p.link ? `<br><span class="line line-cyan">&gt; ${p.link}</span>` : ''}
            `;
            this.printElRight(item);
            this.brRight();
        });
    },

    showBlog() {
        this._setRightHeader('[ BLOG.LOG ] — SOUND DIARIES & ARTICLES');
        SITE_CONTENT.pages.blog.forEach(p => {
            const div = document.createElement('div');
            div.className = 'blog-post';
            div.innerHTML = `
                <span class="blog-date">${p.date}</span>
                <span class="blog-tag">${p.tag}</span><br>
                <span class="blog-title">&gt; ${p.title}</span><br>
                <span class="line line-dim">${p.preview}</span>
                ${p.link ? `<br><span class="line line-cyan">&nbsp;&nbsp;[ read more ]</span>` : ''}
            `;
            this.printElRight(div);
            this.brRight();
        });
    },

    showContact() {
        this._setRightHeader('[ CONTACT.EXE ] — OPEN TRANSMISSION');
        this.brRight();

        const c = SITE_CONTENT.pages.contact;
        if (c.email)     this.printRight(`EMAIL      ${c.email}`,    'line-green');
        if (c.twitter)   this.printRight(`TWITTER    ${c.twitter}`,  'line-green');
        if (c.linkedin)  this.printRight(`LINKEDIN   ${c.linkedin}`, 'line-green');
        if (c.instagram) this.printRight(`INSTAGRAM  ${c.instagram}`,'line-green');

        this.brRight();
        this.printRight('// SEND A MESSAGE', 'line-pink');
        this.brRight();

        const form = document.createElement('div');
        form.className = 'contact-form';
        form.id = 'contact-form';
        form.innerHTML = `
            <div class="contact-row">
                <span class="contact-label">NAME &gt;</span>
                <input class="contact-input" id="c-name" type="text" placeholder="your name" autocomplete="off" spellcheck="false">
            </div>
            <div class="contact-row">
                <span class="contact-label">EMAIL &gt;</span>
                <input class="contact-input" id="c-email" type="email" placeholder="your@email.com" autocomplete="off" spellcheck="false">
            </div>
            <div class="contact-row">
                <span class="contact-label">MESSAGE &gt;</span>
                <input class="contact-input" id="c-msg" type="text" placeholder="what's on your mind..." autocomplete="off" spellcheck="false" style="width:340px">
            </div>
            <br>
            <button class="transmit-btn" onclick="CLI.sendContact()">[ TRANSMIT ]</button>
        `;

        this.printElRight(form, (el) => {
            el.querySelectorAll('input').forEach(inp => {
                inp.addEventListener('focus', () => Main.formFocus = true);
                inp.addEventListener('blur',  () => Main.formFocus = false);
                inp.addEventListener('keydown', e => e.stopPropagation());
            });
        });
    },

    sendContact() {
        const name    = document.getElementById('c-name')?.value?.trim();
        const email   = document.getElementById('c-email')?.value?.trim();
        const message = document.getElementById('c-msg')?.value?.trim();

        if (!name || !email || !message) {
            this._rightDelay = 0;
            this.printRight('ERROR: All fields required before transmitting.', 'line-error');
            SoundEngine.play('command_error');
            return;
        }

        SoundEngine.play('transmit');
        this._rightDelay = 0;
        this.printRight('', 'line-dim');
        this.printRight('ESTABLISHING CHANNEL...', 'line-dim');

        const bar = document.createElement('div');
        bar.innerHTML = `<div class="progress-track"><div class="progress-fill" id="tx-fill"></div></div>`;
        this.printElRight(bar);

        let p = 0;
        const iv = setInterval(() => {
            p += Math.random() * 12 + 4;
            if (p >= 100) { p = 100; clearInterval(iv); }
            const fill = document.getElementById('tx-fill');
            if (fill) fill.style.width = p + '%';
        }, 40);

        setTimeout(() => {
            this._rightDelay = 0;
            this.printRight('TRANSMISSION COMPLETE.', 'line-pink');
            this.printRight(`Message from ${name} logged. I'll be in touch.`, 'line-green');
            const form = document.getElementById('contact-form');
            if (form) { form.querySelectorAll('input,button').forEach(el => el.disabled = true); form.style.opacity = '0.4'; }
        }, 1800);
    },

    showServices() {
        this._setRightHeader('[ SERVICES.SYS ]');
        this.printParsed(SITE_CONTENT.pages.services);
    },

    shutdown() {
        // If split is open, collapse it first then start text after it closes
        if (this.splitOpen) {
            this._collapseSplit();
            // Push _animDelay past the collapse animation (350ms)
            this._animDelay = Math.max(this._animDelay, 400);
        }

        const seq = SITE_CONTENT.shutdown;

        seq.forEach(([text, cls]) => {
            if (text === '') this.br();
            else this.print(text, cls);
        });

        setTimeout(() => Main.exitFullscreen(), this._animDelay + 600);
    },

    _collapseSplit() {
        const left  = document.getElementById('left-pane');
        const div   = document.getElementById('pane-divider');
        const right = document.getElementById('right-pane');

        right.style.transition = 'width 0.3s ease-in, opacity 0.25s ease-in';
        right.style.width   = '0';
        right.style.opacity = '0';

        div.style.transition = 'opacity 0.2s ease-in';
        div.style.opacity = '0';

        left.style.transition = 'width 0.3s ease-in';
        left.style.width = '100%';

        setTimeout(() => {
            left.className  = 'left-pane';
            left.style.cssText = '';
            div.className   = 'pane-divider';
            div.style.cssText = '';
            right.className = 'right-pane';
            right.style.cssText = '';
            document.getElementById('right-content').innerHTML = '';
            document.getElementById('right-header').textContent = '';
            this.splitOpen = false;
        }, 350);
    },

    toggleSound() {
        const on = SoundEngine.toggle();
        this.print(`Audio: ${on ? 'ENABLED' : 'DISABLED'}`, on ? 'line-green' : 'line-dim');
    },

    clearScreen() {
        document.getElementById('output').innerHTML = '';

        if (this.splitOpen) {
            const left  = document.getElementById('left-pane');
            const div   = document.getElementById('pane-divider');
            const right = document.getElementById('right-pane');

            left.className  = 'left-pane';
            left.style.cssText = '';
            div.className   = 'pane-divider';
            right.className = 'right-pane';
            right.style.cssText = '';

            document.getElementById('right-content').innerHTML = '';
            document.getElementById('right-header').textContent = '';
            this.splitOpen = false;
        }

        this._animDelay = 0;
        this.print('Terminal cleared. Type "help" for commands.', 'line-dim');
        setTimeout(() => { this.br(); this.showSuggestions(); this.scrollBottom(); }, this._animDelay + 100);
    },

    // ── Content parser ───────────────────────────────────────────────────────

    // Converts a template string from content.js pages into styled CLI lines.
    // Markers:  ## Heading   → pink   |  [Label]: value → green key/value
    //           - item       → bullet |  ---            → dim divider
    //           blank line   → br     |  plain text     → dim body text
    _parseContent(text) {
        return text.trim().split('\n').map(raw => {
            const line = raw.trim();
            if (line === '')
                return { text: '', cls: '' };
            if (line === '---')
                return { text: '────────────────────────────────────────', cls: 'line-dim' };
            if (line.startsWith('### '))
                return { text: line.slice(4), cls: 'line-heading' };
            if (line.startsWith('## '))
                return { text: line.slice(3), cls: 'line-pink' };
            if (line.startsWith('# '))
                return { text: line.slice(2), cls: 'line-pink' };
            if (line.startsWith('//'))
                return { text: line, cls: 'line-cyan' };
            const kv = line.match(/^\[([^\]]+)\]:\s*(.*)$/);
            if (kv)
                return { text: `  ${kv[1].padEnd(14)} ${kv[2]}`, cls: 'line-green' };
            if (line.startsWith('- '))
                return { text: `  • ${line.slice(2)}`, cls: 'line-green' };
            return { text: line, cls: 'line-dim' };
        });
    },

    printParsed(text) {
        this._parseContent(text).forEach(({ text, cls }) => {
            if (text === '') this.brRight();
            else this.printRight(text, cls || 'line-dim');
        });
    },

    // ── Suggestion buttons ────────────────────────────────────────────────────

    showSuggestions() {
        const output = document.getElementById('output');

        const cmds = [
            { name: 'profile',   desc: 'About Micah Livesay'      },
            { name: 'portfolio', desc: 'Sound design & audio work' },
            { name: 'blog',      desc: 'Articles & sound diaries'  },
            { name: 'contact',   desc: 'Get in touch'              },
            { name: 'help',      desc: 'All commands'              },
            { name: 'exit',      desc: 'Terminate session'         },
        ];

        // Root node
        const root = document.createElement('span');
        root.className = 'line line-dim';
        root.textContent = '/';
        output.appendChild(root);

        cmds.forEach((cmd, i) => {
            const isLast  = i === cmds.length - 1;
            const branch  = isLast ? '└── ' : '├── ';

            const line = document.createElement('span');
            line.className = 'line';

            const branchSpan = document.createElement('span');
            branchSpan.style.cssText = 'color:var(--green-dim);opacity:0.55;';
            branchSpan.textContent = branch;

            const nameSpan = document.createElement('span');
            nameSpan.style.cssText = 'color:var(--pink);text-shadow:0 0 6px rgba(255,45,120,0.5);';
            nameSpan.textContent = cmd.name;

            line.appendChild(branchSpan);
            line.appendChild(nameSpan);
            output.appendChild(line);
        });

        output.appendChild(document.createElement('br'));
    },
};
