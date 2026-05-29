/**
 * StaticEffect
 * Renders image-shaped CRT static noise into any container element.
 *
 * Sources: image URL, HTMLImageElement, HTMLVideoElement, video URL, or text string(s).
 *
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * // Image
 * const fx = new StaticEffect('#hero', { src: 'images/portrait.webp' });
 *
 * // Text (single or multi-line array)
 * const fx = new StaticEffect('#hero', {
 *     text: ['MICAH', 'LIVESAY'],
 *     font: 'bold 140px Share Tech Mono, monospace',
 * });
 *
 * // Video
 * const fx = new StaticEffect('#reel', { src: 'videos/showreel.mp4' });
 *
 * // Live HTMLVideoElement
 * const fx = new StaticEffect(myDiv, { video: myVideoEl });
 *
 * // Change source at runtime
 * fx.setSource('images/other.jpg');
 * fx.setText('HELLO');
 *
 * // Control
 * fx.start();
 * fx.stop();
 * fx.destroy();
 *
 * OPTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 * src             string | HTMLImageElement | HTMLVideoElement
 * text            string | string[]          text to render as source
 * font            string                     CSS font for text (default: bold 12% height monospace)
 * textColor       string                     text colour (default: '#ffffff')
 * textGlow        boolean                    soft glow pass on text (default: true)
 * brightness      number  0–1+               overall pixel brightness (default: 0.7)
 * bloomOpacity    number  0–1                bloom layer opacity (default: 0.4)
 * bloomBlur       number  px                 bloom blur radius (default: 6)
 * bloomBrightness number                     bloom brightness multiplier (default: 1.8)
 * zIndex          number                     z-index of base canvas (default: 0)
 */

class StaticEffect {

    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            console.error('StaticEffect: container not found', container);
            return;
        }

        this._opts = {
            brightness:      options.brightness      ?? 0.7,
            bloomOpacity:    options.bloomOpacity    ?? 0.4,
            bloomBlur:       options.bloomBlur       ?? 6,
            bloomBrightness: options.bloomBrightness ?? 1.8,
            bloomBlend:      options.bloomBlend      ?? 'screen',
            zIndex:          options.zIndex          ?? 0,
        };

        this._srcData    = null;
        this._videoEl    = null;
        this._currentImg = null;
        this._running    = false;
        this._frameId    = null;

        this._build();
        this._watchResize();

        // Load initial source
        if      (options.text)   this.setText(options.text, options);
        else if (options.video)  this.setVideo(options.video);
        else if (options.image)  this.setImage(options.image);
        else if (options.src)    this.setSource(options.src);
    }

    // ── Build DOM ─────────────────────────────────────────────────────────────

    _build() {
        const pos = getComputedStyle(this.container).position;
        if (pos === 'static') this.container.style.position = 'relative';

        // Main canvas: full resolution, sharp pixels
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = [
            'position:absolute', 'inset:0',
            'width:100%', 'height:100%',
            'pointer-events:none',
            `z-index:${this._opts.zIndex}`,
        ].join(';');
        this._ctx = this._canvas.getContext('2d');

        // Bloom canvas: quarter resolution, GPU-blurred via CSS, screen-blended
        this._bloom = document.createElement('canvas');
        this._bloom.style.cssText = [
            'position:absolute', 'inset:0',
            'width:100%', 'height:100%',
            'pointer-events:none',
            `z-index:${this._opts.zIndex + 1}`,
            `filter:blur(${this._opts.bloomBlur}px) brightness(${this._opts.bloomBrightness})`,
            `opacity:${this._opts.bloomOpacity}`,
            `mix-blend-mode:${this._opts.bloomBlend}`,
        ].join(';');
        this._bloomCtx = this._bloom.getContext('2d');

        // Offscreen source canvas (never added to DOM)
        this._src    = document.createElement('canvas');
        this._srcCtx = this._src.getContext('2d');

        this.container.appendChild(this._canvas);
        this.container.appendChild(this._bloom);

        this._resize();
    }

    _watchResize() {
        this._ro = new ResizeObserver(() => this._resize());
        this._ro.observe(this.container);
    }

    _resize() {
        const w = this.container.offsetWidth  || window.innerWidth;
        const h = this.container.offsetHeight || window.innerHeight;

        this._canvas.width = w;
        this._canvas.height = h;
        this._bloom.width  = Math.max(1, Math.ceil(w * 0.25));
        this._bloom.height = Math.max(1, Math.ceil(h * 0.25));
        this._src.width  = w;
        this._src.height = h;

        // Re-cache source pixels at new dimensions
        this._refreshSrc();
    }

    // ── Source management ─────────────────────────────────────────────────────

    /**
     * Set source from a URL (image or video), HTMLImageElement, or HTMLVideoElement.
     */
    setSource(src) {
        if (src instanceof HTMLVideoElement) { this.setVideo(src); return; }
        if (src instanceof HTMLImageElement) { this.setImage(src); return; }

        if (typeof src === 'string') {
            if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(src)) {
                const vid = document.createElement('video');
                vid.src         = src;
                vid.loop        = true;
                vid.muted       = true;
                vid.autoplay    = true;
                vid.playsInline = true;
                vid.play().catch(() => {});
                this.setVideo(vid);
            } else {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload  = () => this.setImage(img);
                img.onerror = () => console.warn('StaticEffect: failed to load', src);
                img.src = src;
            }
        }
    }

    /**
     * Use a pre-loaded HTMLImageElement as the source.
     */
    setImage(imgEl) {
        this._videoEl    = null;
        this._currentImg = imgEl;
        this._refreshSrc();
        if (!this._running) this.start();
        return this;
    }

    /**
     * Use an HTMLVideoElement as a live source (re-sampled every frame).
     */
    setVideo(vidEl) {
        this._videoEl    = vidEl;
        this._currentImg = null;
        if (!this._running) this.start();
        return this;
    }

    /**
     * Render text as the source image.
     * @param {string|string[]} text  Single string or array of lines.
     * @param {object} opts
     *   font       CSS font string
     *   textColor  fill colour (default '#fff')
     *   textGlow   boolean — adds a blurred glow pass behind the text
     */
    setText(text, opts = {}) {
        this._videoEl    = null;
        this._currentImg = null;

        const lines = Array.isArray(text) ? text : [text];
        const w = this._src.width, h = this._src.height;
        const font  = opts.font      ?? `bold ${Math.floor(h * 0.12)}px monospace`;
        const color = opts.textColor ?? '#ffffff';
        const glow  = opts.textGlow  ?? true;

        this._srcCtx.fillStyle = '#000';
        this._srcCtx.fillRect(0, 0, w, h);
        this._srcCtx.fillStyle    = color;
        this._srcCtx.textAlign    = 'center';
        this._srcCtx.textBaseline = 'middle';
        this._srcCtx.font         = font;

        const step = h / (lines.length + 1);
        const drawLines = () => lines.forEach((l, i) =>
            this._srcCtx.fillText(l, w * 0.5, step * (i + 1))
        );

        drawLines();

        if (glow) {
            this._srcCtx.filter      = 'blur(8px)';
            this._srcCtx.globalAlpha = 0.4;
            drawLines();
            this._srcCtx.filter      = 'none';
            this._srcCtx.globalAlpha = 1;
        }

        this._srcData = this._srcCtx.getImageData(0, 0, w, h).data;
        if (!this._running) this.start();
        return this;
    }

    _refreshSrc() {
        if (this._videoEl) return; // video reads each frame

        const w = this._src.width, h = this._src.height;

        if (this._currentImg) {
            const img  = this._currentImg;
            const iw   = img.naturalWidth  || w;
            const ih   = img.naturalHeight || h;
            const scale = Math.max(w / iw, h / ih);
            const sw = iw * scale, sh = ih * scale;
            this._srcCtx.clearRect(0, 0, w, h);
            this._srcCtx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
            this._srcData = this._srcCtx.getImageData(0, 0, w, h).data;
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    _drawFrame() {
        // Live video: resample each frame
        if (this._videoEl && this._videoEl.readyState >= 2) {
            this._srcCtx.drawImage(this._videoEl, 0, 0, this._src.width, this._src.height);
            this._srcData = this._srcCtx.getImageData(0, 0, this._src.width, this._src.height).data;
        }

        const w = this._canvas.width, h = this._canvas.height;
        if (!this._srcData || this._srcData.length !== w * h * 4) return;

        const out = this._ctx.createImageData(w, h);
        const d   = out.data;
        const src = this._srcData;
        const br  = this._opts.brightness;

        for (let y = 0; y < h; y++) {
            const rm = 0.55 + Math.random() * 0.9; // per-row brightness variation (banding)
            for (let x = 0; x < w; x++) {
                const p    = (y * w + x) * 4;
                const luma = (src[p] * 0.299 + src[p+1] * 0.587 + src[p+2] * 0.114) / 255;
                const v    = luma * (0.6 + Math.random() * 0.8) * rm * br;
                const roll = Math.random();

                if (roll > 0.988) {
                    // White spark
                    d[p] = d[p+1] = d[p+2] = Math.floor(Math.min(1, v * 1.5) * 235);
                    d[p+3] = 255;
                } else if (roll > 0.970) {
                    // Pink aberration
                    const b = Math.floor(v * 240);
                    d[p] = b; d[p+1] = 0; d[p+2] = Math.floor(b * 0.55); d[p+3] = 255;
                } else if (roll > 0.952) {
                    // Cyan aberration
                    d[p] = 0; d[p+1] = Math.floor(v * 220); d[p+2] = Math.floor(v * 180); d[p+3] = 255;
                } else {
                    // Green static
                    d[p] = 0; d[p+1] = Math.floor(v * 255); d[p+2] = Math.floor(v * 20); d[p+3] = 255;
                }
            }
        }

        this._ctx.putImageData(out, 0, 0);

        // Downscale to bloom canvas — CSS handles the GPU blur
        this._bloomCtx.drawImage(this._canvas, 0, 0, this._bloom.width, this._bloom.height);
    }

    // ── Control ───────────────────────────────────────────────────────────────

    start() {
        if (this._running) return this;
        this._running = true;
        const tick = () => {
            if (!this._running) return;
            this._drawFrame();
            this._frameId = requestAnimationFrame(tick);
        };
        this._frameId = requestAnimationFrame(tick);
        return this;
    }

    stop() {
        this._running = false;
        if (this._frameId) cancelAnimationFrame(this._frameId);
        this._frameId = null;
        return this;
    }

    /** Remove canvases and disconnect observers. */
    destroy() {
        this.stop();
        if (this._ro) this._ro.disconnect();
        this._canvas.remove();
        this._bloom.remove();
    }
}
