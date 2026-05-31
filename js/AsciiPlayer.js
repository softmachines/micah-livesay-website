/**
 * AsciiPlayer — plays exported ASCII video data on a canvas.
 *
 * USAGE
 * ─────────────────────────────────────────────────────────────────
 * const player = new AsciiPlayer('#my-canvas', {
 *     src:       'data/reel.json',  // path to exported JSON
 *     autoplay:  true,
 *     loop:      true,
 *     glow:      0.7,               // 0 = off, 0–1
 *     glowBlur:  6,                 // px
 *     ca:        false,             // chromatic aberration
 *     caSpread:  2,                 // px
 *     caAnimated:false,             // animate CA shift
 *     scanlines: false,
 *     vignette:  false,
 *     colorMode: null,              // override stored colorMode ('mono','twotone','palette','rgb')
 *     charSet:   null,              // override stored charSet string
 *     onReady:   () => {},
 *     onFrame:   (idx, total) => {},
 *     onEnd:     () => {},
 * });
 *
 * player.play();
 * player.pause();
 * player.stop();
 * player.seek(frameIndex);
 * player.destroy();
 *
 * // Change live options at any time:
 * player.set({ glow: 1, ca: true });
 */

class AsciiPlayer {

    constructor(target, options = {}) {
        this.canvas = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (!this.canvas) { console.error('AsciiPlayer: canvas not found', target); return; }

        this.ctx = this.canvas.getContext('2d');

        this.opts = Object.assign({
            src:        null,
            autoplay:   false,
            loop:       true,
            glow:       0.7,
            glowBlur:   6,
            ca:         false,
            caSpread:   2,
            caAnimated: false,
            scanlines:  false,
            vignette:   false,
            colorMode:  null,
            charSet:    null,
            onReady:    null,
            onFrame:    null,
            onEnd:      null,
        }, options);

        this._meta    = null;
        this._frames  = null;
        this._timer   = null;
        this._playing = false;
        this._frame   = 0;
        this._caPhase = 0;

        if (this.opts.src) this._load(this.opts.src);
    }

    // ── Load ─────────────────────────────────────────────────────────────────

    _load(src) {
        fetch(src)
            .then(r => r.json())
            .then(data => this._init(data))
            .catch(e => console.error('AsciiPlayer: failed to load', src, e));
    }

    // ── Read site CSS variables ───────────────────────────────────────────────

    _readColors() {
        const s = getComputedStyle(document.documentElement);
        const get = v => s.getPropertyValue(v).trim();
        this._colors = {
            green:    get('--green')      || '#00ff41',
            greenDim: get('--green-dim')  || '#00b32c',
            pink:     get('--pink')       || '#ff2d78',
            cyan:     get('--cyan')       || '#00ffcc',
        };
    },

    _init(data) {
        this._readColors();
        this._meta = data;

        // Decode base64 frame buffer
        const raw    = atob(data.data);
        const buf    = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);

        const cols   = data.cols;
        const rows   = data.rows;
        const cells  = cols * rows;
        const isRGB  = (this.opts.colorMode || data.colorMode) === 'rgb';
        const bpc    = isRGB ? 3 : 1;

        this._frames = [];
        for (let f = 0; f < data.frameCount; f++) {
            const base = f * cells * bpc;
            if (isRGB) {
                const r = new Float32Array(cells);
                const g = new Float32Array(cells);
                const b = new Float32Array(cells);
                for (let i = 0; i < cells; i++) {
                    r[i] = buf[base + i*3]   / 255;
                    g[i] = buf[base + i*3+1] / 255;
                    b[i] = buf[base + i*3+2] / 255;
                }
                // Luma from RGB
                const luma = new Float32Array(cells);
                for (let i = 0; i < cells; i++) luma[i] = 0.299*r[i] + 0.587*g[i] + 0.114*b[i];
                this._frames.push({ luma, r, g, b });
            } else {
                const luma = new Float32Array(cells);
                for (let i = 0; i < cells; i++) luma[i] = buf[base + i] / 255;
                this._frames.push({ luma, r: luma, g: luma, b: luma });
            }
        }

        // Size canvas to fit cols×rows at a good character size
        this._sizeCanvas();

        if (this.opts.onReady) this.opts.onReady(this);
        if (this.opts.autoplay) this.play();
        else this._render(0);
    }

    _sizeCanvas() {
        if (!this._meta) return;
        // If canvas has explicit CSS width, use that; otherwise set sensible defaults
        const w = this.canvas.offsetWidth || this._meta.cols * 8;
        const h = Math.round(w * (this._meta.rows / this._meta.cols) * 2.2);
        this.canvas.width  = w;
        this.canvas.height = h;
    }

    // ── Render ────────────────────────────────────────────────────────────────

    _render(idx) {
        if (!this._frames || !this._frames.length) return;
        idx = Math.max(0, Math.min(this._frames.length - 1, idx));
        this._frame = idx;

        const ctx    = this.ctx;
        const meta   = this._meta;
        const frame  = this._frames[idx];
        const cols   = meta.cols;
        const rows   = meta.rows;
        const cw     = this.canvas.width  / cols;
        const ch     = this.canvas.height / rows;
        const chars  = this.opts.charSet || meta.charSet || ' .:-=+*#%@';
        const mode   = this.opts.colorMode || meta.colorMode || 'mono';
        const caOff  = this.opts.ca
            ? (this.opts.caAnimated ? Math.sin(this._caPhase) * this.opts.caSpread : this.opts.caSpread)
            : 0;

        const fontSize = Math.max(6, Math.min(cw * 1.1, ch));
        ctx.font         = `${fontSize}px 'Share Tech Mono', monospace`;
        ctx.textBaseline = 'top';

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const i    = row * cols + col;
                const luma = frame.luma[i];
                const char = this._lumaToChar(luma, chars);
                if (!char || char === ' ') continue;

                const x     = col * cw;
                const y     = row * ch;
                const color = this._getColor(mode, luma, frame.r[i], frame.g[i], frame.b[i]);

                if (this.opts.glow > 0) {
                    ctx.shadowBlur  = this.opts.glowBlur;
                    ctx.shadowColor = color;
                }

                if (caOff > 0) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    const [lr, lg, lb] = this._parseColor(color);
                    ctx.shadowBlur = 0;
                    ctx.fillStyle  = `rgba(${lr},0,0,0.85)`;
                    ctx.fillText(char, x - caOff, y);
                    ctx.fillStyle  = `rgba(0,${lg},0,0.85)`;
                    ctx.fillText(char, x, y);
                    ctx.fillStyle  = `rgba(0,0,${lb},0.85)`;
                    ctx.fillText(char, x + caOff, y);
                    ctx.restore();
                } else {
                    ctx.globalAlpha = this.opts.glow > 0
                        ? (0.2 + luma * 0.8) * this.opts.glow + (1 - this.opts.glow)
                        : 1;
                    ctx.fillStyle = color;
                    ctx.fillText(char, x, y);
                    ctx.globalAlpha = 1;
                }
            }
        }

        ctx.shadowBlur = 0;

        if (this.opts.scanlines) {
            ctx.save();
            for (let y = 0; y < this.canvas.height; y += 2) {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(0, y, this.canvas.width, 1);
            }
            ctx.restore();
        }

        if (this.opts.vignette) {
            const g = ctx.createRadialGradient(
                this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.3,
                this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.75
            );
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, 'rgba(0,0,0,0.65)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.opts.onFrame) this.opts.onFrame(idx, this._frames.length);
    }

    // ── Playback ──────────────────────────────────────────────────────────────

    play() {
        if (this._playing || !this._frames) return;
        this._playing = true;
        const ms = 1000 / (this._meta?.fps || 10);
        this._timer = setInterval(() => {
            this._caPhase += 0.15;
            const next = this._frame + 1;
            if (next >= this._frames.length) {
                if (this.opts.loop) {
                    this._render(0);
                } else {
                    this.stop();
                    if (this.opts.onEnd) this.opts.onEnd(this);
                }
            } else {
                this._render(next);
            }
        }, ms);
    }

    pause() {
        this._playing = false;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
    }

    stop() {
        this.pause();
        this._render(0);
    }

    seek(frameIndex) {
        this._render(frameIndex);
    }

    // ── Config ────────────────────────────────────────────────────────────────

    set(options) {
        Object.assign(this.opts, options);
        if (this._frames) this._render(this._frame);
    }

    destroy() {
        this.pause();
        this._frames = null;
        this._meta   = null;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    _lumaToChar(luma, chars) {
        return chars[Math.max(0, Math.min(chars.length - 1, Math.floor(luma * (chars.length - 1))))];
    }

    _getColor(mode, luma, r, g, b) {
        const c = this._colors || { green:'#00ff41', greenDim:'#00b32c', pink:'#ff2d78', cyan:'#00ffcc' };
        switch (mode) {
            case 'mono':    return c.green;
            case 'twotone': return luma > 0.5 ? c.green : c.greenDim;
            case 'palette':
                if (luma < 0.33) return c.greenDim;
                if (luma < 0.66) return c.cyan;
                return c.pink;
            case 'rgb':
                return `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
            default: return c.green;
        }
    }

    _parseColor(color) {
        if (color.startsWith('rgb')) {
            const m = color.match(/\d+/g);
            return m ? [+m[0], +m[1], +m[2]] : [0, 255, 65];
        }
        return [
            parseInt(color.slice(1,3),16),
            parseInt(color.slice(3,5),16),
            parseInt(color.slice(5,7),16),
        ];
    }

    // ── State getters ─────────────────────────────────────────────────────────

    get isPlaying()  { return this._playing; }
    get frameIndex() { return this._frame; }
    get frameCount() { return this._frames ? this._frames.length : 0; }
    get duration()   { return this._meta ? this._frames.length / this._meta.fps : 0; }
}
