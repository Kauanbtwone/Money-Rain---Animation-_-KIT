// --- CONFIGURAÇÃO BASE ---
const DPR_CAP = 2;
const FOV = (50 * Math.PI) / 180;
const NEAR = 0.1, FAR = 100;
const MM = 0.01;
const Z_NEAR = 3.5, Z_FAR = 24;
const HERO_Z = 1.9;
const SEG_X = 24, SEG_Y = 8;
const ATLAS = 1024, GUTTER = 16;
const MAX_MIP_LEVEL = 6;

// --- UTILITÁRIOS MATEMÁTICOS E DE COR ---
function parseColor(input, fb) {
    if (!input) return fb;
    let s = String(input).trim();
    if (s.charAt(0) === "#") {
        let h = s.slice(1);
        if (h.length === 3 || h.length === 4) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
        if (h.length < 6) return fb;
        const n = parseInt(h.slice(0, 6), 16);
        if (!isFinite(n)) return fb;
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    return fb;
}

function glf(n) {
    const s = String(n);
    return s.indexOf(".") >= 0 || s.indexOf("e") >= 0 ? s : s + ".0";
}

function h1js(s, k) {
    const v = Math.sin(s * k + 1.7) * 43758.5453;
    return v - Math.floor(v);
}

function lcg(seed) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    }
}

// --- SHADERS WEBGL ---
const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aUV; layout(location = 1) in vec4 aSeed;
layout(location = 2) in float aHero; layout(location = 3) in vec2 aOffset;
uniform float uTime, uTumble, uAspect, uTanHalf, uFlutter, uSway, uInteract;
uniform vec2 uSize, uPointer;
out vec2 vUV; out vec3 vN, vPos; out float vFog;
const float TAU = 6.2831853;
float h1(float s, float k) { return fract(sin(s * k + 1.7) * 43758.5453); }
mat3 axisAngle(vec3 a, float ang) {
    float s = sin(ang), c = cos(ang), oc = 1.0 - c;
    return mat3(oc * a.x * a.x + c, oc * a.x * a.y + a.z * s, oc * a.z * a.x - a.y * s,
                oc * a.x * a.y - a.z * s, oc * a.y * a.y + c, oc * a.y * a.z + a.x * s,
                oc * a.z * a.x + a.y * s, oc * a.y * a.z - a.x * s, oc * a.z * a.z + c);
}
vec3 surf(vec2 uv, float k, float ph, float t) {
    vec2 p = (uv - 0.5) * uSize; float th = p.x * k;
    vec3 q = vec3(sin(th) / k, p.y, (1.0 - cos(th)) / k * 0.35);
    q.z += uFlutter * 0.035 * uSize.x * sin(uv.x * 7.0 - t * 3.3 + ph * TAU) * (0.5 + 0.5 * uv.y);
    return q;
}
void main() {
    float s = aSeed.w; float hero = step(0.5, aHero); float t = uTime; float ph = h1(s, 12.9898);
    float kAmp = uFlutter * 1.0 / max(uSize.x, 1e-3) * mix(1.0, 0.85, hero);
    float k = kAmp * (0.65 * sin(t * (0.9 + 0.8 * ph) + ph * TAU) + 0.35 * sin(t * (1.7 + 0.6 * h1(s, 3.1)) + ph * 3.1)) + 0.12 / max(uSize.x, 1e-3);
    k = (k >= 0.0 ? 1.0 : -1.0) * max(abs(k), 1e-3);
    vec3 ax = normalize(vec3(h1(s, 7.3), h1(s, 5.1), h1(s, 9.7)) * 2.0 - 1.0 + vec3(1e-3));
    float dir = h1(s, 2.3) < 0.5 ? -1.0 : 1.0; float ang = ph * TAU + dir * uTumble * (0.6 + 0.9 * h1(s, 4.7));
    mat3 R = axisAngle(ax, ang);
    mat3 RH = axisAngle(vec3(1.0, 0.0, 0.0), -0.55 + 0.12 * sin(uTumble * 0.35)) * axisAngle(vec3(0.0, 0.0, 1.0), -0.32 + 0.18 * sin(uTumble * 0.23 + 1.0)) * axisAngle(vec3(0.0, 1.0, 0.0), 0.2 * sin(uTumble * 0.29));
    R = hero > 0.5 ? RH : R;
    vec3 q = surf(aUV, k, ph, t); float e = 0.01;
    vec3 du = surf(aUV + vec2(e, 0.0), k, ph, t) - q; vec3 dv = surf(aUV + vec2(0.0, e), k, ph, t) - q;
    vec3 n = R * normalize(cross(du, dv));
    float z = mix(mix(${glf(Z_NEAR)}, ${glf(Z_FAR)}, aSeed.z), ${glf(HERO_Z)}, hero);
    float hh = z * uTanHalf; float hw = hh * uAspect; float margin = 0.6 * length(uSize) + 0.1; float rangeY = 2.0 * (hh + margin);
    float fall = mix(0.9 + 0.7 * h1(s, 8.8), 0.22, hero);
    float y = (hh + margin) - mod(aSeed.y * rangeY + fall * t, rangeY);
    float x = mix((aSeed.x * 2.0 - 1.0) * (hw + margin * 0.5), 0.12 * hw, hero) + uSway * 0.3 * uSize.x * sin(t * (0.45 + 0.5 * h1(s, 6.2)) + ph * TAU);
    float depthScale = clamp(1.0 - (z - ${glf(HERO_Z)}) / (${glf(Z_FAR)} - ${glf(HERO_Z)}), 0.0, 1.0);
    x += uPointer.x * uInteract * (0.4 + 1.6 * depthScale); y += uPointer.y * uInteract * (0.25 + 0.9 * depthScale);
    x += aOffset.x; y += aOffset.y;
    vec3 pos = vec3(x, y, -z) + R * q; float f = 1.0 / uTanHalf;
    gl_Position = vec4(pos.x * f / uAspect, pos.y * f, (pos.z * (${glf(FAR)} + ${glf(NEAR)}) + 2.0 * ${glf(FAR)} * ${glf(NEAR)}) / (${glf(NEAR)} - ${glf(FAR)}), -pos.z);
    vUV = aUV; vN = n; vPos = pos; vFog = smoothstep(8.0, ${glf(Z_FAR)} + 2.0, z);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUV; in vec3 vN; in vec3 vPos; in float vFog;
uniform sampler2D uTex; uniform vec3 uBase, uBg; uniform float uGut;
out vec4 outColor;
void main() {
    bool front = gl_FrontFacing;
    float u = front ? vUV.x : 1.0 - vUV.x; float faceV = uGut + (1.0 - vUV.y) * (0.5 - 2.0 * uGut);
    vec2 st = vec2(u, faceV + (front ? 0.0 : 0.5)); vec3 tex = texture(uTex, st).rgb;
    vec3 n = normalize(vN); if (!front) n = -n;
    vec3 L = normalize(vec3(-0.35, 0.55, 0.75)); vec3 V = normalize(-vPos);
    float diff = max(dot(n, L), 0.0) + 0.25 * max(-dot(n, L), 0.0);
    vec3 H = normalize(L + V); float spec = pow(max(dot(n, H), 0.0), 28.0) * 0.1;
    vec3 col = tex * uBase * (0.22 + 0.9 * diff) + spec; col = mix(col, uBg, vFog * 0.85);
    outColor = vec4(col, 1.0);
}`;

// --- SISTEMA CORE WEBGL ---
class MoneyRainEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true, depth: true });
        this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
        this.time = 0; this.tumble = 0;
        
        // Parâmetros de produção
        this.config = {
            bg: parseColor("#050505", [0.02, 0.02, 0.02]),
            base: parseColor("#CDD6C6", [0.8, 0.84, 0.78]),
            density: 587, speed: 50, interaction: 40,
            bill: { itemWidth: 122, itemHeight: 72, image: "https://images.unsplash.com/photo-1591537185130-42c4c19eb5e2?w=900&auto=format&fit=crop&q=60" },
            motion: { flutter: 156, tumble: 50, sway: 100 }
        };

        this.init();
    }

    compile(type, src) {
        const sh = this.gl.createShader(type);
        this.gl.shaderSource(sh, src); this.gl.compileShader(sh);
        return sh;
    }

    init() {
        const gl = this.gl;
        const vs = this.compile(gl.VERTEX_SHADER, VERT);
        const fs = this.compile(gl.FRAGMENT_SHADER, FRAG);
        this.prog = gl.createProgram();
        gl.attachShader(this.prog, vs); gl.attachShader(this.prog, fs);
        gl.linkProgram(this.prog); gl.useProgram(this.prog);

        this.U = {};
        ["uTime", "uTumble", "uAspect", "uTanHalf", "uSize", "uFlutter", "uSway", "uTex", "uBase", "uBg", "uGut", "uPointer", "uInteract"].forEach(n => {
            this.U[n] = gl.getUniformLocation(this.prog, n);
        });

        this.setupBuffers();
        this.setupTexture();
        this.setupEvents();
        
        this.lastTime = performance.now();
        requestAnimationFrame((now) => this.render(now));
    }

    setupBuffers() {
        const gl = this.gl;
        const uv = new Float32Array((SEG_X + 1) * (SEG_Y + 1) * 2);
        let o = 0;
        for (let j = 0; j <= SEG_Y; j++) for (let i = 0; i <= SEG_X; i++) { uv[o++] = i / SEG_X; uv[o++] = j / SEG_Y; }
        const idx = new Uint16Array(SEG_X * SEG_Y * 6); o = 0;
        for (let j = 0; j < SEG_Y; j++) for (let i = 0; i < SEG_X; i++) {
            const a = j * (SEG_X + 1) + i, b = a + 1, c = a + SEG_X + 1, d = c + 1;
            idx[o++] = a; idx[o++] = b; idx[o++] = d; idx[o++] = a; idx[o++] = d; idx[o++] = c;
        }

        this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        this.idxLen = idx.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

        this.seedBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.seedBuf);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 20, 0); gl.vertexAttribDivisor(1, 1);
        gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 20, 16); gl.vertexAttribDivisor(2, 1);

        this.MAX_INSTANCES = 2000;
        this.offX = new Float32Array(this.MAX_INSTANCES); this.offY = new Float32Array(this.MAX_INSTANCES);
        this.velX = new Float32Array(this.MAX_INSTANCES); this.velY = new Float32Array(this.MAX_INSTANCES);
        this.collX = new Float32Array(this.MAX_INSTANCES); this.collY = new Float32Array(this.MAX_INSTANCES);
        this.collZ = new Float32Array(this.MAX_INSTANCES); this.pushX = new Float32Array(this.MAX_INSTANCES);
        this.pushY = new Float32Array(this.MAX_INSTANCES); this.offsetData = new Float32Array(this.MAX_INSTANCES * 2);

        this.offsetBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.offsetData, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 8, 0); gl.vertexAttribDivisor(3, 1);

        this.setCount(this.config.density);
    }

    setCount(n) {
        this.count = n;
        const d = new Float32Array(n * 5);
        for (let i = 0; i < n; i++) {
            const o = i * 5;
            d[o] = (0.5 + 0.819 * i) % 1; d[o + 1] = (0.5 + 0.671 * i) % 1; d[o + 2] = (0.5 + 0.549 * i) % 1;
            d[o + 3] = ((i * 0.618) % 1) * 0.97 + 0.013; d[o + 4] = i === 0 ? 1 : 0;
        }
        d[1] = 0.35;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.seedBuf);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, d, this.gl.STATIC_DRAW);
        this.offX.fill(0); this.offY.fill(0); this.velX.fill(0); this.velY.fill(0);
    }

    setupTexture() {
        const gl = this.gl;
        this.tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([220, 220, 216, 255]));
        
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => {
            const c = document.createElement("canvas"); c.width = ATLAS; c.height = ATLAS;
            const ctx = c.getContext("2d");
            for (let f = 0; f < 2; f++) {
                const top = f * (ATLAS / 2); ctx.save(); ctx.beginPath(); ctx.rect(0, top, ATLAS, ATLAS / 2); ctx.clip();
                ctx.drawImage(im, 0, top, ATLAS, ATLAS / 2); ctx.drawImage(im, 0, top + GUTTER, ATLAS, ATLAS / 2 - 2 * GUTTER); ctx.restore();
            }
            gl.bindTexture(gl.TEXTURE_2D, this.tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
            gl.generateMipmap(gl.TEXTURE_2D);
        };
        im.src = this.config.bill.image;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }

    setupEvents() {
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
            this.canvas.width = window.innerWidth * dpr; this.canvas.height = window.innerHeight * dpr;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        };
        window.addEventListener("resize", resize); resize();
        
        document.addEventListener("pointermove", (e) => {
            this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
            this.pointer.ty = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        document.addEventListener("pointerleave", () => { this.pointer.tx = 0; this.pointer.ty = 0; });
    }

    render(now) {
        requestAnimationFrame((n) => this.render(n));
        const dt = Math.min(0.05, (now - this.lastTime) / 1000); this.lastTime = now;
        const gl = this.gl;
        
        const rate = this.config.speed / 50;
        this.time = (this.time + dt * rate) % 20000;
        this.tumble = (this.tumble + dt * rate * (this.config.motion.tumble / 50)) % 20000;

        gl.uniform1f(this.U.uTime, this.time); gl.uniform1f(this.U.uTumble, this.tumble);
        gl.uniform1f(this.U.uAspect, this.canvas.width / this.canvas.height); gl.uniform1f(this.U.uTanHalf, Math.tan(FOV / 2));
        gl.uniform2f(this.U.uSize, this.config.bill.itemWidth * MM, this.config.bill.itemHeight * MM);
        gl.uniform1f(this.U.uFlutter, this.config.motion.flutter / 100); gl.uniform1f(this.U.uSway, this.config.motion.sway / 100);
        gl.uniform3fv(this.U.uBase, this.config.base); gl.uniform3fv(this.U.uBg, this.config.bg);
        gl.uniform1f(this.U.uInteract, this.config.interaction / 100);
        gl.uniform1f(this.U.uGut, GUTTER / ATLAS);

        this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.08;
        this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.08;
        gl.uniform2f(this.U.uPointer, this.pointer.x, this.pointer.y);

        this.resolveCollisions(dt || 0.016);

        gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindVertexArray(this.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, this.idxLen, gl.UNSIGNED_SHORT, 0, this.count);
    }

    resolveCollisions(dt) {
        const aspect = this.canvas.width / this.canvas.height; const tanHalf = Math.tan(FOV / 2);
        const radius = 0.55 * Math.hypot(122 * MM, 72 * MM); const minDist = radius * 1.7;
        
        for (let i = 0; i < this.count; i++) {
            this.pushX[i] = 0; this.pushY[i] = 0;
            const sy = (0.5 + 0.671 * i) % 1; const fall = i===0 ? 0.22 : 0.9 + 0.7 * h1js(((i*0.618)%1)*0.97+0.013, 8.8);
            const z = i===0 ? HERO_Z : Z_NEAR + (Z_FAR - Z_NEAR) * ((0.5 + 0.549 * i) % 1);
            const hh = z * tanHalf; const rangeY = 2 * (hh + 0.6*radius + 0.1);
            const yRaw = sy * rangeY + fall * this.time;
            this.collY[i] = (hh + 0.6*radius + 0.1) - (((yRaw % rangeY) + rangeY) % rangeY) + this.offY[i];
            this.collX[i] = (i===0 ? 0.12 * hh*aspect : (((0.5 + 0.819 * i) % 1) * 2 - 1) * (hh*aspect + (0.6*radius + 0.1)*0.5)) + this.offX[i];
            this.collZ[i] = z;
        }

        for (let i = 0; i < this.count; i++) {
            for (let j = i + 1; j < this.count; j++) {
                if (Math.abs(this.collZ[i] - this.collZ[j]) > minDist) continue;
                const dx = this.collX[i] - this.collX[j]; const dy = this.collY[i] - this.collY[j];
                const dist = Math.hypot(dx, dy);
                if (dist > 1e-4 && dist < minDist) {
                    const push = ((minDist - dist) / dist) * 0.5;
                    this.pushX[i] += dx * push; this.pushY[i] += dy * push;
                    this.pushX[j] -= dx * push; this.pushY[j] -= dy * push;
                }
            }
        }

        for (let i = 0; i < this.count; i++) {
            this.velX[i] += (this.pushX[i] * 45 - this.offX[i] * 22) * dt;
            this.velY[i] += (this.pushY[i] * 45 - this.offY[i] * 22) * dt;
            const damp = Math.max(0, 1 - 9 * dt);
            this.velX[i] *= damp; this.velY[i] *= damp;
            this.offX[i] += this.velX[i] * dt; this.offY[i] += this.velY[i] * dt;
            this.offsetData[i * 2] = this.offX[i]; this.offsetData[i * 2 + 1] = this.offY[i];
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.offsetBuf);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.offsetData.subarray(0, this.count * 2));
    }
}

// Inicializa quando a página carrega
window.addEventListener("DOMContentLoaded", () => {
    new MoneyRainEngine("money-rain-canvas");
});