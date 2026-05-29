const CLI = {

    history: [],
    historyIndex: -1,

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
    },

    // ── Core execute ──────────────────────────────────────────────────────────

    execute(raw) {
        const input = raw.trim().toLowerCase();
        if (!input) return;

        this.history.unshift(raw.trim());
        this.historyIndex = -1;

        this.print(`MICAH@LIVESAY:~$ ${raw.trim()}`, 'line-cmd-echo');
        this.br();

        SoundEngine.play('command_enter');

        if (this.commands[input]) {
            this.commands[input].run();
            SoundEngine.play('command_success');
        } else {
            this.print(`bash: ${input}: command not found`, 'line-error');
            this.print('Type "help" to see available commands.', 'line-dim');
            SoundEngine.play('command_error');
        }

        this.br();
        this.showSuggestions();
        this.scrollBottom();
    },

    // ── Print helpers ─────────────────────────────────────────────────────────

    print(text, cls = 'line-green') {
        const output = document.getElementById('output');
        const span = document.createElement('span');
        span.className = `line ${cls}`;
        span.textContent = text;
        output.appendChild(span);
        output.appendChild(document.createElement('br'));
        SoundEngine.play('scroll_output');
    },

    printEl(el) {
        document.getElementById('output').appendChild(el);
    },

    br() {
        document.getElementById('output').appendChild(document.createElement('br'));
    },

    scrollBottom() {
        setTimeout(() => {
            const t = document.getElementById('terminal');
            t.scrollTop = t.scrollHeight;
        }, 60);
    },

    // ── Commands ──────────────────────────────────────────────────────────────

    showHelp() {
        this.print('┌─ AVAILABLE COMMANDS ─────────────────────────────────────────┐', 'line-pink');
        Object.entries(this.commands).forEach(([name, cmd]) => {
            this.print(`│  ${name.padEnd(12)} ${cmd.desc}`, 'line-green');
        });
        this.print('└──────────────────────────────────────────────────────────────┘', 'line-pink');
        this.br();
        this.print('Click a command below or type it and press ENTER.', 'line-dim');
    },

    whoami() {
        this.print('MICAH LIVESAY', 'line-pink');
        this.print('Audio Engineer // Sound Designer // Sonic Architect', 'line-green');
        this.print('Status: Available for work', 'line-cyan');
    },

    showProfile() {
        this.print('┌─ PROFILE.SYS ─────────────────────────────────────────────────┐', 'line-pink');
        this.print('│  MICAH LIVESAY                                                 │', 'line-pink');
        this.print('└───────────────────────────────────────────────────────────────┘', 'line-pink');
        this.br();

        // ── EDIT THIS SECTION ──
        const bio = [
            'I craft immersive sonic experiences — from the microscopic click',
            'of a UI interaction to the expansive texture of a cinematic world.',
            '',
            'Sound is not decoration. Sound is the feeling beneath the feeling.',
            '',
            'Based in [YOUR CITY]. Available for film, games, interactive,',
            'and commercial projects worldwide.',
        ];
        bio.forEach(line => this.print(line, line === '' ? '' : 'line-green'));
        // ── END EDIT ──

        this.br();
        this.print('// QUICK FACTS ──────────────────────────────', 'line-pink');
        this.print('  Years active   [ADD YEARS]', 'line-green');
        this.print('  Specialties    Sound Design, Audio Engineering, Music Production', 'line-green');
        this.print('  Credits        [ADD CREDITS]', 'line-green');
        this.br();
        this.print('Type "skills" to see full toolset.', 'line-dim');
    },

    showPortfolio() {
        this.print('┌─ PORTFOLIO.DAT ────────────────────────────────────────────────┐', 'line-pink');
        this.print('│  SELECTED WORKS                                                │', 'line-pink');
        this.print('└───────────────────────────────────────────────────────────────┘', 'line-pink');
        this.br();

        // ── EDIT THIS SECTION — add or remove project objects ──
        const projects = [
            {
                id: '001',
                title: 'Project Title',
                type: 'Sound Design',
                client: 'Client Name',
                year: '2024',
                desc: 'Short description of the project and your role in it.',
                link: null,
            },
            {
                id: '002',
                title: 'Project Title',
                type: 'Audio Engineering',
                client: 'Client Name',
                year: '2024',
                desc: 'Short description of the project and your role in it.',
                link: null,
            },
            {
                id: '003',
                title: 'Project Title',
                type: 'Music Production',
                client: 'Client Name',
                year: '2023',
                desc: 'Short description of the project and your role in it.',
                link: null,
            },
        ];
        // ── END EDIT ──

        projects.forEach(p => {
            const item = document.createElement('div');
            item.className = 'portfolio-item';
            item.innerHTML = `
                <span class="portfolio-title">[${p.id}] ${p.title}</span><br>
                <span class="portfolio-meta">${p.type} &nbsp;·&nbsp; ${p.client} &nbsp;·&nbsp; ${p.year}</span><br>
                <span class="line line-dim">${p.desc}</span>
                ${p.link ? `<br><span class="line line-cyan">&gt; ${p.link}</span>` : ''}
            `;
            document.getElementById('output').appendChild(item);
            document.getElementById('output').appendChild(document.createElement('br'));
        });
    },

    showBlog() {
        this.print('┌─ BLOG.LOG ─────────────────────────────────────────────────────┐', 'line-pink');
        this.print('│  SOUND DIARIES & ARTICLES                                      │', 'line-pink');
        this.print('└───────────────────────────────────────────────────────────────┘', 'line-pink');
        this.br();

        // ── EDIT THIS SECTION — add or remove post objects ──
        const posts = [
            {
                date: '2024-01-15',
                tag: 'SOUND DESIGN',
                title: 'The Physics of Foley',
                preview: 'Why the surfaces you record on matter more than the object itself...',
                link: null,
            },
            {
                date: '2024-01-03',
                tag: 'MIXING',
                title: 'Mixing for Emotion, Not Perfection',
                preview: 'A perfectly flat mix can feel completely dead. Here\'s why...',
                link: null,
            },
            {
                date: '2023-12-20',
                tag: 'WORKFLOW',
                title: 'Building a Sound Library from Scratch',
                preview: 'The system I use to tag, search, and never lose a sound again...',
                link: null,
            },
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
                ${p.link ? `<br><span class="line line-cyan">&nbsp;&nbsp;[ read more ]</span>` : ''}
            `;
            document.getElementById('output').appendChild(div);
            document.getElementById('output').appendChild(document.createElement('br'));
        });
    },

    showContact() {
        this.print('┌─ CONTACT.EXE ──────────────────────────────────────────────────┐', 'line-pink');
        this.print('│  OPEN TRANSMISSION CHANNEL                                     │', 'line-pink');
        this.print('└───────────────────────────────────────────────────────────────┘', 'line-pink');
        this.br();

        // ── EDIT LINKS ──
        this.print('EMAIL      your@email.com', 'line-green');
        this.print('TWITTER    @yourhandle', 'line-green');
        this.print('LINKEDIN   linkedin.com/in/yourprofile', 'line-green');
        this.print('INSTAGRAM  @yourhandle', 'line-green');
        // ── END EDIT ──

        this.br();
        this.print('// SEND A MESSAGE ───────────────────────', 'line-pink');
        this.br();

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
                <input class="contact-input" id="c-msg" type="text" placeholder="what's on your mind..." autocomplete="off" spellcheck="false" style="width:380px">
            </div>
            <br>
            <button class="transmit-btn" onclick="CLI.sendContact()">[ TRANSMIT ]</button>
        `;

        // Stop keydown from leaking to main CLI while typing in form
        form.querySelectorAll && setTimeout(() => {
            const inputs = form.querySelectorAll('input');
            inputs.forEach(inp => {
                inp.addEventListener('focus', () => Main.formFocus = true);
                inp.addEventListener('blur',  () => Main.formFocus = false);
                inp.addEventListener('keydown', e => e.stopPropagation());
            });
        }, 80);

        document.getElementById('output').appendChild(form);
        document.getElementById('output').appendChild(document.createElement('br'));

        this.br();
        this.print('Alternatively, email directly at the address above.', 'line-dim');
    },

    sendContact() {
        const name    = document.getElementById('c-name')?.value?.trim();
        const email   = document.getElementById('c-email')?.value?.trim();
        const message = document.getElementById('c-msg')?.value?.trim();

        if (!name || !email || !message) {
            this.br();
            this.print('ERROR: All fields required before transmitting.', 'line-error');
            SoundEngine.play('command_error');
            this.scrollBottom();
            return;
        }

        SoundEngine.play('transmit');
        this.br();
        this.print('ESTABLISHING CHANNEL...', 'line-dim');

        const bar = document.createElement('div');
        bar.innerHTML = `<div class="progress-track"><div class="progress-fill" id="tx-fill"></div></div>`;
        document.getElementById('output').appendChild(bar);

        let p = 0;
        const iv = setInterval(() => {
            p += Math.random() * 12 + 4;
            if (p >= 100) { p = 100; clearInterval(iv); }
            const fill = document.getElementById('tx-fill');
            if (fill) fill.style.width = p + '%';
        }, 40);

        setTimeout(() => {
            this.br();
            this.print('TRANSMISSION COMPLETE.', 'line-pink');
            this.print(`Message from ${name} logged. I'll be in touch.`, 'line-green');
            this.scrollBottom();

            // Disable form after send
            const form = document.getElementById('contact-form');
            if (form) {
                form.querySelectorAll('input, button').forEach(el => el.disabled = true);
                form.style.opacity = '0.4';
            }
        }, 1800);
    },

    showSkills() {
        this.print('┌─ SKILLS.SYS ──────────────────────────────────────────────────┐', 'line-pink');
        this.print('│  LOADED MODULES & TOOLS                                       │', 'line-pink');
        this.print('└───────────────────────────────────────────────────────────────┘', 'line-pink');
        this.br();

        // ── EDIT SKILLS ──
        const skills = [
            { cat: 'DAW',          items: 'Pro Tools, Logic Pro, Ableton Live, Reaper' },
            { cat: 'SOUND DESIGN', items: 'Foley, SFX, Synthesis, Sampling, Field Recording' },
            { cat: 'MIXING',       items: 'Stereo, Immersive (Dolby Atmos), Stem Mixing' },
            { cat: 'MASTERING',    items: 'Streaming, Vinyl, Broadcast' },
            { cat: 'PLUGINS',      items: 'Waves, FabFilter, iZotope, Native Instruments' },
            { cat: 'FORMATS',      items: 'Film, Television, Games, Podcast, Commercial' },
        ];
        // ── END EDIT ──

        skills.forEach(s => {
            this.print(`[ ${s.cat} ]`, 'line-pink');
            this.print(`  ${s.items}`, 'line-green');
            this.br();
        });
    },

    toggleSound() {
        const on = SoundEngine.toggle();
        this.print(`Audio: ${on ? 'ENABLED' : 'DISABLED'}`, on ? 'line-green' : 'line-dim');
    },

    clearScreen() {
        document.getElementById('output').innerHTML = '';
        this.print('Terminal cleared.', 'line-dim');
    },

    // ── Suggestion buttons ────────────────────────────────────────────────────

    showSuggestions() {
        const output = document.getElementById('output');
        const div = document.createElement('div');
        div.className = 'suggestions';

        const label = document.createElement('span');
        label.className = 'suggestion-label';
        label.textContent = 'COMMANDS > ';
        div.appendChild(label);

        const cmds = ['profile', 'portfolio', 'blog', 'contact', 'skills', 'help', 'clear'];
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
