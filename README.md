# Money-Rain---Animation-_-KIT
Drop-in WebGL financial animation engine.
# Premium WebGL Money Rain Engine (Vanilla JS)

> A zero-dependency, ultra-high-performance 3D financial animation engine built with pure HTML, CSS, and native WebGL2. Designed to give SaaS landing pages, crypto platforms, and B2B agencies a high-end, expensive feel.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success.svg)](#)
[![WebGL2](https://img.shields.io/badge/WebGL2-Supported-990000?logo=webgl&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext)

![Money Rain Demo Preview](https://via.placeholder.com/1200x600/050505/FFB23F?text=Insert+a+GIF+or+Screenshot+of+the+Animation+Here)

---

## Why this engine?

Most 3D web animations rely on heavy libraries like Three.js or React Three Fiber, causing slow load times and frame drops. 

This engine is built entirely from scratch using raw WebGL2 Shaders (GLSL) and Vanilla JavaScript. It uses hardware-accelerated instanced rendering and spatial grid collision detection to render thousands of falling bills at a buttery-smooth 60 FPS, without breaking a sweat.

### Core Features:
- **Zero Dependencies:** Pure HTML, CSS, and JS. No NPM, no build tools required for the core engine.
- **Custom Collision Physics:** Built-in elastic collision detection prevents bills from overlapping.
- **Magnetic Pointer Interaction:** The bills react fluidly to the user's mouse/touch movement in real-time.
- **Procedural Wind & Gravity:** Custom GLSL shaders calculate flutter, tumble, and sway mathematically on the GPU.
- **Dynamic Atlas Texturing:** Drop in any high-res image, and the engine automatically maps it to the 3D bill geometry.

---

## Quick Start

Since this is a Vanilla JS environment, running it is as simple as opening a file.

1. Clone the repository:
\`\`\`bash
git clone https://github.com/kauansilva/vanilla-money-rain.git
\`\`\`
2. Navigate to the folder:
\`\`\`bash
cd vanilla-money-rain
\`\`\`
3. Open \`index.html\` in your browser, or use VS Code Live Server.

That's it. No package installation, no waiting.

---

## Configuration

You can easily tweak the physics and visuals by editing the \`this.config\` object inside the \`constructor\` of the JavaScript block.

\`\`\`javascript
this.config = {
    // Environment Colors
    bg: parseColor("#050505", [0.02, 0.02, 0.02]),
    base: parseColor("#CDD6C6", [0.8, 0.84, 0.78]),
    
    // Physics & Density
    density: 587,         // Number of bills (Max 2000)
    speed: 50,            // Fall speed
    interaction: 40,      // Mouse magnetic strength
    
    // Bill Dimensions & Texture
    bill: { 
        itemWidth: 122, 
        itemHeight: 72, 
        image: "https://images.unsplash.com/photo-1591537185130-42c4c19eb5e2?w=900&auto=format&fit=crop&q=60"
    },
    
    // Shader Motion Parameters
    motion: { 
        flutter: 156, 
        tumble: 50, 
        sway: 100 
    }
};
\`\`\`

---

## B2B Commercial & React Production Bundle

This repository provides the core open-source Vanilla JavaScript engine. 

If you are an agency owner, SaaS founder, or developer looking for the React/Next.js Plug-and-Play Component, featuring:
- Full TypeScript support.
- React hooks integration (useRef, useEffect).
- Multi-currency setups (render USD, EUR, and Crypto simultaneously).
- Commercial redistribution rights for client projects.

## License & Credits

Distributed under the MIT License. See \`LICENSE\` for more information.

Engineered with precision by **[Kauan Silva](https://github.com/kauansilva)** — Co-founder @ TechZynk.
