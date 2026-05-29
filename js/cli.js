const CLI = {

    history: [],
    historyIndex: -1,
    _animDelay: 0,      // left pane print delay accumulator
    _rightDelay: 0,     // right pane print delay accumulator
    _lineInterval: 48,  // ms between each line
    splitOpen: false,

    commands: {
        help:      { desc: 'Show available commands',        run: () => CLI.showHelp() },
        profile:   { desc: 'About Micah Livesay',            run: () => CLI.showProfile() },
        portfolio: { desc: 'Sound design & audio work',      run: () => CLI.showPortfolio() },
        blog:      { desc: 'Articles & sound diaries',       run: () => CLI.showBlog() },
        contact:   { desc: 'Get in touch',                   run: () => CLI.showContact() },
        skills:    { desc: 'Tools & technical expertise',    run: () => CLI.showSkills() },
        whoami:    { desc: 'Quick identity readout',         run: () => CLI.whoami() },
        sound:     { desc: 'Toggle audio on / off',          run: () => CLI.toggleSound() },
        clear:     { desc: 'Clear the terminal screen',      run: () => CLI.clearScreen() },
        exit:      { desc: 'Terminate session & exit fullscreen', run: () => CLI.shutdown() },
    },

    // Commands that open the right pane
    _contentCommands: new Set(['help','profile','portfolio','blog','contact','skills','whoami']),

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

        // Unknown command
        if (!this.commands[input]) {
            this.print(`bash: ${input}: command not found`, 'line-error');
            this.print('Type "help" to see available commands.', 'line-dim');
            SoundEngine.play('command_error');
            const d = this._animDelay + 100;
            setTimeout(() => { this.br(); this.showSuggestions(); this.scrollBottom(); }, d);
            return;
        }

        // Utility: sound (stays in left pane, no split)
        if (input === 'sound') {
            this.commands.sound.run();
            const d = this._animDelay + 100;
            setTimeout(() => { this.br(); this.showSuggestions(); this.scrollBottom(); }, d);
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

        // Content command → right pane
        SoundEngine.play('command_success');

        // Show suggestions in left pane after the echo has printed
        const leftDone = this._animDelay + 100;
        setTimeout(() => { this.br(); this.showSuggestions(); this.scrollBottom(); }, leftDone);

        // If split already open: clear right pane immediately and re-run
        // If split not open: open it first (takes ~950ms), then run
        const openDelay = this.splitOpen ? 0 : 1000;

        if (!this.splitOpen) {
            this._openSplit();
        } else {
            this._clearRightContent();
        }

        setTimeout(() => {
            this._rightDelay = 0;
            this.commands[input].run();
        }, openDelay);
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
            content.appendChild(document.createElement('br'));
            SoundEngine.play('scroll_output');
            requestAnimationFrame(() => {
                if (content) content.scrollTop = content.scrollHeight;
            });
        }, delay);
    },

    printElRight(el, onInserted) {
        const delay = this._rightDelay;
        this._rightDelay += this._lineInterval;
        setTimeout(() => {
            const content = document.getElementById('right-content');
            content.appendChild(el);
            requestAnimationFrame(() => {
                if (content) content.scrollTop = content.scrollHeight;
            });
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
        this.printRight('', 'line-dim');
        Object.entries(this.commands).forEach(([name, cmd]) => {
            this.printRight(`  ${name.padEnd(12)} ${cmd.desc}`, 'line-green');
        });
        this.brRight();
        this.printRight('Click a command below or type it and press ENTER.', 'line-dim');
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
        this._setRightHeader('[ PROFILE.SYS ] — MICAH LIVESAY');
        this.brRight();

        // ── EDIT THIS SECTION ──
        const bio = [
            'I craft immersive sonic experiences — from the microscopic',
            'click of a UI interaction to the expansive texture of a',
            'cinematic world.',
            '',
            'Sound is not decoration.',
            'Sound is the feeling beneath the feeling.',
            '',
            'Based in [YOUR CITY]. Available for film, games, interactive,',
            'and commercial projects worldwide.',
        ];
        bio.forEach(line => this.printRight(line, line === '' ? 'line-dim' : 'line-green'));
        // ── END EDIT ──

        this.brRight();
        this.printRight('// QUICK FACTS', 'line-pink');
        this.brRight();
        this.printRight('  Years active   [ADD]', 'line-green');
        this.printRight('  Specialties    Sound Design, Audio Engineering, Music Production', 'line-green');
        this.printRight('  Credits        [ADD CREDITS]', 'line-green');
        this.brRight();
        this.printRight('Type "skills" to see full toolset.', 'line-dim');
    },

    showPortfolio() {
        this._setRightHeader('[ PORTFOLIO.DAT ] — SELECTED WORKS');
        this.brRight();

        // ── EDIT: add or remove project objects ──
        const projects = [
            { id:'001', title:'Project Title', type:'Sound Design',      client:'Client Name', year:'2024', desc:'Short description of the project and your role.' },
            { id:'002', title:'Project Title', type:'Audio Engineering', client:'Client Name', year:'2024', desc:'Short description of the project and your role.' },
            { id:'003', title:'Project Title', type:'Music Production',  client:'Client Name', year:'2023', desc:'Short description of the project and your role.' },
        ];
        // ── END EDIT ──

        projects.forEach(p => {
            const item = document.createElement('div');
            item.className = 'portfolio-item';
            item.innerHTML = `
                <span class="portfolio-title">[${p.id}] ${p.title}</span><br>
                <span class="portfolio-meta">${p.type} &nbsp;·&nbsp; ${p.client} &nbsp;·&nbsp; ${p.year}</span><br>
                <span class="line line-dim">${p.desc}</span>
            `;
            this.printElRight(item);
            this.brRight();
        });
    },

    showBlog() {
        this._setRightHeader('[ BLOG.LOG ] — SOUND DIARIES & ARTICLES');
        this.brRight();

        // ── EDIT: add or remove post objects ──
        const posts = [
            { date:'2024-01-15', tag:'SOUND DESIGN', title:'The Physics of Foley',                   preview:"Why the surfaces you record on matter more than the object itself..." },
            { date:'2024-01-03', tag:'MIXING',        title:'Mixing for Emotion, Not Perfection',     preview:"A perfectly flat mix can feel completely dead. Here's why..." },
            { date:'2023-12-20', tag:'WORKFLOW',      title:'Building a Sound Library from Scratch',  preview:"The system I use to tag, search, and never lose a sound again..." },
        ];
        // ── END EDIT ──

        posts.forEach(p => {
            const div = document.createElement('div');
            div.className = 'blog-post';
            div.innerHTML = `
                <span class="blog-date">${p.date}</span>
                <span class="blog-tag">${p.tag}</span><br>
                <span class="blog-title">&gt; ${p.title}</span><br>
                <span class="line line-dim">${p.preview}</span>
            `;
            this.printElRight(div);
            this.brRight();
        });
    },

    showContact() {
        this._setRightHeader('[ CONTACT.EXE ] — OPEN TRANSMISSION');
        this.brRight();

        // ── EDIT LINKS ──
        this.printRight('EMAIL      your@email.com', 'line-green');
        this.printRight('TWITTER    @yourhandle', 'line-green');
        this.printRight('LINKEDIN   linkedin.com/in/yourprofile', 'line-green');
        this.printRight('INSTAGRAM  @yourhandle', 'line-green');
        // ── END EDIT ──

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

    showSkills() {
        this._setRightHeader('[ SKILLS.SYS ] — LOADED MODULES');
        this.brRight();

        // ── EDIT SKILLS ──
        const skills = [
            { cat:'DAW',          items:'Pro Tools, Logic Pro, Ableton Live, Reaper' },
            { cat:'SOUND DESIGN', items:'Foley, SFX, Synthesis, Sampling, Field Recording' },
            { cat:'MIXING',       items:'Stereo, Immersive (Dolby Atmos), Stem Mixing' },
            { cat:'MASTERING',    items:'Streaming, Vinyl, Broadcast' },
            { cat:'PLUGINS',      items:'Waves, FabFilter, iZotope, Native Instruments' },
            { cat:'FORMATS',      items:'Film, Television, Games, Podcast, Commercial' },
        ];
        // ── END EDIT ──

        skills.forEach(s => {
            this.printRight(`[ ${s.cat} ]`, 'line-pink');
            this.printRight(`  ${s.items}`, 'line-green');
            this.brRight();
        });
    },

    shutdown() {
        // If split is open, collapse it first then start text after it closes
        if (this.splitOpen) {
            this._collapseSplit();
            // Push _animDelay past the collapse animation (350ms)
            this._animDelay = Math.max(this._animDelay, 400);
        }

        const seq = [
            ['>> INITIATING SHUTDOWN SEQUENCE...', 'line-pink'],
            ['', ''],
            ['   [AUDIO]   Signal chain terminated ......... OK', 'line-dim'],
            ['   [DSP]     Processors offline .............. OK', 'line-dim'],
            ['   [FX]      Effects chain unloaded .......... OK', 'line-dim'],
            ['   [NET]     Neural link severed ............. OK', 'line-dim'],
            ['   [MEM]     Flushing memory buffers ......... OK', 'line-dim'],
            ['   [FS]      Unmounting filesystems .......... OK', 'line-dim'],
            ['', ''],
            ['>> SYSTEM HALTED.', 'line-pink'],
            ['', ''],
            ['   GOODBYE, OPERATOR.', 'line-green'],
        ];

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

    // ── Suggestion buttons ────────────────────────────────────────────────────

    showSuggestions() {
        const output = document.getElementById('output');
        const div = document.createElement('div');
        div.className = 'suggestions';

        const label = document.createElement('span');
        label.className = 'suggestion-label';
        label.textContent = 'CMDS >';
        div.appendChild(label);

        const cmds = ['profile','portfolio','blog','contact','skills','help','clear'];
        cmds.forEach(cmd => {
            const btn = document.createElement('button');
            btn.className = 'cmd-btn';
            btn.textContent = cmd;
            btn.addEventListener('mouseenter', () => SoundEngine.play('hover'));
            btn.addEventListener('click', () => {
                SoundEngine.play('click_cmd');
                Main.submitCommand(cmd);
            });
            div.appendChild(btn);
        });

        output.appendChild(div);
        output.appendChild(document.createElement('br'));
    },
};
