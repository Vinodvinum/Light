/**
 * Light a Jyothi - Interactive Experience
 * Modern, realistic design with canvas-based rendering
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    diyaCount: 0,
    maxDiyas: 25,
    expandDelay: 200,
    messageShowTime: 2500,
    particleIntensity: 0.3,
};

// ============================================
// STATE
// ============================================
const state = {
    isActivated: false,
    canvas: null,
    ctx: null,
    diyas: [],
    particles: [],
    time: 0,
    animationId: null,
    audioContext: null,
};

// ============================================
// DOM REFERENCES
// ============================================
const elements = {
    canvas: document.getElementById('renderCanvas'),
    lightBtn: document.getElementById('lightBtn'),
    initialScreen: document.getElementById('initialScreen'),
    experienceScreen: document.getElementById('experienceScreen'),
    messageContainer: document.getElementById('messageContainer'),
    loading: document.getElementById('loading'),
};

// ============================================
// SETUP CANVAS
// ============================================
function setupCanvas() {
    state.canvas = elements.canvas;
    state.ctx = state.canvas.getContext('2d', { 
        alpha: false,
        antialias: true,
        willReadFrequently: false
    });

    const dpr = window.devicePixelRatio || 1;
    state.canvas.width = window.innerWidth * dpr;
    state.canvas.height = window.innerHeight * dpr;
    
    state.ctx.scale(dpr, dpr);
    
    // Set background
    state.ctx.fillStyle = '#0a0e27';
    state.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

setupCanvas();
window.addEventListener('resize', setupCanvas);

// ============================================
// DIYA CLASS - REALISTIC RENDERING
// ============================================
class Diya {
    constructor(x, y, delay = 0) {
        this.x = x;
        this.y = y;
        this.delay = delay;
        this.age = 0;
        this.scale = 0;
        this.flickerOffset = Math.random() * Math.PI * 2;
        this.opacity = 0;
        this.baseGlow = 0.3;
        this.wobble = Math.random() * 0.5;
        this.wobbleSpeed = Math.random() * 0.02 + 0.01;
    }

    update(time) {
        const adjustedTime = time - this.delay;
        
        if (adjustedTime >= 0) {
            // Fade in animation
            this.age = Math.min(adjustedTime / 400, 1);
            this.opacity = Math.min(this.age * 1.2, 1);
            this.scale = this.age < 0.3 ? (this.age / 0.3) * 0.8 : 0.8;
        }

        // Floating animation
        this.wobble = Math.sin(time * this.wobbleSpeed) * 0.5;
    }

    draw(ctx, time) {
        if (this.opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x + this.wobble, this.y);
        ctx.scale(this.scale, this.scale);

        // Realistic glow - outer
        const glowGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
        glowGradient.addColorStop(0, `rgba(255, 165, 0, ${this.baseGlow * 0.6})`);
        glowGradient.addColorStop(0.5, `rgba(255, 215, 0, ${this.baseGlow * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(-35, -35, 70, 70);

        // Diya body (realistic)
        this.drawDiyaBody(ctx, time);

        ctx.restore();
    }

    drawDiyaBody(ctx, time) {
        const flickerIntensity = Math.sin(time * 0.015 + this.flickerOffset) * 0.15 + 0.85;

        // Main body shadow
        ctx.fillStyle = 'rgba(139, 69, 19, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - gradient for depth
        const bodyGradient = ctx.createLinearGradient(-12, 0, 12, 16);
        bodyGradient.addColorStop(0, '#C19A6B');
        bodyGradient.addColorStop(0.5, '#D2B48C');
        bodyGradient.addColorStop(1, '#8B4513');

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 8, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rim highlight
        ctx.fillStyle = 'rgba(218, 165, 32, 0.6)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flame
        this.drawFlame(ctx, flickerIntensity);
    }

    drawFlame(ctx, flickerIntensity) {
        const flameHeight = 12 * flickerIntensity;
        const flameVariation = Math.sin(state.time * 0.025 + this.flickerOffset) * 2;

        // Outer flame - orange
        ctx.fillStyle = `rgba(255, 165, 0, ${0.7 * flickerIntensity})`;
        ctx.beginPath();
        ctx.ellipse(0, -8, 5 + flameVariation, flameHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner flame - yellow
        ctx.fillStyle = `rgba(255, 255, 100, ${0.9 * flickerIntensity})`;
        ctx.beginPath();
        ctx.ellipse(0, -7, 3, flameHeight * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = `rgba(255, 255, 200, ${flickerIntensity})`;
        ctx.beginPath();
        ctx.arc(0, -6, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================
// PARTICLE CLASS
// ============================================
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = Math.random() * 0.5 + 0.3;
        this.life = 1;
        this.size = Math.random() * 1.5 + 0.5;
        this.wobble = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.vx;
        this.y -= this.vy;
        this.life -= 0.008;
        this.wobble += Math.random() * 0.1;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life * 0.6;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x + Math.sin(this.wobble) * 2, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ============================================
// RENDER BACKGROUND
// ============================================
function renderBackground() {
    const ctx = state.ctx;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(0.5, '#0d0a1f');
    gradient.addColorStop(1, '#050710');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // Subtle stars/twinkle effect
    if (state.time % 100 < 10) {
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 30; i++) {
            const x = Math.sin(i * 12.9898 + state.time * 0.001) * window.innerWidth;
            const y = Math.cos(i * 78.233 + state.time * 0.0008) * window.innerHeight;
            ctx.beginPath();
            ctx.arc(Math.abs(x) % window.innerWidth, Math.abs(y) % window.innerHeight, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

// ============================================
// ANIMATION LOOP
// ============================================
function animate(timestamp) {
    state.time = timestamp;

    // Render background
    renderBackground();

    // Update and draw diyas
    state.diyas.forEach(diya => {
        diya.update(state.time);
        diya.draw(state.ctx, state.time);
    });

    // Update and draw particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const particle = state.particles[i];
        particle.update();
        if (particle.life > 0) {
            particle.draw(state.ctx);
        } else {
            state.particles.splice(i, 1);
        }
    }

    // Continue animation
    if (state.isActivated || state.particles.length > 0) {
        state.animationId = requestAnimationFrame(animate);
    }
}

state.animationId = requestAnimationFrame(animate);

// ============================================
// CREATE DIYAS
// ============================================
function createDiyas() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // First diya at center
    state.diyas.push(new Diya(centerX, centerY, 0));
    createParticles(centerX, centerY, 12);

    // Expand after delay
    setTimeout(() => {
        expandDiyas();
    }, 800);
}

function expandDiyas() {
    const padding = 60;
    const cols = Math.ceil(Math.sqrt(CONFIG.maxDiyas * 0.8));
    const cellWidth = (window.innerWidth - padding * 2) / cols;
    const cellHeight = (window.innerHeight - padding * 2) / cols;

    let count = 0;
    for (let row = 0; row < cols; row++) {
        for (let col = 0; col < cols; col++) {
            if (count >= CONFIG.maxDiyas - 1) break;

            const x = padding + col * cellWidth + Math.random() * cellWidth * 0.7 + cellWidth * 0.15;
            const y = padding + row * cellHeight + Math.random() * cellHeight * 0.7 + cellHeight * 0.15;
            const delay = count * CONFIG.expandDelay + 100;

            state.diyas.push(new Diya(x, y, delay));

            // Particle burst
            setTimeout(() => {
                createParticles(x, y, 5);
            }, delay + 200);

            count++;
        }
    }
}

// ============================================
// PARTICLE SYSTEM
// ============================================
function createParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = (Math.random() - 0.5) * 10;
        state.particles.push(new Particle(x + offsetX, y + offsetY));
    }
}

// ============================================
// AUDIO - SOFT AMBIENT TONE
// ============================================
function playAudio() {
    if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = state.audioContext;
    const now = ctx.currentTime;

    // Create soft ambient tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(220, now);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);

    osc.start(now);
    osc.stop(now + 1.5);
}

// ============================================
// EVENT HANDLERS
// ============================================
elements.lightBtn.addEventListener('click', handleButtonClick);
elements.lightBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleButtonClick();
    }
});

function handleButtonClick() {
    if (state.isActivated) return;
    state.isActivated = true;

    // Play audio
    playAudio();

    // Hide initial screen
    elements.initialScreen.classList.add('hidden');

    // Show experience
    elements.experienceScreen.classList.remove('hidden');

    // Create diyas
    setTimeout(() => {
        createDiyas();
        requestAnimationFrame(animate);
    }, 100);

    // Show message
    setTimeout(() => {
        elements.messageContainer.classList.add('show');
    }, CONFIG.messageShowTime);

    // Continuous particles
    let particleInterval = setInterval(() => {
        if (!state.isActivated) {
            clearInterval(particleInterval);
            return;
        }
        const randomX = Math.random() * window.innerWidth;
        const randomY = -10;
        createParticles(randomX, randomY, 2);
    }, 250);
}

// ============================================
// KEYBOARD & CLICK ANYWHERE
// ============================================
document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !state.isActivated) {
        elements.lightBtn.click();
    }
});

// ============================================
// TOUCH SUPPORT
// ============================================
elements.lightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    elements.lightBtn.click();
});

// ============================================
// LOG
// ============================================
console.log('🪔 Light a Jyothi - Ready');
