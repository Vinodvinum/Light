/**
 * Light a Flame - Cosmic Sanātani reveal
 */

const CONFIG = {
    starCountDesktop: 140,
    starCountMobile: 72,
    lightCountDesktop: 760,
    lightCountMobile: 260,
    sparkCountDesktop: 520,
    sparkCountMobile: 180,
    burstDuration: 6500,
    messageDelay: 2900,
};

const MUSIC_SEQUENCE = [
    { note: 196, duration: 0.7, delay: 0 },
    { note: 220, duration: 0.7, delay: 0.75 },
    { note: 247, duration: 0.9, delay: 1.5 },
    { note: 294, duration: 0.8, delay: 2.45 },
    { note: 247, duration: 0.8, delay: 3.3 },
    { note: 220, duration: 0.7, delay: 4.15 },
    { note: 196, duration: 0.9, delay: 5.0 },
    { note: 174, duration: 1.0, delay: 5.95 },
];

const state = {
    canvas: null,
    ctx: null,
    backgroundCanvas: null,
    backgroundCtx: null,
    dpr: 1,
    width: 0,
    height: 0,
    time: 0,
    started: false,
    animationId: 0,
    audioContext: null,
    musicTimer: 0,
    stars: [],
    lights: [],
    sparks: [],
    nebulaSeed: Math.random() * 1000,
    isMobile: false,
};

const elements = {
    canvas: document.getElementById('renderCanvas'),
    heroPanel: document.getElementById('heroPanel'),
    lightBtn: document.getElementById('lightBtn'),
    messagePanel: document.getElementById('messagePanel'),
    uiLayer: document.querySelector('.ui-layer'),
};

function setupCanvas() {
    state.canvas = elements.canvas;
    state.ctx = state.canvas.getContext('2d', { alpha: false, desynchronized: true });
    state.backgroundCanvas = document.createElement('canvas');
    state.backgroundCtx = state.backgroundCanvas.getContext('2d', { alpha: false });
    state.isMobile = window.matchMedia('(max-width: 768px)').matches || window.innerWidth < 900;
    state.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, state.isMobile ? 1.25 : 1.75));
    resizeCanvas();
}

function resizeCanvas() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.canvas.width = Math.floor(state.width * state.dpr);
    state.canvas.height = Math.floor(state.height * state.dpr);
    state.canvas.style.width = `${state.width}px`;
    state.canvas.style.height = `${state.height}px`;
    state.backgroundCanvas.width = Math.floor(state.width * state.dpr);
    state.backgroundCanvas.height = Math.floor(state.height * state.dpr);
    state.ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.backgroundCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    buildStars();
    renderStaticBackground();
}

function buildStars() {
    const starCount = state.isMobile ? CONFIG.starCountMobile : CONFIG.starCountDesktop;
    state.stars = Array.from({ length: starCount }, (_, index) => ({
        x: Math.random(),
        y: Math.random() * 0.75,
        r: Math.random() * 1.15 + 0.35,
        twinkle: Math.random() * Math.PI * 2,
        drift: (index % 2 ? 1 : -1) * (Math.random() * 0.015 + 0.004),
        hue: index % 6 === 0 ? 42 : 50,
    }));
}

function renderStaticBackground() {
    const ctx = state.backgroundCtx;
    const width = state.width;
    const height = state.height;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#060f23');
    gradient.addColorStop(0.5, '#040812');
    gradient.addColorStop(1, '#010205');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const nebula = ctx.createRadialGradient(
        width * 0.5,
        height * 0.22,
        20,
        width * 0.5,
        height * 0.22,
        Math.max(width, height) * 0.85
    );
    nebula.addColorStop(0, 'rgba(255, 200, 110, 0.1)');
    nebula.addColorStop(0.35, 'rgba(255, 173, 83, 0.06)');
    nebula.addColorStop(0.6, 'rgba(93, 129, 255, 0.06)');
    nebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.95;
    for (const star of state.stars) {
        const x = star.x * width;
        const y = star.y * height;
        const alpha = 0.2 + (star.r / 1.5) * 0.35;
        ctx.fillStyle = `rgba(255, 248, 232, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, star.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

class LightParticle {
    constructor(x, y, power, driftX, driftY, hue, life, size) {
        this.x = x;
        this.y = y;
        this.power = power;
        this.driftX = driftX;
        this.driftY = driftY;
        this.hue = hue;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.spin = Math.random() * Math.PI * 2;
    }

    update(delta) {
        this.x += this.driftX * delta;
        this.y += this.driftY * delta;
        this.life -= delta;
        this.spin += delta * 0.002;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha * this.power;
        ctx.shadowBlur = this.size * 5;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 65%, 0.9)`;
        ctx.fillStyle = `hsla(${this.hue}, 100%, 68%, 1)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createSparkBurst(x, y, count, spread, speed, hueRange) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * spread;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        const driftX = Math.cos(angle) * speed + (Math.random() - 0.5) * 0.02;
        const driftY = Math.sin(angle) * speed - (Math.random() * 0.05 + 0.06);
        const hue = hueRange[0] + Math.random() * (hueRange[1] - hueRange[0]);
        const life = 2400 + Math.random() * 2200;
        const size = Math.random() * 1.8 + 0.6;
        state.sparks.push(new LightParticle(px, py, 1, driftX, driftY, hue, life, size));
    }
}

function createSkyParticles() {
    const total = state.isMobile ? CONFIG.lightCountMobile : CONFIG.lightCountDesktop;
    const cx = state.width / 2;
    const cy = state.height * 0.6;

    state.lights = [];
    for (let i = 0; i < total; i++) {
        const angle = Math.random() * Math.PI * 2;
        const ring = Math.pow(Math.random(), 0.42);
        const radiusX = state.width * (0.32 + ring * 0.66);
        const radiusY = state.height * (0.18 + ring * 0.34);
        const x = cx + Math.cos(angle) * radiusX * (0.55 + Math.random() * 0.45);
        const y = cy - Math.abs(Math.sin(angle)) * radiusY + (Math.random() - 0.5) * state.height * 0.18;
        const delay = Math.random() * 2800;
        const size = Math.random() * 1.8 + 0.9;
        const power = 0.25 + Math.random() * 0.55;
        const driftX = (Math.random() - 0.5) * 0.02;
        const driftY = -(0.012 + Math.random() * 0.03);
        const hue = 36 + Math.random() * 16;
        const life = CONFIG.burstDuration + Math.random() * 3200;
        state.lights.push(new LightParticle(x, y, power, driftX, driftY, hue, life, size));
        state.lights[i].delay = delay;
        state.lights[i].born = false;
        state.lights[i].alpha = 0;
    }
}

function playTone() {
    try {
        if (!state.audioContext) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = state.audioContext;
        const now = ctx.currentTime;
        const master = ctx.createGain();
        const shimmer = ctx.createBiquadFilter();
        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(0.06, now + 0.4);
        master.gain.exponentialRampToValueAtTime(0.03, now + 10.5);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 18);

        shimmer.type = 'lowpass';
        shimmer.frequency.setValueAtTime(1200, now);
        shimmer.Q.value = 0.75;
        shimmer.connect(master);
        master.connect(ctx.destination);

        const playDrift = (frequency, type, gainValue, startDelay, holdTime, detune = 0) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, now + startDelay);
            oscillator.detune.setValueAtTime(detune, now + startDelay);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(type === 'triangle' ? 900 : 1400, now + startDelay);
            filter.Q.value = 0.7;

            gainNode.gain.setValueAtTime(0.0001, now + startDelay);
            gainNode.gain.exponentialRampToValueAtTime(gainValue, now + startDelay + 0.08);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + holdTime);

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(shimmer);

            oscillator.start(now + startDelay);
            oscillator.stop(now + startDelay + holdTime + 0.05);
        };

        // Gentle drone
        playDrift(110, 'sine', 0.025, 0, 18);
        playDrift(220, 'sine', 0.015, 0, 18, 2);

        // Soft instrumental bed
        MUSIC_SEQUENCE.forEach((step, index) => {
            const type = index % 2 === 0 ? 'triangle' : 'sine';
            const gainValue = index % 3 === 0 ? 0.025 : 0.02;
            playDrift(step.note, type, gainValue, step.delay, step.duration, index % 2 === 0 ? -2 : 3);
            if (index % 2 === 0) {
                playDrift(step.note * 2, 'sine', 0.01, step.delay + 0.05, step.duration * 0.7, 0);
            }
        });

        // Slow pulse that feels like a soft instrumental beat.
        for (let i = 0; i < 8; i++) {
            const beat = ctx.createOscillator();
            const beatGain = ctx.createGain();
            beat.type = 'sine';
            beat.frequency.setValueAtTime(88, now + i * 2.15);
            beatGain.gain.setValueAtTime(0.0001, now + i * 2.15);
            beatGain.gain.exponentialRampToValueAtTime(0.012, now + i * 2.15 + 0.04);
            beatGain.gain.exponentialRampToValueAtTime(0.0001, now + i * 2.15 + 0.24);
            beat.connect(beatGain);
            beatGain.connect(shimmer);
            beat.start(now + i * 2.15);
            beat.stop(now + i * 2.15 + 0.3);
        }
    } catch (error) {
        // Audio is optional; fail silently on restricted devices.
    }
}

function scheduleInstrumentalLoop() {
    if (!state.started) return;

    if (state.musicTimer) {
        clearTimeout(state.musicTimer);
    }

    state.musicTimer = window.setTimeout(() => {
        if (!state.started) return;
        playTone();
        scheduleInstrumentalLoop();
    }, 18500);
}

function drawBackground(ctx, time) {
    const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
    gradient.addColorStop(0, '#060f23');
    gradient.addColorStop(0.5, '#040812');
    gradient.addColorStop(1, '#010205');
    ctx.drawImage(state.backgroundCanvas, 0, 0, state.width, state.height);

    ctx.save();
    ctx.globalAlpha = 0.95;
    for (const star of state.stars) {
        const sway = Math.sin(time * 0.00016 + star.twinkle) * star.drift * state.width;
        const x = (star.x * state.width + sway + state.width) % state.width;
        const y = star.y * state.height;
        const twinkle = 0.55 + Math.sin(time * 0.0012 + star.twinkle) * 0.3;
        ctx.fillStyle = `rgba(255, 248, 232, ${0.18 + twinkle * 0.34})`;
        ctx.beginPath();
        ctx.arc(x, y, star.r * twinkle, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawTempleSilhouette(ctx) {
    const baseY = state.height * 0.8;
    ctx.save();
    ctx.fillStyle = 'rgba(3, 4, 9, 0.92)';
    ctx.beginPath();
    ctx.moveTo(0, state.height);
    ctx.lineTo(0, baseY);
    ctx.lineTo(state.width * 0.12, baseY - 18);
    ctx.lineTo(state.width * 0.18, baseY - 58);
    ctx.lineTo(state.width * 0.24, baseY - 22);
    ctx.lineTo(state.width * 0.31, baseY - 72);
    ctx.lineTo(state.width * 0.37, baseY - 18);
    ctx.lineTo(state.width * 0.46, baseY - 48);
    ctx.lineTo(state.width * 0.54, baseY - 26);
    ctx.lineTo(state.width * 0.63, baseY - 66);
    ctx.lineTo(state.width * 0.71, baseY - 18);
    ctx.lineTo(state.width * 0.81, baseY - 54);
    ctx.lineTo(state.width * 0.88, baseY - 20);
    ctx.lineTo(state.width, baseY - 34);
    ctx.lineTo(state.width, state.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawCentralFlame(ctx, time, glowScale, showFlame) {
    const cx = state.width / 2;
    const cy = state.height * 0.62;
    const flicker = 1 + Math.sin(time * 0.009) * 0.06 + Math.sin(time * 0.023) * 0.03;
    const flameHeight = 78 * glowScale * flicker;
    const flameWidth = 28 * glowScale * (0.9 + Math.sin(time * 0.016) * 0.03);

    ctx.save();
    ctx.translate(cx, cy);

    if (showFlame) {
        const halo = ctx.createRadialGradient(0, 10, 12, 0, 0, 150 * glowScale);
        halo.addColorStop(0, 'rgba(255, 209, 96, 0.4)');
        halo.addColorStop(0.35, 'rgba(255, 154, 60, 0.16)');
        halo.addColorStop(0.75, 'rgba(255, 154, 60, 0.05)');
        halo.addColorStop(1, 'rgba(255, 154, 60, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 150 * glowScale, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.shadowBlur = state.isMobile ? 20 : 36;
    ctx.shadowColor = 'rgba(255, 178, 72, 0.55)';
    ctx.fillStyle = 'rgba(60, 31, 12, 0.95)';
    ctx.beginPath();
    ctx.ellipse(0, 58, 42 * glowScale, 16 * glowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    const bowl = ctx.createLinearGradient(-40, 30, 40, 80);
    bowl.addColorStop(0, '#8b5a32');
    bowl.addColorStop(0.4, '#c08a4b');
    bowl.addColorStop(0.8, '#7f4a24');
    bowl.addColorStop(1, '#402111');
    ctx.shadowBlur = state.isMobile ? 14 : 24;
    ctx.shadowColor = 'rgba(255, 188, 89, 0.32)';
    ctx.fillStyle = bowl;
    ctx.beginPath();
    ctx.ellipse(0, 58, 42 * glowScale, 16 * glowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(225, 182, 111, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 46, 45 * glowScale, 11 * glowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(48, 35, 26, 0.82)';
    ctx.beginPath();
    ctx.rect(-1.3, 33, 2.6, 11);
    ctx.fill();

    if (showFlame) {
        const flameOuter = ctx.createLinearGradient(0, -flameHeight, 0, 20);
        flameOuter.addColorStop(0, 'rgba(255, 247, 208, 0.98)');
        flameOuter.addColorStop(0.18, 'rgba(255, 220, 119, 0.95)');
        flameOuter.addColorStop(0.65, 'rgba(255, 144, 55, 0.82)');
        flameOuter.addColorStop(1, 'rgba(255, 144, 55, 0)');
        ctx.shadowBlur = 28;
        ctx.shadowColor = 'rgba(255, 163, 76, 0.7)';
        ctx.fillStyle = flameOuter;
        ctx.beginPath();
        ctx.moveTo(0, -flameHeight);
        ctx.bezierCurveTo(-flameWidth, -flameHeight * 0.55, -flameWidth * 0.8, 0, 0, 20);
        ctx.bezierCurveTo(flameWidth * 0.8, 0, flameWidth, -flameHeight * 0.55, 0, -flameHeight);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 224, 0.96)';
        ctx.beginPath();
        ctx.moveTo(0, -flameHeight * 0.72);
        ctx.bezierCurveTo(-flameWidth * 0.38, -flameHeight * 0.28, -flameWidth * 0.28, -1, 0, 12);
        ctx.bezierCurveTo(flameWidth * 0.28, -1, flameWidth * 0.38, -flameHeight * 0.28, 0, -flameHeight * 0.72);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 252, 242, 0.95)';
        ctx.beginPath();
        ctx.arc(0, -4, 2.4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawMandalas(ctx, time) {
    const cx = state.width / 2;
    const cy = state.height * 0.62;
    const pulse = 0.82 + Math.sin(time * 0.0016) * 0.05;

    ctx.save();
    ctx.translate(cx, cy + 8);
    ctx.strokeStyle = 'rgba(255, 214, 128, 0.12)';
    ctx.lineWidth = 1;
    for (let ring = 1; ring <= 5; ring++) {
        const radius = (58 + ring * 24) * pulse;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

function updateAndDrawParticles(delta) {
    const aliveLights = [];
    for (const light of state.lights) {
        if (!light.born) {
            light.delay -= delta;
            if (light.delay <= 0) light.born = true;
            aliveLights.push(light);
            continue;
        }
        light.update(delta);
        if (light.life > 0) aliveLights.push(light);
    }
    state.lights = aliveLights;

    const sparks = [];
    for (const spark of state.sparks) {
        spark.update(delta);
        if (spark.life > 0) sparks.push(spark);
    }
    state.sparks = sparks;

    for (const light of state.lights) {
        if (light.born) light.draw(state.ctx);
    }
    for (const spark of state.sparks) spark.draw(state.ctx);
}

function render(time) {
    const delta = Math.min(34, time - state.time || 16);
    state.time = time;

    drawBackground(state.ctx, time);
    drawTempleSilhouette(state.ctx);
    drawMandalas(state.ctx, time);

    if (!state.started) {
        drawCentralFlame(state.ctx, time, 1, false);
    } else {
        const burstScale = Math.min(1.22, 1 + Math.min(1, time / CONFIG.burstDuration) * 0.18);
        drawCentralFlame(state.ctx, time, burstScale, true);
        updateAndDrawParticles(delta);
    }

    state.animationId = requestAnimationFrame(render);
}

function startExperience() {
    if (state.started) return;
    state.started = true;

    elements.heroPanel.classList.add('hidden');
    elements.messagePanel.classList.remove('show');
    elements.canvas.classList.add('scene-drift');
    elements.uiLayer.classList.add('scene-drift');

    playTone();
    scheduleInstrumentalLoop();

    const cx = state.width / 2;
    const cy = state.height * 0.62;
    createSparkBurst(cx, cy - 10, state.isMobile ? 24 : 48, 30, 0.05, [28, 44]);

    window.setTimeout(() => {
        createSkyParticles();
        createSparkBurst(cx, cy - 10, state.isMobile ? CONFIG.sparkCountMobile : CONFIG.sparkCountDesktop, Math.min(state.width, state.height) * 0.22, 0.07, [34, 52]);
        createSparkBurst(cx, cy - 16, state.isMobile ? 72 : 140, 70, 0.09, [44, 60]);
    }, 900);

    window.setTimeout(() => {
        elements.messagePanel.classList.add('show');
    }, CONFIG.messageDelay);
}

function onKeydown(event) {
    if (!state.started && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        startExperience();
    }
}

function cleanup() {
    if (state.animationId) cancelAnimationFrame(state.animationId);
    if (state.musicTimer) clearTimeout(state.musicTimer);
    if (state.audioContext && state.audioContext.state !== 'closed') {
        state.audioContext.close().catch(() => {});
    }
    elements.canvas.classList.remove('scene-drift');
    elements.uiLayer.classList.remove('scene-drift');
}

setupCanvas();
createSkyParticles();
state.animationId = requestAnimationFrame(render);

elements.lightBtn.addEventListener('click', startExperience, { passive: true });
elements.lightBtn.addEventListener('touchstart', startExperience, { passive: true });
document.addEventListener('keydown', onKeydown);
window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('pagehide', cleanup);

console.log('Light a Flame ready');
