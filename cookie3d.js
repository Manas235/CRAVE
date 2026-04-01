/**
 * cookie3d.js — Interactive 3D Cookie Model for the Crave Hero Section
 * Uses Three.js (loaded via CDN) to render a procedural cookie with toppings.
 */

(function () {
    'use strict';

    // ─── Wait for Three.js to be ready ─────────────────────────────────────────
    function waitForThree(cb) {
        if (typeof THREE !== 'undefined') { cb(); }
        else { setTimeout(() => waitForThree(cb), 50); }
    }

    waitForThree(initCookie3D);

    function initCookie3D() {
        const container = document.getElementById('cookie-3d-container');
        if (!container) return;

        // ─── Scene Setup ──────────────────────────────────────────────────────
        const scene = new THREE.Scene();

        const w = container.clientWidth || 480;
        const h = container.clientHeight || 480;
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
        camera.position.set(0, 0, 4.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // ─── Lighting ─────────────────────────────────────────────────────────
        const ambientLight = new THREE.AmbientLight(0xfff5e0, 0.7);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffecd2, 2.0);
        keyLight.position.set(4, 6, 5);
        keyLight.castShadow = true;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xff9a56, 0.6);
        fillLight.position.set(-4, 2, 3);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffd599, 0.4);
        rimLight.position.set(0, -3, -4);
        scene.add(rimLight);

        // ─── Cookie Base (cylinder with smooth edges) ─────────────────────────
        const cookieGroup = new THREE.Group();

        // Main disc
        const cookieGeo = new THREE.CylinderGeometry(1.4, 1.35, 0.28, 64, 4, false);
        const cookieMat = new THREE.MeshStandardMaterial({
            color: 0xc47c2b,
            roughness: 0.9,
            metalness: 0.0,
        });
        const cookieMesh = new THREE.Mesh(cookieGeo, cookieMat);
        cookieMesh.castShadow = true;
        cookieMesh.receiveShadow = true;
        cookieGroup.add(cookieMesh);

        // Golden top face
        const topGeo = new THREE.CircleGeometry(1.38, 64);
        const topMat = new THREE.MeshStandardMaterial({
            color: 0xd4902f,
            roughness: 0.85,
            metalness: 0.05,
        });
        const topMesh = new THREE.Mesh(topGeo, topMat);
        topMesh.rotation.x = -Math.PI / 2;
        topMesh.position.y = 0.141;
        cookieGroup.add(topMesh);

        // ─── Bumpy surface texture (noise bumps) ──────────────────────────────
        addSurfaceBumps(cookieGroup);

        // ─── Chocolate chips ──────────────────────────────────────────────────
        addChocolateChips(cookieGroup);

        // ─── Chocolate chunks (bigger, irregular) ─────────────────────────────
        addChocolateChunks(cookieGroup);

        scene.add(cookieGroup);

        // ─── Floating particle crumbs ─────────────────────────────────────────
        const crumbsGroup = addCrumbs(scene);

        // ─── Mouse / Touch Drag Rotation ──────────────────────────────────────
        let isDragging = false;
        let prevMouse = { x: 0, y: 0 };
        let rotVelocity = { x: 0, y: 0 };
        let targetRot = { x: 0.3, y: 0 };

        const canvas = renderer.domElement;

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            prevMouse = { x: e.clientX, y: e.clientY };
        });
        window.addEventListener('mouseup', () => { isDragging = false; });
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - prevMouse.x;
            const dy = e.clientY - prevMouse.y;
            rotVelocity.y = dx * 0.012;
            rotVelocity.x = dy * 0.008;
            prevMouse = { x: e.clientX, y: e.clientY };
        });

        // Touch
        canvas.addEventListener('touchstart', (e) => {
            isDragging = true;
            prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });
        canvas.addEventListener('touchend', () => { isDragging = false; });
        canvas.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const dx = e.touches[0].clientX - prevMouse.x;
            const dy = e.touches[0].clientY - prevMouse.y;
            rotVelocity.y = dx * 0.012;
            rotVelocity.x = dy * 0.008;
            prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });

        // ─── Resize Handler ───────────────────────────────────────────────────
        const resizeObserver = new ResizeObserver(() => {
            const nw = container.clientWidth;
            const nh = container.clientHeight;
            camera.aspect = nw / nh;
            camera.updateProjectionMatrix();
            renderer.setSize(nw, nh);
        });
        resizeObserver.observe(container);

        // ─── Animation Loop ───────────────────────────────────────────────────
        let time = 0;
        function animate() {
            requestAnimationFrame(animate);
            time += 0.016;

            if (!isDragging) {
                // Auto-rotate slowly
                cookieGroup.rotation.y += 0.006;
            } else {
                targetRot.y += rotVelocity.y;
                targetRot.x += rotVelocity.x;
                cookieGroup.rotation.y = THREE.MathUtils.lerp(cookieGroup.rotation.y, cookieGroup.rotation.y + rotVelocity.y, 0.5);
                cookieGroup.rotation.x = THREE.MathUtils.clamp(
                    THREE.MathUtils.lerp(cookieGroup.rotation.x, cookieGroup.rotation.x + rotVelocity.x, 0.5),
                    -0.8, 0.8
                );
            }

            // Dampen velocity
            rotVelocity.x *= 0.85;
            rotVelocity.y *= 0.85;

            // Gentle float
            cookieGroup.position.y = Math.sin(time * 0.8) * 0.06;

            // Crumbs orbit slowly
            crumbsGroup.rotation.y += 0.002;
            crumbsGroup.rotation.x = Math.sin(time * 0.3) * 0.05;

            renderer.render(scene, camera);
        }

        animate();
    }

    // ─── Helper: Surface bumpiness ────────────────────────────────────────────
    function addSurfaceBumps(group) {
        const bumpMat = new THREE.MeshStandardMaterial({ color: 0xb8722a, roughness: 1.0 });
        const positions = [];
        const count = 18;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.1;
            positions.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r });
        }

        positions.forEach(({ x, z }) => {
            const size = 0.08 + Math.random() * 0.1;
            const geo = new THREE.SphereGeometry(size, 6, 6);
            const bump = new THREE.Mesh(geo, bumpMat);
            bump.position.set(x, 0.14, z);
            bump.scale.y = 0.4;
            group.add(bump);
        });
    }

    // ─── Helper: Chocolate chips (small flat discs) ───────────────────────────
    function addChocolateChips(group) {
        const chipMat = new THREE.MeshStandardMaterial({
            color: 0x3b1f0a,
            roughness: 0.7,
            metalness: 0.1,
        });

        const chipPositions = [
            { x: 0.5, z: 0.3 }, { x: -0.6, z: 0.2 }, { x: 0.1, z: -0.7 },
            { x: -0.3, z: -0.5 }, { x: 0.8, z: -0.2 }, { x: -0.8, z: -0.4 },
            { x: 0.2, z: 0.8 }, { x: -0.1, z: 0.6 }, { x: 0.65, z: 0.65 },
            { x: -0.55, z: 0.7 }, { x: 0.9, z: 0.5 }, { x: -0.9, z: 0.1 },
        ];

        chipPositions.forEach(({ x, z }) => {
            const geo = new THREE.CylinderGeometry(0.12, 0.1, 0.09, 8);
            const chip = new THREE.Mesh(geo, chipMat);
            chip.position.set(x, 0.17, z);
            chip.rotation.y = Math.random() * Math.PI;
            group.add(chip);
        });
    }

    // ─── Helper: Chocolate chunks (irregular, bigger) ─────────────────────────
    function addChocolateChunks(group) {
        const chunkMat = new THREE.MeshStandardMaterial({
            color: 0x5c3317,
            roughness: 0.8,
        });

        const chunkPositions = [
            { x: -0.2, z: 0.1 }, { x: 0.3, z: -0.3 }, { x: -0.5, z: -0.1 },
        ];

        chunkPositions.forEach(({ x, z }) => {
            const geo = new THREE.BoxGeometry(0.18, 0.12, 0.16);
            const chunk = new THREE.Mesh(geo, chunkMat);
            chunk.position.set(x, 0.19, z);
            chunk.rotation.y = Math.random() * Math.PI;
            chunk.rotation.z = (Math.random() - 0.5) * 0.3;
            group.add(chunk);
        });
    }

    // ─── Helper: Floating crumb particles ────────────────────────────────────
    function addCrumbs(scene) {
        const crumbsGroup = new THREE.Group();
        const crumbMat = new THREE.MeshStandardMaterial({ color: 0xd9943a, roughness: 1.0 });

        for (let i = 0; i < 22; i++) {
            const size = 0.025 + Math.random() * 0.055;
            const geo = new THREE.SphereGeometry(size, 5, 5);
            const crumb = new THREE.Mesh(geo, crumbMat);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = 1.8 + Math.random() * 0.9;

            crumb.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                (Math.random() - 0.5) * 1.4,
                r * Math.sin(phi) * Math.sin(theta)
            );

            crumbsGroup.add(crumb);
        }

        scene.add(crumbsGroup);
        return crumbsGroup;
    }

})();
