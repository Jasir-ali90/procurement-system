import { useEffect, useRef } from 'react';

export default function ThreeDBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Smooth Mouse Tracking & Parallax
        let mouseX = width / 2;
        let mouseY = height / 2;
        let smoothMouseX = width / 2;
        let smoothMouseY = height / 2;

        let normMouseX = 0; // -1 to 1
        let normMouseY = 0; // -1 to 1
        let targetRotX = 0;
        let targetRotY = 0;
        let currentRotX = 0;
        let currentRotY = 0;

        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            normMouseX = (e.clientX - width / 2) / (width / 2);
            normMouseY = (e.clientY - height / 2) / (height / 2);
            targetRotY = normMouseX * 0.35;
            targetRotX = -normMouseY * 0.35;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // 3D Engine Constants
        const fov = 540;
        let time = 0;

        // 1. Particle Cloud (Starfield & Energy Nodes)
        const particleCount = 125;
        const particles = [];
        const colors = [
            '#FF7E5F', // Coral Peach
            '#FFA088', // Soft Peach
            '#FF6036', // Neon Peach
            '#C084FC', // Bright Violet
            '#CE86E4', // Bright Plum
            '#E05375', // Crimson Plum
            '#FBBF24'  // Gold Accent
        ];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: (Math.random() - 0.5) * 1800,
                y: (Math.random() - 0.5) * 1200,
                z: (Math.random() - 0.5) * 1100,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                vz: (Math.random() - 0.5) * 0.35,
                size: Math.random() * 2.8 + 1.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                pulseSpeed: Math.random() * 0.025 + 0.015,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }

        // 2. Dual 3D Floating Gemstone Guardians with Shaded Facets
        const phi = (1 + Math.sqrt(5)) / 2;
        const gemScale = 85;
        const rawGemVertices = [
            [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
            [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
            [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
        ].map(([x, y, z]) => ({
            x: (x / Math.sqrt(1 + phi * phi)) * gemScale,
            y: (y / Math.sqrt(1 + phi * phi)) * gemScale,
            z: (z / Math.sqrt(1 + phi * phi)) * gemScale
        }));

        // 20 Triangular Faces of Icosahedron
        const gemFaces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ];

        // 3. Wide Orbiting 3D Energy Rings behind & around the center
        const wideRings = [
            { radius: 490, tiltX: 0.9, tiltY: 0.35, speed: 0.005, color: 'rgba(255, 126, 95, 0.45)', dash: [8, 14], sparkAngle: 0 },
            { radius: 620, tiltX: 1.25, tiltY: -0.4, speed: -0.0035, color: 'rgba(192, 132, 252, 0.4)', dash: [6, 12], sparkAngle: 2 },
            { radius: 760, tiltX: 0.5, tiltY: 0.9, speed: 0.0028, color: 'rgba(255, 160, 136, 0.35)', dash: [10, 18], sparkAngle: 4 }
        ];

        // 4. Enterprise Futuristic Telemetry HUD Cards (Positioned in outer flanks)
        const hudCards = [
            // Left Column
            {
                side: 'left',
                yPct: 0.34,
                tag: 'FINANCIAL SPEND CORE',
                value: '$4,850,290.00',
                detail: 'Budget Allocation: 68.4%',
                stat: '+14.2% YoY',
                statColor: '#34D399',
                accentColor: '#FF7E5F',
                sparkPoints: [20, 35, 25, 45, 38, 62, 55, 78, 90]
            },
            {
                side: 'left',
                yPct: 0.59,
                tag: 'ACTIVE REQUISITIONS',
                value: '18 Open RFQs',
                detail: '4 Departments Multi-Bidding',
                stat: 'Realtime Sync',
                statColor: '#FFA088',
                accentColor: '#CE86E4',
                sparkPoints: [40, 30, 50, 45, 60, 55, 75, 70, 85]
            },
            {
                side: 'left',
                yPct: 0.83,
                tag: 'INVENTORY INTAKE GUARD',
                value: '100% Non-Overage',
                detail: 'Strict Purchase Order Caps',
                stat: 'Locked Protection',
                statColor: '#60A5FA',
                accentColor: '#34D399',
                sparkPoints: [10, 30, 20, 50, 40, 70, 60, 80, 100]
            },
            // Right Column
            {
                side: 'right',
                yPct: 0.34,
                tag: 'VENDOR COMPLIANCE GATE',
                value: '99.8% Certified',
                detail: 'Tier-1 Supplier Evaluation',
                stat: '5.0 ★ Rating',
                statColor: '#FBBF24',
                accentColor: '#FBBF24',
                sparkPoints: [60, 70, 65, 80, 75, 90, 85, 95, 99]
            },
            {
                side: 'right',
                yPct: 0.59,
                tag: 'QUANTUM DATA ENCRYPTION',
                value: '256-Bit SSL Core',
                detail: 'Role-Based Department Vault',
                stat: 'Zero Leak Protocol',
                statColor: '#34D399',
                accentColor: '#FF6036',
                sparkPoints: [30, 45, 40, 65, 55, 75, 85, 90, 100]
            },
            {
                side: 'right',
                yPct: 0.83,
                tag: 'ERP INTEGRATION STATUS',
                value: '18ms Latency',
                detail: 'SAP • Oracle • Dynamics Ready',
                stat: 'Live Bi-Directional',
                statColor: '#C084FC',
                accentColor: '#A855F7',
                sparkPoints: [50, 40, 60, 55, 70, 65, 80, 85, 95]
            }
        ];

        // 3D Matrix Rotation Utility
        const rotate3D = (x, y, z, rx, ry, rz = 0) => {
            const y1 = y * Math.cos(rx) - z * Math.sin(rx);
            const z1 = y * Math.sin(rx) + z * Math.cos(rx);

            const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
            const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);

            const x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
            const y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);

            return { x: x3, y: y3, z: z2 };
        };

        const render = () => {
            time += 0.015;

            // Damping on mouse tracking
            smoothMouseX += (mouseX - smoothMouseX) * 0.07;
            smoothMouseY += (mouseY - smoothMouseY) * 0.07;

            currentRotX += (targetRotX - currentRotX) * 0.04;
            currentRotY += (targetRotY - currentRotY) * 0.04;

            const cx = width / 2;
            const cy = height / 2;

            // 1. Deep Cosmic Plum & Black Velvet Gradient Foundation
            const bgGrad = ctx.createRadialGradient(
                cx, cy, 80,
                cx, cy, Math.max(width, height) * 0.85
            );
            bgGrad.addColorStop(0, '#260630'); // Rich Deep Plum Core
            bgGrad.addColorStop(0.35, '#190320'); // Velvet Midnight Plum
            bgGrad.addColorStop(0.70, '#0E0213'); // Deep Cosmic Space
            bgGrad.addColorStop(1, '#060109'); // Obsidian Edge
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // 2. Ambient Oscillating Nebulae with Vibrant Peach & Plum Bloom
            // Left Peach/Coral Nebula
            const neb1X = width * 0.16 + Math.sin(time * 0.4) * 70;
            const neb1Y = height * 0.36 + Math.cos(time * 0.35) * 60;
            const neb1 = ctx.createRadialGradient(neb1X, neb1Y, 0, neb1X, neb1Y, width * 0.42);
            neb1.addColorStop(0, 'rgba(255, 126, 95, 0.22)');
            neb1.addColorStop(0.4, 'rgba(255, 96, 54, 0.08)');
            neb1.addColorStop(1, 'rgba(255, 126, 95, 0)');
            ctx.fillStyle = neb1;
            ctx.fillRect(0, 0, width, height);

            // Right Royal Plum/Violet Nebula
            const neb2X = width * 0.84 + Math.cos(time * 0.35) * 70;
            const neb2Y = height * 0.58 + Math.sin(time * 0.4) * 60;
            const neb2 = ctx.createRadialGradient(neb2X, neb2Y, 0, neb2X, neb2Y, width * 0.45);
            neb2.addColorStop(0, 'rgba(168, 85, 247, 0.24)');
            neb2.addColorStop(0.4, 'rgba(206, 134, 228, 0.09)');
            neb2.addColorStop(1, 'rgba(168, 85, 247, 0)');
            ctx.fillStyle = neb2;
            ctx.fillRect(0, 0, width, height);

            // 3. Interactive Cursor Gravitational Beacon (Luminous Soft Spotlight)
            const cursorGlow = ctx.createRadialGradient(
                smoothMouseX, smoothMouseY, 0,
                smoothMouseX, smoothMouseY, 320
            );
            cursorGlow.addColorStop(0, 'rgba(255, 160, 136, 0.20)');
            cursorGlow.addColorStop(0.35, 'rgba(192, 132, 252, 0.10)');
            cursorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = cursorGlow;
            ctx.fillRect(0, 0, width, height);

            // 4. 3D Perspective Digital Cyber-Grid Floor with Pulsing Neon Waves
            const gridYBase = height * 0.63;
            const gridLinesZ = 14;
            const gridSpacingX = 100;
            const gridOffsetZ = (time * 45) % 65;

            ctx.save();
            // Glowing horizon light beam
            const horizonGrad = ctx.createLinearGradient(0, gridYBase - 8, 0, gridYBase + 35);
            horizonGrad.addColorStop(0, 'rgba(255, 126, 95, 0)');
            horizonGrad.addColorStop(0.3, 'rgba(255, 126, 95, 0.35)');
            horizonGrad.addColorStop(0.6, 'rgba(206, 134, 228, 0.25)');
            horizonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = horizonGrad;
            ctx.fillRect(0, gridYBase - 8, width, 45);

            // Horizon line
            ctx.beginPath();
            ctx.moveTo(0, gridYBase);
            ctx.lineTo(width, gridYBase);
            ctx.strokeStyle = 'rgba(255, 160, 136, 0.55)';
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Horizontal lines receding into horizon
            for (let i = 0; i < gridLinesZ; i++) {
                const z = i * 65 - gridOffsetZ + 110;
                const scale = fov / (fov + z);
                const py = gridYBase + (z * 0.44) * scale;
                const alpha = Math.max(0, Math.min(0.35, (1 - z / 950) * 0.38));

                // Traveling pulse wave highlight
                const isPulseWave = Math.abs((z - ((time * 80) % 800))) < 55;
                const strokeColor = isPulseWave
                    ? `rgba(255, 160, 136, ${Math.min(0.85, alpha * 2.5)})`
                    : `rgba(255, 126, 95, ${alpha})`;

                if (py < height) {
                    ctx.beginPath();
                    ctx.moveTo(0, py);
                    ctx.lineTo(width, py);
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = isPulseWave ? 2 : 1;
                    ctx.stroke();
                }
            }

            // Radial perspective lines radiating from center horizon
            const colCount = 18;
            for (let c = -colCount / 2; c <= colCount / 2; c++) {
                const worldX = c * gridSpacingX;
                const pNear = { x: cx + worldX * 2.4, y: height };
                const pFar = { x: cx + worldX * 0.28 + currentRotY * 180, y: gridYBase };

                ctx.beginPath();
                ctx.moveTo(pNear.x, pNear.y);
                ctx.lineTo(pFar.x, pFar.y);
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.16)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();

            // 5. Draw Wide Orbiting 3D Energy Rings with Traveling Comet Sparks
            wideRings.forEach((ring) => {
                const ringAngle = time * ring.speed * 40;
                ctx.save();
                ctx.translate(cx, cy);

                ctx.beginPath();
                const segments = 80;
                let sparkPoint = null;
                ring.sparkAngle += ring.speed * 1.6;

                for (let i = 0; i <= segments; i++) {
                    const theta = (i / segments) * Math.PI * 2;
                    const rx = ring.radius * Math.cos(theta);
                    const ry = ring.radius * Math.sin(theta);

                    const p1 = rotate3D(rx, ry, 0, ring.tiltX + ringAngle, ring.tiltY);
                    const p2 = rotate3D(p1.x, p1.y, p1.z, currentRotX, currentRotY);

                    const depth = p2.z + 650;
                    if (depth > 20) {
                        const scale = fov / depth;
                        const sx = p2.x * scale;
                        const sy = p2.y * scale;

                        if (i === 0) ctx.moveTo(sx, sy);
                        else ctx.lineTo(sx, sy);

                        if (Math.abs(theta - (ring.sparkAngle % (Math.PI * 2))) < (Math.PI * 2) / segments) {
                            sparkPoint = { sx, sy, scale };
                        }
                    }
                }
                ctx.strokeStyle = ring.color;
                ctx.lineWidth = 1.8;
                ctx.setLineDash(ring.dash);
                ctx.stroke();

                // Draw orbiting photon comet spark
                if (sparkPoint) {
                    ctx.beginPath();
                    ctx.arc(sparkPoint.sx, sparkPoint.sy, 5 * sparkPoint.scale, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFF2EB';
                    ctx.shadowColor = '#FF7E5F';
                    ctx.shadowBlur = 16;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

                ctx.restore();
            });

            // Calculate gutter geometry outside central 1080px login card
            const halfCardW = Math.min(width * 0.48, 540);
            const gutterW = cx - halfCardW;
            const safeLeftX = Math.max(130, gutterW / 2);
            const safeRightX = Math.min(width - 130, width - (gutterW / 2));

            // 6. Draw Dual 3D Floating Gemstone Guardians (Shaded 3D Facets & Orbital Gyroscopes)
            const polyLeftCenter = { x: safeLeftX, y: height * 0.16 };
            const polyRightCenter = { x: safeRightX, y: height * 0.16 };

            const renderShadedGem = (centerX, centerY, rotSpeed, baseHue) => {
                const rotX = time * rotSpeed + currentRotX;
                const rotY = time * (rotSpeed * 1.3) + currentRotY;

                const proj = rawGemVertices.map(v => {
                    const r = rotate3D(v.x, v.y, v.z, rotX, rotY, time * 0.15);
                    const depth = r.z + 550;
                    const scale = depth > 30 ? (fov / depth) : 0;
                    return {
                        sx: centerX + r.x * scale,
                        sy: centerY + r.y * scale,
                        scale,
                        z: r.z
                    };
                });

                // Render shaded 3D triangular faces (back-to-front sorting for depth)
                const sortedFaces = gemFaces.map((faceIndices) => {
                    const v0 = proj[faceIndices[0]];
                    const v1 = proj[faceIndices[1]];
                    const v2 = proj[faceIndices[2]];
                    const avgZ = (v0.z + v1.z + v2.z) / 3;
                    return { faceIndices, avgZ };
                }).sort((a, b) => a.avgZ - b.avgZ);

                sortedFaces.forEach(({ faceIndices, avgZ }) => {
                    const v0 = proj[faceIndices[0]];
                    const v1 = proj[faceIndices[1]];
                    const v2 = proj[faceIndices[2]];

                    if (v0.scale > 0 && v1.scale > 0 && v2.scale > 0) {
                        ctx.beginPath();
                        ctx.moveTo(v0.sx, v0.sy);
                        ctx.lineTo(v1.sx, v1.sy);
                        ctx.lineTo(v2.sx, v2.sy);
                        ctx.closePath();

                        // Shaded translucent face fill based on depth & angle
                        const faceAlpha = Math.max(0.06, Math.min(0.24, (avgZ + 100) / 400));
                        ctx.fillStyle = baseHue === 'peach'
                            ? `rgba(255, 126, 95, ${faceAlpha})`
                            : `rgba(168, 85, 247, ${faceAlpha})`;
                        ctx.fill();

                        // Glowing facet edges
                        ctx.strokeStyle = baseHue === 'peach'
                            ? `rgba(255, 160, 136, ${faceAlpha * 2.2})`
                            : `rgba(206, 134, 228, ${faceAlpha * 2.2})`;
                        ctx.lineWidth = 1.1;
                        ctx.stroke();
                    }
                });

                // Glowing vertices
                proj.forEach(v => {
                    if (v.scale > 0) {
                        ctx.beginPath();
                        ctx.arc(v.sx, v.sy, 3.2 * v.scale, 0, Math.PI * 2);
                        ctx.fillStyle = baseHue === 'peach' ? '#FFA088' : '#E9D5FF';
                        ctx.shadowColor = baseHue === 'peach' ? '#FF7E5F' : '#A855F7';
                        ctx.shadowBlur = 10;
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                });

                // Gyroscope ring around gemstone
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.beginPath();
                const ringSegments = 40;
                const ringRad = 70;
                for (let r = 0; r <= ringSegments; r++) {
                    const theta = (r / ringSegments) * Math.PI * 2;
                    const rx = ringRad * Math.cos(theta);
                    const ry = ringRad * Math.sin(theta);
                    const pr = rotate3D(rx, ry, 0, rotX * 1.5, rotY * 1.2);
                    const scale = fov / (pr.z + 550);
                    const sx = pr.x * scale;
                    const sy = pr.y * scale;
                    if (r === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                ctx.strokeStyle = baseHue === 'peach' ? 'rgba(255, 126, 95, 0.4)' : 'rgba(168, 85, 247, 0.4)';
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.restore();
            };

            renderShadedGem(polyLeftCenter.x, polyLeftCenter.y, 0.42, 'peach');
            renderShadedGem(polyRightCenter.x, polyRightCenter.y, -0.38, 'plum');

            // 7. Interactive 3D Particles with Gravitational Push & Fluid Splines
            const projected = [];
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;

                if (p.x < -900 || p.x > 900) p.vx *= -1;
                if (p.y < -600 || p.y > 600) p.vy *= -1;
                if (p.z < -600 || p.z > 600) p.vz *= -1;

                const rot = rotate3D(p.x, p.y, p.z, currentRotX, currentRotY);
                const depth = rot.z + 620;

                if (depth > 20) {
                    const scale = fov / depth;
                    const sx = cx + rot.x * scale;
                    const sy = cy + rot.y * scale;

                    // Mouse gravitational push
                    const dx = sx - smoothMouseX;
                    const dy = sy - smoothMouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    let pushX = 0;
                    let pushY = 0;
                    if (dist < 200 && dist > 0) {
                        const force = (1 - dist / 200) * 24;
                        pushX = (dx / dist) * force;
                        pushY = (dy / dist) * force;
                    }

                    projected.push({
                        screenX: sx + pushX,
                        screenY: sy + pushY,
                        scale,
                        alpha: Math.min(1, Math.max(0.25, scale * 0.88)),
                        color: p.color,
                        baseSize: p.size,
                        pulse: Math.sin(time * 3 + p.pulseOffset) * 0.35 + 1
                    });
                }
            }

            // Connecting Lines between nearby particles
            for (let i = 0; i < projected.length; i++) {
                for (let j = i + 1; j < projected.length; j++) {
                    const p1 = projected[i];
                    const p2 = projected[j];
                    const dx = p1.screenX - p2.screenX;
                    const dy = p1.screenY - p2.screenY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 125) {
                        const lineAlpha = (1 - dist / 125) * 0.25 * Math.min(p1.alpha, p2.alpha);
                        ctx.beginPath();
                        ctx.moveTo(p1.screenX, p1.screenY);
                        ctx.lineTo(p2.screenX, p2.screenY);
                        ctx.strokeStyle = `rgba(255, 126, 95, ${lineAlpha})`;
                        ctx.lineWidth = 0.9;
                        ctx.stroke();
                    }
                }
            }

            // Draw glowing particles
            projected.forEach(p => {
                const radius = p.baseSize * p.scale * p.pulse;
                if (radius <= 0) return;

                ctx.save();
                ctx.beginPath();
                ctx.arc(p.screenX, p.screenY, radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8 * p.scale;
                ctx.fill();
                ctx.restore();
            });

            // 8. Futuristic Telemetry HUD Cards (Positioned in Outer Gutters, NEVER Touching the Central 1080px Card)
            const minGutterNeeded = 200;

            if (gutterW >= minGutterNeeded) {
                const hudAlpha = Math.min(1, (gutterW - minGutterNeeded) / 50);
                const cardW = Math.min(215, gutterW * 0.80);
                const cardH = 78;
                const rad = 14;

                hudCards.forEach((card, idx) => {
                    const baseX = card.side === 'left' ? safeLeftX : safeRightX;
                    const baseY = height * card.yPct;

                    // Parallax sway based on mouse tilt
                    const sx = baseX + currentRotY * 18;
                    const sy = baseY - currentRotX * 14 + Math.sin(time * 2 + idx * 1.3) * 6;

                    ctx.save();
                    ctx.globalAlpha = hudAlpha * 0.95;

                    const cardX = sx - cardW / 2;
                    const cardY = sy - cardH / 2;

                    // Glassmorphic HUD Card Body
                    ctx.fillStyle = 'rgba(28, 6, 38, 0.82)';
                    ctx.beginPath();
                    ctx.roundRect(cardX, cardY, cardW, cardH, rad);
                    ctx.fill();

                    // Glowing Neon Border
                    ctx.strokeStyle = card.accentColor;
                    ctx.lineWidth = 1.3;
                    ctx.shadowColor = card.accentColor;
                    ctx.shadowBlur = 8;
                    ctx.stroke();
                    ctx.shadowBlur = 0;

                    // Top Accent Line
                    ctx.fillStyle = card.accentColor;
                    ctx.beginPath();
                    ctx.roundRect(cardX + 18, cardY, cardW - 36, 2.5, 1);
                    ctx.fill();

                    // Card Header Tag
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
                    ctx.font = `bold 8.5px 'Plus Jakarta Sans', sans-serif`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(card.tag, cardX + 14, cardY + 11);

                    // Primary Value (Bold & Prominent)
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = `800 14px 'Plus Jakarta Sans', sans-serif`;
                    ctx.fillText(card.value, cardX + 14, cardY + 24);

                    // Mini Live Sparkline
                    const sparkX = cardX + 14;
                    const sparkY = cardY + 45;
                    const sparkW = cardW - 28;
                    const sparkH = 13;

                    ctx.beginPath();
                    const pts = card.sparkPoints;
                    pts.forEach((pt, pIdx) => {
                        const px = sparkX + (pIdx / (pts.length - 1)) * sparkW;
                        const wave = Math.sin(time * 3 + pIdx + idx) * 2.5;
                        const py = sparkY + sparkH - (pt / 100) * sparkH + wave;
                        if (pIdx === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    });
                    ctx.strokeStyle = card.accentColor;
                    ctx.lineWidth = 1.2;
                    ctx.stroke();

                    // Subtitle & Status Detail
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.60)';
                    ctx.font = `500 8px 'Plus Jakarta Sans', sans-serif`;
                    ctx.fillText(card.detail, cardX + 14, cardY + 63);

                    // Stat badge on right
                    ctx.fillStyle = card.statColor;
                    ctx.font = `bold 8px 'Plus Jakarta Sans', sans-serif`;
                    ctx.textAlign = 'right';
                    ctx.fillText(card.stat, cardX + cardW - 14, cardY + 11);

                    ctx.restore();
                });
            }

            // 9. Cyber Top Status Ribbon
            ctx.save();
            ctx.font = `600 10.5px 'Plus Jakarta Sans', monospace`;
            ctx.fillStyle = 'rgba(255, 160, 136, 0.55)';
            ctx.textAlign = 'left';
            ctx.fillText('⚡ E-PROCUREMENT ORCHESTRATION ENGINE // v2.4 HIGH-ASSURANCE', 28, 26);

            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(192, 132, 252, 0.55)';
            ctx.fillText('STATUS: OPERATIONAL ● 256-BIT QUANTUM TLS ● REGION: ENTERPRISE-GLOBAL', width - 28, 26);
            ctx.restore();

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                pointerEvents: 'none'
            }}
        />
    );
}
