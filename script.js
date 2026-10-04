/* script.js */
const apiKey = "e7b54271ccce222dba29d25eb1121f66";
let currentUnit = "metric"; // "metric" for Celsius, "imperial" for Fahrenheit
let tempChartInstance = null;
let searchHistory = JSON.parse(localStorage.getItem('skyroute_history')) || [];
let favorites = JSON.parse(localStorage.getItem('skyroute_favorites')) || [];
let packingList = JSON.parse(localStorage.getItem('skyroute_packing')) || [];
let mapInstance = null;
let mapMarker = null;
let currentCity = "";

// =====================================================
// WEATHER ANIMATION ENGINE
// =====================================================
const WeatherScene = (() => {
    let canvas, ctx, animFrame, particles, currentType;
    let partlyCloudy = false, partlyCloudyParticles = [];
    let W, H;
    let isTabVisible = true;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Particle pool
    function createParticles(count, factory) {
        particles = [];
        for (let i = 0; i < count; i++) particles.push(factory(true));
    }

    // ---------- SUNNY ----------
    function sunnyFactory(init) {
        return {
            // Light ray particle
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 120 + 40,
            alpha: Math.random() * 0.15 + 0.08,
            speed: Math.random() * 0.15 + 0.05,
            drift: Math.random() * 0.3 - 0.15,
        };
    }
    function drawSunny() {
        // Warm gradient background glow
        const grad = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, W * 0.8);
        grad.addColorStop(0, 'rgba(255, 220, 100, 0.4)');
        grad.addColorStop(0.5, 'rgba(255, 200, 80, 0.15)');
        grad.addColorStop(1, 'rgba(255, 200, 80, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Rotating sun with rays — positioned below the top-bar
        const sunX = W * 0.75, sunY = H * 0.28;
        const time = Date.now() * 0.0003;

        // Outer glow
        const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 130);
        glow.addColorStop(0, 'rgba(255, 200, 60, 0.5)');
        glow.addColorStop(0.5, 'rgba(255, 200, 60, 0.2)');
        glow.addColorStop(1, 'rgba(255, 200, 60, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 130, 0, Math.PI * 2);
        ctx.fill();

        // Sun disk
        const diskGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 42);
        diskGrad.addColorStop(0, 'rgba(255, 235, 160, 1)');
        diskGrad.addColorStop(1, 'rgba(255, 195, 60, 0.9)');
        ctx.fillStyle = diskGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 42, 0, Math.PI * 2);
        ctx.fill();

        // Rays
        ctx.save();
        ctx.translate(sunX, sunY);
        ctx.rotate(time);
        for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.moveTo(48, 0);
            ctx.lineTo(90 + Math.sin(time * 3 + i) * 12, 0);
            ctx.strokeStyle = `rgba(255, 210, 80, ${0.4 + Math.sin(time * 2 + i) * 0.1})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.restore();

        // Floating light orbs
        for (const p of particles) {
            p.x += p.drift;
            p.y -= p.speed;
            if (p.y + p.r < 0) { p.y = H + p.r; p.x = Math.random() * W; }
            if (p.x < -p.r) p.x = W + p.r;
            if (p.x > W + p.r) p.x = -p.r;

            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, `rgba(255, 230, 120, ${p.alpha})`);
            g.addColorStop(1, 'rgba(255, 230, 120, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---------- NIGHT ----------
    function nightFactory(init) {
        return {
            x: Math.random() * W,
            y: Math.random() * H * 0.85,
            r: Math.random() * 1.8 + 0.4,
            alpha: Math.random() * 0.7 + 0.3,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            phase: Math.random() * Math.PI * 2,
        };
    }
    function drawNight() {
        // Deep sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        skyGrad.addColorStop(0, 'rgba(8, 15, 40, 0.6)');
        skyGrad.addColorStop(1, 'rgba(13, 27, 42, 0.3)');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Moon — positioned below the top-bar
        const moonX = W * 0.75, moonY = H * 0.28, moonR = 30;
        const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 3.5);
        moonGlow.addColorStop(0, 'rgba(200, 210, 235, 0.35)');
        moonGlow.addColorStop(1, 'rgba(200, 210, 235, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2);
        ctx.fill();

        // Moon disk
        ctx.fillStyle = 'rgba(220, 230, 245, 0.85)';
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();
        // Crescent shadow
        ctx.fillStyle = 'rgba(13, 27, 42, 0.8)';
        ctx.beginPath();
        ctx.arc(moonX + 10, moonY - 4, moonR * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Stars
        const time = Date.now();
        for (const p of particles) {
            const twinkle = Math.sin(time * p.twinkleSpeed + p.phase) * 0.4 + 0.6;
            ctx.fillStyle = `rgba(220, 230, 255, ${p.alpha * twinkle})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---------- CLOUDY ----------
    function cloudFactory(init) {
        return {
            x: init ? Math.random() * W * 1.5 - W * 0.25 : -300,
            y: Math.random() * H * 0.6 + H * 0.05,
            w: Math.random() * 280 + 120,
            h: Math.random() * 50 + 30,
            speed: Math.random() * 0.25 + 0.08,
            alpha: Math.random() * 0.35 + 0.2,
        };
    }
    function drawCloud(p) {
        ctx.fillStyle = `rgba(180, 195, 215, ${p.alpha})`;
        // Multi-ellipse cloud shape
        const cx = p.x, cy = p.y, w = p.w, h = p.h;
        ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.5, h * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - w * 0.25, cy + h * 0.15, w * 0.35, h * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + w * 0.25, cy + h * 0.1, w * 0.3, h * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    }
    function drawCloudy() {
        for (const p of particles) {
            p.x += p.speed;
            if (p.x - p.w > W) {
                p.x = -p.w;
                p.y = Math.random() * H * 0.6 + H * 0.05;
            }
            drawCloud(p);
        }
    }

    // ---------- RAIN ----------
    function rainFactory(init) {
        return {
            x: Math.random() * W * 1.2 - W * 0.1,
            y: init ? Math.random() * H : -10,
            len: Math.random() * 18 + 8,
            speed: Math.random() * 4 + 6,
            alpha: Math.random() * 0.4 + 0.2,
            wind: Math.random() * 1.5 + 0.5,
        };
    }
    function drawRain() {
        // Rain clouds at the top
        ctx.fillStyle = 'rgba(140, 160, 185, 0.3)';
        ctx.beginPath(); ctx.ellipse(W * 0.2, -10, 250, 60, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(W * 0.6, 10, 300, 70, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(W * 0.9, -5, 220, 55, 0, 0, Math.PI * 2); ctx.fill();

        for (const p of particles) {
            p.x += p.wind;
            p.y += p.speed;
            if (p.y > H + 10) {
                p.y = -10;
                p.x = Math.random() * W * 1.2 - W * 0.1;
            }
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.wind * 2, p.y + p.len);
            ctx.strokeStyle = `rgba(120, 160, 210, ${p.alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }

    // ---------- THUNDERSTORM ----------
    let lastFlash = 0, flashAlpha = 0;
    function stormFactory(init) {
        return {
            x: Math.random() * W * 1.2 - W * 0.1,
            y: init ? Math.random() * H : -10,
            len: Math.random() * 22 + 12,
            speed: Math.random() * 5 + 8,
            alpha: Math.random() * 0.35 + 0.15,
            wind: Math.random() * 2 + 1,
        };
    }
    function drawLightningBolt(x, y) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 230, 0.9)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(180, 200, 255, 0.6)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(x, y);
        let cx = x, cy = y;
        for (let i = 0; i < 6; i++) {
            cx += (Math.random() - 0.5) * 40;
            cy += Math.random() * 35 + 15;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.restore();
    }
    function drawStorm() {
        // Dark storm clouds
        ctx.fillStyle = 'rgba(30, 40, 60, 0.4)';
        ctx.beginPath(); ctx.ellipse(W * 0.15, 0, 300, 80, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(W * 0.55, -10, 350, 90, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(W * 0.85, 5, 280, 75, 0, 0, Math.PI * 2); ctx.fill();

        // Lightning flash (infrequent)
        const now = Date.now();
        if (now - lastFlash > 4000 + Math.random() * 8000) {
            lastFlash = now;
            flashAlpha = 0.3;
            drawLightningBolt(Math.random() * W * 0.6 + W * 0.2, 20);
        }
        if (flashAlpha > 0) {
            ctx.fillStyle = `rgba(200, 210, 255, ${flashAlpha})`;
            ctx.fillRect(0, 0, W, H);
            flashAlpha -= 0.015;
        }

        // Heavy rain
        for (const p of particles) {
            p.x += p.wind;
            p.y += p.speed;
            if (p.y > H + 10) {
                p.y = -15;
                p.x = Math.random() * W * 1.2 - W * 0.1;
            }
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.wind * 2.5, p.y + p.len);
            ctx.strokeStyle = `rgba(100, 140, 200, ${p.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    // ---------- SNOW ----------
    function snowFactory(init) {
        return {
            x: Math.random() * W,
            y: init ? Math.random() * H : -5,
            r: Math.random() * 3 + 1,
            speed: Math.random() * 1.2 + 0.3,
            wind: Math.random() * 0.8 - 0.4,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.02 + 0.005,
            alpha: Math.random() * 0.5 + 0.3,
        };
    }
    function drawSnow() {
        // Light overcast
        ctx.fillStyle = 'rgba(200, 210, 225, 0.2)';
        ctx.beginPath(); ctx.ellipse(W * 0.3, 20, 300, 60, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(W * 0.7, 0, 350, 70, 0, 0, Math.PI * 2); ctx.fill();

        for (const p of particles) {
            p.wobble += p.wobbleSpeed;
            p.x += p.wind + Math.sin(p.wobble) * 0.5;
            p.y += p.speed;
            if (p.y > H + 5) {
                p.y = -5;
                p.x = Math.random() * W;
            }
            ctx.fillStyle = `rgba(240, 245, 255, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---------- FOG ----------
    function fogFactory(init) {
        return {
            x: init ? Math.random() * W : -W * 0.5,
            y: Math.random() * H,
            w: Math.random() * W * 0.8 + W * 0.3,
            h: Math.random() * 80 + 40,
            speed: Math.random() * 0.3 + 0.05,
            alpha: Math.random() * 0.2 + 0.1,
        };
    }
    function drawFog() {
        for (const p of particles) {
            p.x += p.speed;
            if (p.x > W + p.w * 0.5) {
                p.x = -p.w;
                p.y = Math.random() * H;
            }
            ctx.fillStyle = `rgba(190, 200, 215, ${p.alpha})`;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.w * 0.5, p.h * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---------- RENDER LOOP ----------
    const drawFunctions = {
        sunny: drawSunny,
        night: drawNight,
        cloudy: drawCloudy,
        rain: drawRain,
        storm: drawStorm,
        snow: drawSnow,
        fog: drawFog,
    };

    function render() {
        if (!isTabVisible || prefersReducedMotion) {
            animFrame = requestAnimationFrame(render);
            return;
        }
        ctx.clearRect(0, 0, W, H);
        if (currentType && drawFunctions[currentType]) {
            drawFunctions[currentType]();
        }
        // Partly-cloudy overlay (separate from drawFunctions to avoid mutation)
        if (partlyCloudy && partlyCloudyParticles.length) {
            for (const cp of partlyCloudyParticles) {
                cp.x += cp.speed;
                if (cp.x - cp.w > W) { cp.x = -cp.w; cp.y = Math.random() * H * 0.5; }
                drawCloud(cp);
            }
        }
        animFrame = requestAnimationFrame(render);
    }

    function resize() {
        if (!canvas) return;
        const main = canvas.parentElement;
        W = main.offsetWidth;
        H = main.offsetHeight;
        canvas.width = W;
        canvas.height = H;
    }

    // ---------- PUBLIC API ----------
    function init() {
        canvas = document.getElementById('weather-canvas');
        if (!canvas) { console.warn('[WeatherScene] canvas element not found'); return; }
        ctx = canvas.getContext('2d');
        resize();
        console.log(`[WeatherScene] init — canvas ${W}x${H}, ctx=${!!ctx}`);

        window.addEventListener('resize', () => { resize(); });
        document.addEventListener('visibilitychange', () => {
            isTabVisible = !document.hidden;
        });

        render();
    }

    function mapIconToType(iconCode) {
        if (!iconCode) return null;
        const id = iconCode.slice(0, 2);
        const isDay = !iconCode.endsWith('n');

        switch (id) {
            case '01': return isDay ? 'sunny' : 'night';
            case '02': return isDay ? 'sunny' : 'night'; // partly cloudy uses sunny/night + clouds
            case '03': case '04': return 'cloudy';
            case '09': return 'rain';
            case '10': return 'rain';
            case '11': return 'storm';
            case '13': return 'snow';
            case '50': return 'fog';
            default: return 'cloudy';
        }
    }

    function setWeather(iconCode) {
        if (prefersReducedMotion) return;
        const type = mapIconToType(iconCode);
        if (type === currentType) return;
        currentType = type;
        console.log(`[WeatherScene] setWeather(${iconCode}) → ${type}`);

        // Set atmosphere class on .main-content
        const main = document.querySelector('.main-content');
        if (main) {
            main.className = main.className.replace(/\batmos-\w+/g, '').trim();
            if (type) main.classList.add(`atmos-${type}`);
        }

        // Generate particles based on type
        resize(); // recalc W/H
        switch (type) {
            case 'sunny':
                createParticles(15, sunnyFactory);
                // For partly cloudy (02), add some cloud particles
                break;
            case 'night':
                createParticles(80, nightFactory);
                break;
            case 'cloudy':
                createParticles(8, cloudFactory);
                break;
            case 'rain':
                createParticles(200, rainFactory);
                break;
            case 'storm':
                createParticles(300, stormFactory);
                lastFlash = Date.now();
                flashAlpha = 0;
                break;
            case 'snow':
                createParticles(120, snowFactory);
                break;
            case 'fog':
                createParticles(12, fogFactory);
                break;
            default:
                particles = [];
        }

        // For partly cloudy (icon 02), overlay clouds via separate array
        // This avoids mutating drawFunctions which corrupts subsequent switches
        partlyCloudy = !!(iconCode && iconCode.slice(0, 2) === '02');
        if (partlyCloudy) {
            partlyCloudyParticles = [];
            for (let i = 0; i < 6; i++) partlyCloudyParticles.push(cloudFactory(true));
        } else {
            partlyCloudyParticles = [];
        }
    }

    return { init, setWeather };
})();


document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    updateHistoryUI();
    updateFavoritesUI();
    
    // Dashboard Search
    const searchBtn = document.getElementById("search-btn");
    const cityInput = document.getElementById("city-input");
    searchBtn.addEventListener("click", () => handleSearch(cityInput.value));
    cityInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch(cityInput.value);
    });

    document.getElementById("unit-c").addEventListener("click", () => setUnit("metric"));
    document.getElementById("unit-f").addEventListener("click", () => setUnit("imperial"));

    // Favorites btn on Dashboard
    document.getElementById("fav-btn").addEventListener("click", toggleFavorite);

    // Planner
    document.getElementById("planner-form").addEventListener("submit", handlePlannerSubmit);
    document.getElementById("reset-checklist").addEventListener("click", resetChecklist);
    document.getElementById("add-item-btn").addEventListener("click", addCustomPackingItem);
    
    // Compare
    document.getElementById("compare-btn").addEventListener("click", handleCompare);

    // Map
    document.getElementById("map-search-btn").addEventListener("click", () => {
        const query = document.getElementById("map-search").value;
        if(query) geocodeAndMap(query);
    });

    renderPackingList();

    // Initialize weather animation canvas
    WeatherScene.init();

    // Sidebar toggle for mobile
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarToggleBtn && sidebarEl) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebarEl.classList.toggle('sidebar-collapsed');
        });
    }

    // unit toggle aria-pressed sync
    document.getElementById('unit-c').addEventListener('click', () => {
        document.getElementById('unit-c').setAttribute('aria-pressed', 'true');
        document.getElementById('unit-f').setAttribute('aria-pressed', 'false');
    });
    document.getElementById('unit-f').addEventListener('click', () => {
        document.getElementById('unit-c').setAttribute('aria-pressed', 'false');
        document.getElementById('unit-f').setAttribute('aria-pressed', 'true');
    });
});

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll(".sidebar-nav li");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(n => n.classList.remove("active"));
            item.classList.add("active");
            
            const target = item.getAttribute("data-target");
            // Hide all sections and ensure hidden class
            document.querySelectorAll(".content-section").forEach(sec => {
                sec.classList.remove("active");
                sec.classList.add("hidden");
            });
            const targetSec = document.getElementById(target);
            if (targetSec) {
                targetSec.classList.add("active");
                targetSec.classList.remove("hidden");
            }

            // Initialize map if switching to it for the first time
            if (target === "map") {
                if (!mapInstance) {
                    initMap();
                } else {
                    mapInstance.invalidateSize();
                }
                if(currentCity) geocodeAndMap(currentCity);
            }
        });
    });
}

// Unit switch
function setUnit(unit) {
    if (currentUnit === unit) return;
    currentUnit = unit;
    
    document.getElementById("unit-c").classList.toggle("active", unit === "metric");
    document.getElementById("unit-f").classList.toggle("active", unit === "imperial");
    
    if (currentCity) {
        fetchWeatherData(currentCity);
    }
    
    // Update compare if visible
    if(document.getElementById("compare").classList.contains("active")){
        handleCompare();
    }
}

// Dashboard Fetching
function handleSearch(city) {
    if (!city.trim()) {
        showError("Please enter a valid city name.");
        return;
    }
    fetchWeatherData(city);
}

async function fetchWeatherData(city) {
    showLoading();
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${currentUnit}`;
        const response = await fetch(url);
        const data = await response.json();

        if (response.status !== 200) {
            showError(data.message || "City not found");
            return;
        }

        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${currentUnit}`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        currentCity = data.name;
        updateDashboard(data, forecastData);
        addToHistory(data.name);
        checkFavoriteStatus();

        if (mapInstance && document.getElementById("map").classList.contains("active")) {
            geocodeAndMap(data.name);
        }
    } catch (error) {
        showError("Failed to fetch weather data. Please try again later.");
        console.error(error);
    }
}

// Returns rich inline SVG weather illustrations with gradients and layered details
function getWeatherSVG(iconCode) {
    const id = iconCode ? iconCode.slice(0, 2) : '01';
    const isDay = iconCode ? !iconCode.endsWith('n') : true;

    const svgMap = {
        // ── CLEAR SKY ──
        '01': isDay
            ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
                <defs>
                    <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#FFFDE7"/>
                        <stop offset="50%" stop-color="#FFEB3B"/>
                        <stop offset="100%" stop-color="#F57F17"/>
                    </radialGradient>
                    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#FFF59D" stop-opacity="0.5"/>
                        <stop offset="100%" stop-color="#FFF59D" stop-opacity="0"/>
                    </radialGradient>
                    <filter id="sunShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#F57F17" flood-opacity="0.3"/>
                    </filter>
                </defs>
                <circle cx="40" cy="40" r="34" fill="url(#sunGlow)"/>
                <circle cx="40" cy="40" r="18" fill="url(#sunCore)" filter="url(#sunShadow)"/>
                <g stroke="#FFCA28" stroke-width="3" stroke-linecap="round">
                    <line x1="40" y1="6" x2="40" y2="14"/>
                    <line x1="40" y1="66" x2="40" y2="74"/>
                    <line x1="6" y1="40" x2="14" y2="40"/>
                    <line x1="66" y1="40" x2="74" y2="40"/>
                    <line x1="16" y1="16" x2="21.5" y2="21.5"/>
                    <line x1="58.5" y1="58.5" x2="64" y2="64"/>
                    <line x1="64" y1="16" x2="58.5" y2="21.5"/>
                    <line x1="21.5" y1="58.5" x2="16" y2="64"/>
                </g>
               </svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
                <defs>
                    <radialGradient id="moonGrad" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stop-color="#FFFFFF"/>
                        <stop offset="60%" stop-color="#E2E8F0"/>
                        <stop offset="100%" stop-color="#94A3B8"/>
                    </radialGradient>
                    <filter id="moonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#E2E8F0" flood-opacity="0.4"/>
                    </filter>
                </defs>
                <circle cx="40" cy="40" r="30" fill="rgba(226,232,240,0.1)"/>
                <path d="M56 40a18 18 0 1 1-22-17.4A14 14 0 0 0 56 36" fill="url(#moonGrad)" filter="url(#moonGlow)"/>
                <circle cx="32" cy="26" r="2.5" fill="#F8FAFC" opacity="0.8"/>
                <circle cx="52" cy="22" r="1.5" fill="#F8FAFC" opacity="0.6"/>
                <circle cx="60" cy="34" r="1" fill="#F8FAFC" opacity="0.5"/>
                <circle cx="24" cy="36" r="1.5" fill="#F8FAFC" opacity="0.6"/>
               </svg>`,

        // ── FEW CLOUDS (partly cloudy) ──
        '02': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
                <defs>
                    <radialGradient id="sunPc" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#FFFDE7"/>
                        <stop offset="70%" stop-color="#FFEB3B"/>
                        <stop offset="100%" stop-color="#F57F17"/>
                    </radialGradient>
                    <linearGradient id="cloudTop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#FFFFFF"/>
                        <stop offset="100%" stop-color="#E2E8F0"/>
                    </linearGradient>
                    <linearGradient id="cloudBottom" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#F8FAFC"/>
                        <stop offset="100%" stop-color="#CBD5E1"/>
                    </linearGradient>
                    <filter id="cloudShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.15"/>
                    </filter>
                </defs>
                ${isDay ? '<circle cx="28" cy="28" r="14" fill="url(#sunPc)"/><g stroke="#FFCA28" stroke-width="2.5" stroke-linecap="round"><line x1="28" y1="8" x2="28" y2="12"/><line x1="28" y1="44" x2="28" y2="48"/><line x1="8" y1="28" x2="12" y2="28"/><line x1="44" y1="28" x2="48" y2="28"/><line x1="14" y1="14" x2="17" y2="17"/><line x1="39" y1="39" x2="42" y2="42"/><line x1="42" y1="14" x2="39" y2="17"/><line x1="17" y1="39" x2="14" y2="42"/></g>' : ''}
                <g filter="url(#cloudShadow)">
                    <ellipse cx="48" cy="48" rx="24" ry="16" fill="url(#cloudTop)"/>
                    <ellipse cx="32" cy="52" rx="16" ry="12" fill="url(#cloudBottom)"/>
                    <ellipse cx="62" cy="52" rx="14" ry="10" fill="url(#cloudBottom)"/>
                </g>
               </svg>`,

        // ── SCATTERED CLOUDS ──
        '03': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
                <defs>
                    <linearGradient id="cloud03" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#FFFFFF"/>
                        <stop offset="100%" stop-color="#CBD5E1"/>
                    </linearGradient>
                    <filter id="cloudShadow03" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#0F172A" flood-opacity="0.15"/>
                    </filter>
                </defs>
                <g filter="url(#cloudShadow03)">
                    <ellipse cx="42" cy="38" rx="26" ry="16" fill="url(#cloud03)"/>
                    <ellipse cx="26" cy="46" rx="18" ry="12" fill="#F1F5F9"/>
                    <ellipse cx="58" cy="46" rx="16" ry="11" fill="#F1F5F9"/>
                </g>
               </svg>`,

        // ── BROKEN CLOUDS ──
        '04': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
                <defs>
                    <linearGradient id="cloudBack" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#94A3B8"/>
                        <stop offset="100%" stop-color="#64748B"/>
                    </linearGradient>
                    <linearGradient id="cloudFront" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#FFFFFF"/>
                        <stop offset="100%" stop-color="#CBD5E1"/>
                    </linearGradient>
                    <filter id="shadow04" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.2"/>
                    </filter>
                </defs>
                <g filter="url(#shadow04)">
                    <ellipse cx="36" cy="32" rx="22" ry="14" fill="url(#cloudBack)"/>
                    <ellipse cx="52" cy="38" rx="20" ry="13" fill="url(#cloudBack)"/>
                </g>
                <g filter="url(#shadow04)">
                    <ellipse cx="38" cy="46" rx="24" ry="15" fill="url(#cloudFront)"/>
                    <ellipse cx="22" cy="52" rx="16" ry="11" fill="#F8FAFC"/>
                    <ellipse cx="56" cy="52" rx="18" ry="12" fill="#F8FAFC"/>
                </g>
               </svg>`,

        // ── SHOWER RAIN ──
        '09': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
                <defs>
                    <linearGradient id="cloud09" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#64748B"/>
                        <stop offset="100%" stop-color="#334155"/>
                    </linearGradient>
                    <filter id="shadow09" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.25"/>
                    </filter>
                </defs>
                <g filter="url(#shadow09)">
                    <ellipse cx="40" cy="28" rx="24" ry="14" fill="url(#cloud09)"/>
                    <ellipse cx="24" cy="34" rx="16" ry="10" fill="#475569"/>
                    <ellipse cx="56" cy="34" rx="16" ry="10" fill="#475569"/>
                </g>
                <g stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round">
                    <line x1="26" y1="48" x2="22" y2="60"/>
                    <line x1="36" y1="48" x2="32" y2="60"/>
                    <line x1="46" y1="48" x2="42" y2="60"/>
                    <line x1="56" y1="48" x2="52" y2="60"/>
                </g>
               </svg>`,

        // ── RAIN ──
        '10': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
                <defs>
                    <linearGradient id="cloud10" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#475569"/>
                        <stop offset="100%" stop-color="#1E293B"/>
                    </linearGradient>
                    <filter id="shadow10" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.3"/>
                    </filter>
                </defs>
                ${isDay ? '<circle cx="20" cy="22" r="14" fill="#FFC107" opacity="0.9"/>' : ''}
                <g filter="url(#shadow10)">
                    <ellipse cx="44" cy="32" rx="24" ry="14" fill="url(#cloud10)"/>
                    <ellipse cx="28" cy="38" rx="16" ry="10" fill="#334155"/>
                    <ellipse cx="56" cy="38" rx="16" ry="10" fill="#334155"/>
                </g>
                <g stroke="#0EA5E9" stroke-width="2.5" stroke-linecap="round">
                    <line x1="26" y1="52" x2="22" y2="66"/>
                    <line x1="38" y1="52" x2="34" y2="66"/>
                    <line x1="50" y1="52" x2="46" y2="66"/>
                </g>
               </svg>`,

        // ── THUNDERSTORM ──
        '11': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
                <defs>
                    <linearGradient id="cloud11" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#334155"/>
                        <stop offset="100%" stop-color="#0F172A"/>
                    </linearGradient>
                    <filter id="shadow11" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000000" flood-opacity="0.4"/>
                    </filter>
                    <filter id="glow11" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#FDE047" flood-opacity="0.6"/>
                    </filter>
                </defs>
                <g filter="url(#shadow11)">
                    <ellipse cx="40" cy="26" rx="24" ry="14" fill="url(#cloud11)"/>
                    <ellipse cx="24" cy="32" rx="16" ry="10" fill="#1E293B"/>
                    <ellipse cx="56" cy="32" rx="16" ry="10" fill="#1E293B"/>
                </g>
                <g stroke="#475569" stroke-width="2" stroke-linecap="round" opacity="0.8">
                    <line x1="22" y1="46" x2="18" y2="58"/>
                    <line x1="58" y1="46" x2="54" y2="58"/>
                </g>
                <polyline points="46,40 38,56 44,56 35,72" stroke="#FDE047" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#glow11)"/>
               </svg>`,

        // ── SNOW ──
        '13': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
                <defs>
                    <linearGradient id="cloud13" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#F0F9FF"/>
                        <stop offset="100%" stop-color="#BAE6FD"/>
                    </linearGradient>
                    <filter id="shadow13" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0284C7" flood-opacity="0.15"/>
                    </filter>
                </defs>
                <g filter="url(#shadow13)">
                    <ellipse cx="40" cy="30" rx="24" ry="14" fill="url(#cloud13)"/>
                    <ellipse cx="24" cy="36" rx="16" ry="10" fill="#E0F2FE"/>
                    <ellipse cx="56" cy="36" rx="16" ry="10" fill="#E0F2FE"/>
                </g>
                <g fill="#FFFFFF" stroke="#7DD3FC" stroke-width="1">
                    <circle cx="26" cy="54" r="4.5"/>
                    <circle cx="40" cy="60" r="4.5"/>
                    <circle cx="54" cy="54" r="4.5"/>
                    <circle cx="33" cy="68" r="4"/>
                    <circle cx="47" cy="68" r="4"/>
                </g>
               </svg>`,

        // ── MIST / FOG ──
        '50': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
                <defs>
                    <linearGradient id="fog" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#CBD5E1" stop-opacity="0.2"/>
                        <stop offset="50%" stop-color="#F1F5F9" stop-opacity="0.9"/>
                        <stop offset="100%" stop-color="#CBD5E1" stop-opacity="0.2"/>
                    </linearGradient>
                    <filter id="fogGlow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#94A3B8" flood-opacity="0.2"/>
                    </filter>
                </defs>
                <rect x="10" y="24" width="60" height="6" rx="3" fill="url(#fog)" filter="url(#fogGlow)"/>
                <rect x="16" y="36" width="48" height="6" rx="3" fill="url(#fog)" filter="url(#fogGlow)"/>
                <rect x="10" y="48" width="60" height="6" rx="3" fill="url(#fog)" filter="url(#fogGlow)"/>
                <rect x="22" y="60" width="36" height="6" rx="3" fill="url(#fog)" filter="url(#fogGlow)"/>
               </svg>`,
    };

    return svgMap[id] || svgMap['03']; // fallback to cloudy
}

function updateDashboard(currentData, forecastData) {
    document.getElementById("status-message").classList.add("hidden");
    document.getElementById("weather-data").classList.remove("hidden");

    // Current Weather
    document.getElementById("city-name").innerText = `${currentData.name}, ${currentData.sys.country}`;
    
    const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("current-date").innerText = new Date(currentData.dt * 1000).toLocaleDateString('en-US', dateOpts);
    
    document.getElementById("current-temp").innerText = `${Math.round(currentData.main.temp)}°`;
    
    // Inject SVG weather icon
    const iconCode = currentData.weather[0].icon;
    const iconContainer = document.getElementById("current-icon-svg");
    if (iconContainer) iconContainer.innerHTML = getWeatherSVG(iconCode);

    // Update animated weather background
    WeatherScene.setWeather(iconCode);
    
    document.getElementById("current-desc").innerText = currentData.weather[0].description;
    
    document.getElementById("humidity").innerText = `${currentData.main.humidity}%`;
    const speedUnit = currentUnit === "metric" ? "m/s" : "mph";
    document.getElementById("wind-speed").innerText = `${currentData.wind.speed} ${speedUnit}`;
    document.getElementById("feels-like").innerText = `${Math.round(currentData.main.feels_like)}°`;
    document.getElementById("visibility").innerText = `${(currentData.visibility / 1000).toFixed(1)} km`;

    // Pressure
    const pressureEl = document.getElementById("pressure");
    if (pressureEl) pressureEl.innerText = `${currentData.main.pressure} hPa`;

    // Sunrise / Sunset
    const sunEl = document.getElementById("sun-times");
    if (sunEl && currentData.sys) {
        const fmt = ts => new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sunEl.innerText = `${fmt(currentData.sys.sunrise)} / ${fmt(currentData.sys.sunset)}`;
    }

    // Chart
    const next24h = forecastData.list.slice(0, 8);
    const labels = next24h.map(item => new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const temps = next24h.map(item => item.main.temp);
    renderChart(labels, temps);

    // 5-Day Forecast
    const dailyData = extractDailyForecast(forecastData.list);
    renderForecast(dailyData);
}

function extractDailyForecast(list) {
    // Group 3-hour intervals by calendar date, compute daily min/max
    const dayMap = {};
    for (const item of list) {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        if (!dayMap[dayKey]) {
            dayMap[dayKey] = { entries: [], date: date };
        }
        dayMap[dayKey].entries.push(item);
    }

    return Object.values(dayMap).slice(0, 5).map(day => {
        const temps = day.entries.map(e => e.main.temp);
        const humidities = day.entries.map(e => e.main.humidity);
        // Most frequent weather condition for the day
        const condMap = {};
        day.entries.forEach(e => {
            const key = e.weather[0].main;
            condMap[key] = (condMap[key] || 0) + 1;
        });
        const topCond = Object.entries(condMap).sort((a, b) => b[1] - a[1])[0][0];
        const rep = day.entries.find(e => e.weather[0].main === topCond) || day.entries[0];

        return {
            date: day.date,
            tempMin: Math.round(Math.min(...temps)),
            tempMax: Math.round(Math.max(...temps)),
            humidity: Math.round(humidities.reduce((a, b) => a + b) / humidities.length),
            weather: rep.weather[0],
            icon: rep.weather[0].icon,
        };
    });
}

function renderForecast(dailyData) {
    const container = document.getElementById("forecast-list");
    container.innerHTML = "";

    // Overall temp range for proportional bar scaling
    const allMin = Math.min(...dailyData.map(d => d.tempMin));
    const allMax = Math.max(...dailyData.map(d => d.tempMax));
    const range = allMax - allMin || 1;

    dailyData.forEach(day => {
        const dayName = day.date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const desc = day.weather.description;
        const lowPct = ((day.tempMin - allMin) / range) * 100;
        const highPct = ((day.tempMax - allMin) / range) * 100;

        const div = document.createElement("div");
        div.className = "forecast-item";
        div.innerHTML = `
            <div class="fc-header">
                <span class="fc-day">${dayName}</span>
                <span class="fc-date">${dateStr}</span>
            </div>
            <div class="fc-icon-wrap">${getWeatherSVG(day.icon)}</div>
            <span class="fc-desc">${desc}</span>
            <div class="fc-temps">
                <span class="fc-temp-low">${day.tempMin}°</span>
                <div class="fc-temp-bar">
                    <div class="fc-temp-fill" style="left:${lowPct}%;right:${100 - highPct}%"></div>
                </div>
                <span class="fc-temp-high">${day.tempMax}°</span>
            </div>
            <span class="fc-humidity">💧 ${day.humidity}%</span>
        `;
        container.appendChild(div);
    });
}

function renderChart(labels, data) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    if (tempChartInstance) tempChartInstance.destroy();
    const unitLabel = currentUnit === 'metric' ? '°C' : '°F';
    tempChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temp (${unitLabel})`,
                data: data,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.12)',
                borderWidth: 2.5,
                tension: 0.45,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#0ea5e9',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0B132B',
                    titleColor: '#A0AAB2',
                    bodyColor: '#fff',
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        title: (items) => items[0].label,
                        label: (item) => `${Math.round(item.parsed.y)}${unitLabel}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 11 }, color: '#888' }
                },
                y: {
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    ticks: {
                        font: { family: 'Inter', size: 11 },
                        color: '#888',
                        callback: (v) => `${Math.round(v)}${unitLabel}`
                    }
                }
            }
        }
    });
}

function showLoading() {
    document.getElementById("weather-data").classList.add("hidden");
    const msg = document.getElementById("status-message");
    msg.classList.remove("hidden");
    msg.innerText = "Fetching weather data...";
}

function showError(message) {
    document.getElementById("weather-data").classList.add("hidden");
    const msg = document.getElementById("status-message");
    msg.classList.remove("hidden");
    msg.innerText = message;
}

// History & Favorites
function addToHistory(city) {
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());
    searchHistory.unshift(city);
    if (searchHistory.length > 5) searchHistory.pop();
    localStorage.setItem('skyroute_history', JSON.stringify(searchHistory));
    updateHistoryUI();
}

function updateHistoryUI() {
    const list = document.getElementById("search-history");
    list.innerHTML = "";
    searchHistory.forEach(city => {
        const li = document.createElement("li");
        li.innerText = city;
        li.addEventListener("click", () => {
            document.getElementById("city-input").value = city;
            handleSearch(city);
            // Switch to dashboard view
            document.querySelector('[data-target="dashboard"]').click();
        });
        list.appendChild(li);
    });
}

function checkFavoriteStatus() {
    const favBtn = document.getElementById("fav-btn");
    const isFav = favorites.includes(currentCity);
    // Update SVG star fill to indicate saved status
    const starSvg = favBtn.querySelector('svg');
    if (starSvg) {
        starSvg.setAttribute('fill', isFav ? '#FFD700' : 'none');
        starSvg.setAttribute('stroke', isFav ? '#FFD700' : 'currentColor');
    }
}

function toggleFavorite() {
    if(!currentCity) return;
    if(favorites.includes(currentCity)){
        favorites = favorites.filter(c => c !== currentCity);
    } else {
        favorites.push(currentCity);
    }
    localStorage.setItem('skyroute_favorites', JSON.stringify(favorites));
    checkFavoriteStatus();
    updateFavoritesUI();
}

function updateFavoritesUI() {
    const container = document.getElementById("favorites-list");
    const emptyMsg = document.getElementById("favorites-empty");
    container.innerHTML = "";
    
    if(favorites.length === 0){
        emptyMsg.classList.remove("hidden");
    } else {
        emptyMsg.classList.add("hidden");
        favorites.forEach(city => {
            const div = document.createElement("div");
            div.className = "favorite-item";
            div.innerHTML = `
                <span class="city-name">${city}</span>
                <button class="del-btn" title="Remove">✕</button>
            `;
            div.querySelector('.city-name').addEventListener('click', () => {
                document.getElementById("city-input").value = city;
                handleSearch(city);
                document.querySelector('[data-target="dashboard"]').click();
            });
            div.querySelector('.del-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                favorites = favorites.filter(c => c !== city);
                localStorage.setItem('skyroute_favorites', JSON.stringify(favorites));
                updateFavoritesUI();
                checkFavoriteStatus();
            });
            container.appendChild(div);
        });
    }
}

// Planner & Packing List
async function handlePlannerSubmit(e) {
    e.preventDefault();
    const dest = document.getElementById("plan-dest").value;
    const start = document.getElementById("plan-start").value;
    const end = document.getElementById("plan-end").value;
    const activity = document.getElementById("plan-activity").value;

    if(!dest || !start || !end) return;

    document.getElementById("plan-status").innerText = "Analyzing forecast...";
    document.getElementById("plan-status").classList.remove("hidden");
    document.getElementById("plan-results").classList.add("hidden");

    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(dest)}&appid=${apiKey}&units=${currentUnit}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (res.status !== 200) throw new Error(data.message);

        document.getElementById("plan-status").classList.add("hidden");
        document.getElementById("plan-results").classList.remove("hidden");
        
        document.getElementById("plan-dest-display").innerText = data.city.name;
        
        // Check if start date is within 5 days
        const startDate = new Date(start);
        const today = new Date();
        const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
        
        let avgTemp = data.list[0].main.temp;
        let isRainy = data.list.some(item => item.weather[0].main.includes("Rain"));
        let isCold = avgTemp < 10;
        let isHot = avgTemp > 25;
        
        if (diffDays > 5) {
            document.getElementById("plan-weather-summary").innerText = 
                `Your trip is in ${diffDays} days, which is beyond our 5-day precise forecast range. However, based on the current trends in ${data.city.name}, expect general weather patterns. We recommend checking back closer to the date for accurate forecasts.`;
            // Fallback packing suggestions based on current temp
        } else {
            document.getElementById("plan-weather-summary").innerText = 
                `In ${data.city.name}, the forecast leading up to your trip averages ${Math.round(avgTemp)}°. ${isRainy ? "Expect some rain." : "Looks mostly clear/cloudy without much rain."}`;
        }
        
        generatePackingList(isRainy, isCold, isHot, activity);

    } catch(err) {
        document.getElementById("plan-status").innerText = "Could not fetch destination data. " + err.message;
        document.getElementById("plan-status").classList.remove("hidden");
        document.getElementById("plan-results").classList.add("hidden");
    }
}

function generatePackingList(isRainy, isCold, isHot, activity) {
    let baseItems = [
        {name: "Passport / ID", checked: false},
        {name: "Phone Charger", checked: false},
        {name: "Toothbrush & Toiletries", checked: false}
    ];

    if (isRainy) {
        baseItems.push({name: "Umbrella", checked: false});
        baseItems.push({name: "Raincoat", checked: false});
    }
    if (isCold) {
        baseItems.push({name: "Warm Jacket", checked: false});
        baseItems.push({name: "Gloves & Beanie", checked: false});
    }
    if (isHot) {
        baseItems.push({name: "Sunscreen", checked: false});
        baseItems.push({name: "Sunglasses", checked: false});
    }

    if (activity === "sightseeing") {
        baseItems.push({name: "Comfortable Walking Shoes", checked: false});
        baseItems.push({name: "Camera / Power Bank", checked: false});
    } else if (activity === "hiking") {
        baseItems.push({name: "Hiking Boots", checked: false});
        baseItems.push({name: "Water Bottle", checked: false});
        baseItems.push({name: "First Aid Kit", checked: false});
    } else if (activity === "beach") {
        baseItems.push({name: "Swimwear", checked: false});
        baseItems.push({name: "Beach Towel", checked: false});
    } else if (activity === "business") {
        baseItems.push({name: "Business Attire", checked: false});
        baseItems.push({name: "Laptop & Charger", checked: false});
    }

    packingList = baseItems;
    savePackingList();
    renderPackingList();
}

function renderPackingList() {
    const list = document.getElementById("packing-list");
    list.innerHTML = "";
    packingList.forEach((item, index) => {
        const li = document.createElement("li");
        if(item.checked) li.className = "checked";
        
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = item.checked;
        cb.onchange = () => {
            packingList[index].checked = cb.checked;
            savePackingList();
            renderPackingList();
        };

        const span = document.createElement("span");
        span.innerText = item.name;
        span.style.flexGrow = "1";

        const delBtn = document.createElement("button");
        delBtn.innerText = "✕";
        delBtn.className = "icon-btn btn-sm";
        delBtn.style.color = "red";
        delBtn.style.marginLeft = "auto";
        delBtn.onclick = () => {
            packingList.splice(index, 1);
            savePackingList();
            renderPackingList();
        };

        li.appendChild(cb);
        li.appendChild(span);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

function savePackingList() {
    localStorage.setItem('skyroute_packing', JSON.stringify(packingList));
}

function resetChecklist() {
    packingList = [];
    savePackingList();
    renderPackingList();
}

function addCustomPackingItem() {
    const input = document.getElementById("custom-item");
    const val = input.value.trim();
    if(val) {
        packingList.push({name: val, checked: false});
        savePackingList();
        renderPackingList();
        input.value = "";
    }
}

// Compare Cities
async function handleCompare() {
    const c1 = document.getElementById("compare-city-1").value.trim();
    const c2 = document.getElementById("compare-city-2").value.trim();
    const c3 = document.getElementById("compare-city-3").value.trim();
    
    const errObj = document.getElementById("compare-error");
    errObj.innerText = "";
    
    const cities = [c1, c2, c3].filter(Boolean);
    if(cities.length < 2) {
        errObj.innerText = "Please enter at least two cities to compare.";
        return;
    }

    const resultsContainer = document.getElementById("compare-results");
    resultsContainer.innerHTML = "Loading...";
    resultsContainer.classList.remove("hidden");

    let html = "";
    for(const city of cities) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${currentUnit}`;
            const res = await fetch(url);
            if(!res.ok) throw new Error("Not found");
            const data = await res.json();
            
            const speedUnitC = currentUnit === 'metric' ? 'm/s' : 'mph';
            html += `
                <div class="card compare-card">
                    <div class="cc-icon">${getWeatherSVG(data.weather[0].icon)}</div>
                    <p class="cc-name">${data.name}, ${data.sys.country}</p>
                    <p class="cc-temp">${Math.round(data.main.temp)}&deg;${currentUnit === 'metric' ? 'C' : 'F'}</p>
                    <p class="cc-desc">${data.weather[0].description}</p>
                    <div class="cc-details">
                        <div class="cc-detail">
                            <span>Feels like</span>
                            <strong>${Math.round(data.main.feels_like)}&deg;</strong>
                        </div>
                        <div class="cc-detail">
                            <span>Humidity</span>
                            <strong>${data.main.humidity}%</strong>
                        </div>
                        <div class="cc-detail">
                            <span>Wind</span>
                            <strong>${data.wind.speed} ${speedUnitC}</strong>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            html += `
                <div class="card compare-card">
                    <p class="cc-name">${city}</p>
                    <p class="cc-error">City not found or unavailable.</p>
                </div>
            `;
        }
    }
    resultsContainer.innerHTML = html;
}

// Map - Leaflet setup
function initMap() {
    mapInstance = L.map('map-container').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);
}

async function geocodeAndMap(cityName) {
    if(!mapInstance) return;
    try {
        // OpenWeatherMap API returns coords in weather request
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}`;
        const res = await fetch(url);
        if(!res.ok) return;
        const data = await res.json();
        const lat = data.coord.lat;
        const lon = data.coord.lon;
        
        mapInstance.setView([lat, lon], 10);
        if(mapMarker) mapInstance.removeLayer(mapMarker);
        mapMarker = L.marker([lat, lon]).addTo(mapInstance)
            .bindPopup(`<b>${data.name}</b>`).openPopup();
    } catch(e) {
        console.error("Geocoding failed", e);
    }
}