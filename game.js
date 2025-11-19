// Airport Manager Game - Tycoon Style

const GRID_SIZE = 40;
const BUILDING_TYPES = {
    EMPTY: 'empty',
    TERMINAL: 'terminal',
    RUNWAY: 'runway',
    HANGAR: 'hangar',
    FUEL_STATION: 'fuel_station',
    MAINTENANCE: 'maintenance',
    CARGO: 'cargo',
    RESTAURANT: 'restaurant'
};

const BUILDINGS = {
    terminal: {
        name: 'Terminal',
        cost: 1000,
        income: 50,
        passengersPerPlane: 100,
        description: 'Handles passenger boarding and arrivals',
        color: '#FF6B6B',
        size: 3
    },
    runway: {
        name: 'Runway',
        cost: 2000,
        income: 100,
        planesPerHour: 120,  // 2 planes per minute (120 per hour)
        description: 'Allows planes to land and take off',
        color: '#4ECDC4',
        size: 2,
        width: 5,  // Runway is 5 cells wide
        height: 2  // Runway is 2 cells tall
    },
    hangar: {
        name: 'Hangar',
        cost: 3000,
        income: 75,
        passengersPerPlane: 50,
        description: 'Stores and maintains aircraft',
        color: '#FFD93D',
        size: 3
    },
    fuel_station: {
        name: 'Fuel Station',
        cost: 1500,
        income: 40,
        planesPerHour: 60,  // Adds 1 plane per minute
        description: 'Increases plane capacity',
        color: '#6BCB77',
        size: 2
    },
    maintenance: {
        name: 'Maintenance',
        cost: 2500,
        income: 60,
        description: 'Improves aircraft efficiency',
        color: '#A29BFE',
        size: 3
    },
    cargo: {
        name: 'Cargo Hub',
        cost: 2000,
        income: 80,
        description: 'Handles cargo operations',
        color: '#FD79A8',
        size: 2
    },
    restaurant: {
        name: 'Restaurant',
        cost: 800,
        income: 30,
        description: 'Generates revenue from dining',
        color: '#FDCB6E',
        size: 2
    }
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game state
        this.money = 5000;
        this.grid = [];
        this.buildings = [];
        this.selectedBuilding = null;
        this.totalIncome = 0;
        this.totalPassengers = 0;
        this.planesPerHour = 0;
        this.gameTime = 0;
        this.gameSpeed = 4;  // 4x speed by default
        this.gameDays = 1;
        this.gameHours = 0;
        this.gameMinutes = 0;

        // Animation state
        this.planes = [];
        this.particles = [];
        this.animationTime = 0;
        this.planeCounter = 0;

        // Disaster state
        this.currentDisaster = null;
        this.disasterTimer = 0;
        this.nextDisasterTime = this.getRandomDisasterTime();

        // Initialize grid
        this.initializeGrid();

        // Event listeners
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));

        // Game loop
        this.lastFrameTime = Date.now();
        this.gameLoop();

        // Render UI
        this.renderUI();

        // Update stats every 100ms
        setInterval(() => this.updateStats(), 100);

        // Update clock display every 500ms
        setInterval(() => this.updateClock(), 500);
    }

    resizeCanvas() {
        const gameArea = document.querySelector('.game-area');
        this.canvas.width = gameArea.clientWidth;
        this.canvas.height = gameArea.clientHeight;
    }

    initializeGrid() {
        const cols = Math.ceil(this.canvas.width / GRID_SIZE);
        const rows = Math.ceil(this.canvas.height / GRID_SIZE);
        this.grid = Array(rows).fill(null).map(() => Array(cols).fill(BUILDING_TYPES.EMPTY));

        this.gridCols = cols;
        this.gridRows = rows;
    }

    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const col = Math.floor(x / GRID_SIZE);
        const row = Math.floor(y / GRID_SIZE);

        if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridCols) {
            if (this.selectedBuilding) {
                this.attemptBuild(row, col);
            }
        }
    }

    handleRightClick(event) {
        event.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const col = Math.floor(x / GRID_SIZE);
        const row = Math.floor(y / GRID_SIZE);

        if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridCols) {
            const buildingType = this.grid[row][col];
            if (buildingType !== BUILDING_TYPES.EMPTY) {
                this.attemptUpgrade(row, col);
            }
        }
    }

    attemptBuild(row, col) {
        const buildingType = this.selectedBuilding;
        const buildingData = BUILDINGS[buildingType];
        const width = buildingData.width || buildingData.size || 1;
        const height = buildingData.height || buildingData.size || 1;

        // Check if enough money
        if (this.money < buildingData.cost) {
            this.showMessage('Not enough money!', true);
            return;
        }

        // Check if space is available
        for (let r = row; r < row + height && r < this.gridRows; r++) {
            for (let c = col; c < col + width && c < this.gridCols; c++) {
                if (this.grid[r][c] !== BUILDING_TYPES.EMPTY) {
                    this.showMessage('Space not available!', true);
                    return;
                }
            }
        }

        // Build the structure
        for (let r = row; r < row + height && r < this.gridRows; r++) {
            for (let c = col; c < col + width && c < this.gridCols; c++) {
                this.grid[r][c] = buildingType;
            }
        }

        // Deduct money
        this.money -= buildingData.cost;

        // Store building info
        this.buildings.push({
            type: buildingType,
            row: row,
            col: col,
            level: 1,
            createdAt: Date.now(),
            width: width,
            height: height
        });

        // Recalculate income
        this.recalculateIncome();
        this.showMessage(`Built ${buildingData.name}!`);
    }

    attemptUpgrade(row, col) {
        const building = this.buildings.find(b => b.row === row && b.col === col);
        if (!building) return;

        const buildingData = BUILDINGS[building.type];
        const upgradeCost = Math.floor(buildingData.cost * (0.5 * building.level));

        if (this.money < upgradeCost) {
            this.showMessage('Not enough money to upgrade!', true);
            return;
        }

        this.money -= upgradeCost;
        building.level += 1;

        this.recalculateIncome();
        this.showMessage(`Upgraded ${buildingData.name} to Level ${building.level}!`);
    }

    getRandomDisasterTime() {
        // Random disaster every 2-10 minutes (in-game)
        return 120 + Math.random() * 480; // in seconds at 1x speed
    }

    checkForDisasters(scaledDeltaTime) {
        if (this.currentDisaster) {
            // Disaster is already active, do nothing
            return;
        }

        this.disasterTimer += scaledDeltaTime;

        if (this.disasterTimer >= this.nextDisasterTime) {
            this.triggerDisaster();
            this.disasterTimer = 0;
            this.nextDisasterTime = this.getRandomDisasterTime();
        }
    }

    triggerDisaster() {
        const disasters = [
            {
                name: '⚡ Lightning Strike',
                description: 'A lightning strike damaged a building!',
                cost: 2000,
                icon: '⚡'
            },
            {
                name: '🌪️ Storm Incoming',
                description: 'Heavy storms force runway closures!',
                cost: 1500,
                icon: '🌪️'
            },
            {
                name: '🔧 Equipment Failure',
                description: 'Critical equipment malfunction!',
                cost: 3000,
                icon: '🔧'
            },
            {
                name: '💼 Staff Strike',
                description: 'Workers demand better conditions!',
                cost: 2500,
                icon: '💼'
            },
            {
                name: '✈️ Runway Damage',
                description: 'Runway cracked and needs repairs!',
                cost: 4000,
                icon: '✈️'
            },
            {
                name: '🚨 Security Breach',
                description: 'Security system upgrade required!',
                cost: 1800,
                icon: '🚨'
            }
        ];

        this.currentDisaster = disasters[Math.floor(Math.random() * disasters.length)];

        // Check if player has enough money
        if (this.money >= this.currentDisaster.cost) {
            this.money -= this.currentDisaster.cost;
            this.showDisasterAlert(true);
        } else {
            this.showDisasterAlert(false);
            // Game Over condition
            this.handleGameOver();
        }
    }

    showDisasterAlert(hadMoney) {
        const disaster = this.currentDisaster;

        if (hadMoney) {
            this.showMessage(`${disaster.icon} ${disaster.name}: Paid $${disaster.cost} to resolve!`, false);
        } else {
            this.showMessage(`${disaster.icon} ${disaster.name}: Not enough money! GAME OVER!`, true);
        }

        // Clear disaster after 3 seconds
        setTimeout(() => {
            this.currentDisaster = null;
        }, 3000);
    }

    handleGameOver() {
        this.gameSpeed = 0;
        this.showMessage('💀 BANKRUPTCY! Game Over! Your airport is closed.', true);
    }

    recalculateIncome() {
        this.totalIncome = 0;
        this.planesPerHour = 0;

        for (const building of this.buildings) {
            const data = BUILDINGS[building.type];
            const levelMultiplier = 1 + (building.level - 1) * 0.3;

            if (data.income) {
                this.totalIncome += Math.floor(data.income * levelMultiplier);
            }
            if (data.planesPerHour) {
                this.planesPerHour += data.planesPerHour * levelMultiplier;
            }
        }
    }

    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // in seconds
        this.lastFrameTime = currentTime;

        // Apply game speed multiplier
        const scaledDeltaTime = deltaTime * this.gameSpeed;

        // Add income over time
        const incomeThisFrame = (this.totalIncome * scaledDeltaTime) / 10; // Scale down income
        this.money += incomeThisFrame;

        // Update game time (60 seconds = 1 hour in-game at 1x speed)
        this.gameTime += scaledDeltaTime;
        this.gameMinutes += scaledDeltaTime * 60;

        if (this.gameMinutes >= 60) {
            this.gameHours += Math.floor(this.gameMinutes / 60);
            this.gameMinutes = this.gameMinutes % 60;

            if (this.gameHours >= 24) {
                this.gameDays += Math.floor(this.gameHours / 24);
                this.gameHours = this.gameHours % 24;
            }
        }

        // Update animation
        this.animationTime += deltaTime;

        // Check for disasters
        this.checkForDisasters(scaledDeltaTime);

        // Spawn planes based on runway count
        const runwayCount = this.buildings.filter(b => b.type === 'runway').length;

        if (runwayCount > 0) {
            // planesPerHour is the number of planes per hour
            // Divide by 3600 to get planes per second
            const planesPerSecond = this.planesPerHour / 3600;
            this.planeCounter += scaledDeltaTime * planesPerSecond;

            while (this.planeCounter >= 1) {
                this.spawnPlane();
                this.planeCounter -= 1;
            }
        }

        // Update and remove planes
        this.updatePlanes(scaledDeltaTime);
        this.updateParticles(deltaTime);

        // Render game
        this.render();

        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    spawnPlane() {
        const runwayBuildings = this.buildings.filter(b => b.type === 'runway');
        if (runwayBuildings.length === 0) return;

        const runway = runwayBuildings[Math.floor(Math.random() * runwayBuildings.length)];
        const runwayStartX = runway.col * GRID_SIZE;
        const runwayEndX = (runway.col + (runway.width || 5)) * GRID_SIZE;
        const runwayCenterY = (runway.row + (runway.height || 2) / 2) * GRID_SIZE;

        // Random position along runway for landing
        const landingX = runwayStartX + Math.random() * (runwayEndX - runwayStartX);

        const coming = Math.random() > 0.5;

        // For incoming planes: start far left above runway, fly to runway center
        // For departing planes: start at runway, fly far right above runway
        const plane = {
            x: coming ? -80 : landingX,
            y: coming ? runwayCenterY - 80 : runwayCenterY,
            targetX: coming ? landingX : this.canvas.width + 80,
            targetY: coming ? runwayCenterY : runwayCenterY - 80,
            speed: 150 + Math.random() * 50, // pixels per second
            coming: coming,
            runway: runway,
            landed: false,
            landingTime: 0,
            landed_x: landingX
        };

        this.planes.push(plane);
    }

    updatePlanes(deltaTime) {
        this.planes = this.planes.filter(plane => {
            if (plane.landed) {
                plane.landingTime += deltaTime;
                if (plane.landingTime > 2) {
                    // Plane takes off after 2 seconds on ground
                    this.createParticles(plane.landed_x, plane.runway.row * GRID_SIZE + (plane.runway.height || 2) * GRID_SIZE / 2, 'takeoff');
                    return false;
                }
            } else {
                // Move plane
                const dx = plane.targetX - plane.x;
                const dy = plane.targetY - plane.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 10) {
                    const moveX = (dx / distance) * plane.speed * deltaTime;
                    const moveY = (dy / distance) * plane.speed * deltaTime;

                    plane.x += moveX;
                    plane.y += moveY;
                } else {
                    // Plane reached destination
                    if (plane.coming) {
                        plane.landed = true;
                        plane.x = plane.landed_x;
                        plane.y = plane.runway.row * GRID_SIZE + (plane.runway.height || 2) * GRID_SIZE / 2;
                        this.createParticles(plane.x, plane.y, 'landing');

                        // Check if we have a terminal to handle passengers
                        const terminalCount = this.buildings.filter(b => b.type === 'terminal').length;
                        if (terminalCount > 0) {
                            const passengers = Math.floor(50 + Math.random() * 100);
                            this.totalPassengers += passengers;
                            this.showMessage(`✈️ Plane landed! +${passengers} passengers`);
                        } else {
                            this.showMessage(`✈️ Plane landed (no terminal - no passengers counted)`);
                        }
                    } else {
                        // Plane taking off
                        this.createParticles(plane.x, plane.y, 'takeoff');
                        return false;
                    }
                }
            }
            return true;
        });
    }

    createParticles(x, y, type) {
        const count = type === 'landing' ? 8 : 12;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 80 + Math.random() * 120;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: type === 'landing' ? 0.8 : 1.2,
                maxLife: type === 'landing' ? 0.8 : 1.2,
                type: type,
                size: Math.random() * 3 + 2
            });
        }
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            return p.life > 0;
        });
    }

    render() {
        // Clear canvas with gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw clouds
        this.drawClouds();

        // Draw grid
        this.drawGrid();

        // Draw buildings
        this.drawBuildings();

        // Draw planes
        this.drawPlanes();

        // Draw particles
        this.drawParticles();

        // Draw overlay status
        this.drawOverlay();
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const time = this.animationTime * 10;

        for (let i = 0; i < 3; i++) {
            const x = (time + i * 200) % (this.canvas.width + 100);
            const y = 50 + i * 60;
            this.drawCloud(x, y);
        }
    }

    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPlanes() {
        for (const plane of this.planes) {
            // Calculate angle based on direction of movement
            const dx = plane.targetX - plane.x;
            const dy = plane.targetY - plane.y;
            const angle = Math.atan2(dy, dx);

            // Save context
            this.ctx.save();

            // Translate to plane position and rotate
            this.ctx.translate(plane.x, plane.y);
            this.ctx.rotate(angle);

            // Draw simple triangle plane
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.beginPath();
            this.ctx.moveTo(15, 0);           // Nose
            this.ctx.lineTo(-10, -10);        // Left wing
            this.ctx.lineTo(-5, 0);           // Left body
            this.ctx.lineTo(-10, 10);         // Right wing
            this.ctx.closePath();
            this.ctx.fill();

            // Draw outline
            this.ctx.strokeStyle = '#CC3333';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            // Draw cockpit window
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(5, 0, 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw exhaust
            this.ctx.strokeStyle = plane.coming ? 'rgba(150, 150, 150, 0.6)' : 'rgba(255, 100, 0, 0.7)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(-5, 0);
            this.ctx.lineTo(-15, 0);
            this.ctx.stroke();

            // Restore context
            this.ctx.restore();

            // Draw landing indicator if landed
            if (plane.landed) {
                const opacity = Math.max(0, 1 - plane.landingTime / 2);
                this.ctx.fillStyle = `rgba(76, 175, 80, ${opacity * 0.4})`;
                this.ctx.beginPath();
                this.ctx.arc(plane.x, plane.y, 25, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    drawParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;

            if (particle.type === 'landing') {
                this.ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.8})`;
            } else {
                this.ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.8})`;
            }

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawOverlay() {
        // Draw top-left corner status display
        const padding = 10;
        const lineHeight = 18;
        const boxWidth = 180;
        const boxHeight = 85;

        // Semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(padding, padding, boxWidth, boxHeight);

        // Border
        this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(padding, padding, boxWidth, boxHeight);

        // Title
        this.ctx.fillStyle = '#4caf50';
        this.ctx.font = 'bold 13px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('AIRPORT STATUS', padding + 8, padding + 15);

        // Divider line
        this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(padding + 5, padding + 22);
        this.ctx.lineTo(padding + boxWidth - 5, padding + 22);
        this.ctx.stroke();

        // Stats
        this.ctx.font = '11px Arial';
        this.ctx.fillStyle = '#ccc';

        const stats = [
            `💰 $${Math.floor(this.money).toLocaleString()}`,
            `✈️ Planes: ${this.planes.length}`,
            `🏢 Buildings: ${this.buildings.length}`
        ];

        stats.forEach((stat, i) => {
            this.ctx.fillText(stat, padding + 8, padding + 35 + i * lineHeight);
        });
    }

    drawGrid() {
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 0.5;

        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawBuildings() {
        const drawnBuildings = new Set();

        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const buildingType = this.grid[row][col];

                if (buildingType !== BUILDING_TYPES.EMPTY) {
                    const building = this.buildings.find(b => b.row === row && b.col === col);

                    // Skip if we've already drawn this building
                    if (building && drawnBuildings.has(building)) {
                        continue;
                    }

                    if (building) {
                        drawnBuildings.add(building);
                    }

                    const x = col * GRID_SIZE;
                    const y = row * GRID_SIZE;
                    const buildingData = BUILDINGS[buildingType];
                    const width = building ? (building.width * GRID_SIZE - 4) : (GRID_SIZE - 4);
                    const height = building ? (building.height * GRID_SIZE - 4) : (GRID_SIZE - 4);

                    // Draw building base
                    this.ctx.fillStyle = buildingData.color;
                    this.ctx.fillRect(x + 2, y + 2, width, height);

                    // Draw border
                    this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x + 2, y + 2, width, height);

                    // Draw runway stripes if it's a runway
                    if (buildingType === 'runway') {
                        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                        this.ctx.lineWidth = 2;
                        const stripeSpacing = 20;
                        for (let i = 0; i < width; i += stripeSpacing) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(x + 2 + i, y + 2 + height / 2);
                            this.ctx.lineTo(x + 2 + i + 10, y + 2 + height / 2);
                            this.ctx.stroke();
                        }
                    }

                    // Draw activity effect if generating income
                    if (building && buildingData.income > 0) {
                        const pulse = Math.sin(this.animationTime * 3) * 0.5 + 0.5;
                        this.ctx.fillStyle = `rgba(255, 255, 200, ${pulse * 0.3})`;
                        this.ctx.fillRect(x + 2, y + 2, width, height);

                        // Draw activity lights
                        const lightSize = 2;
                        this.ctx.fillStyle = `rgba(255, 255, 0, ${pulse * 0.8})`;
                        this.ctx.fillRect(x + 5, y + 5, lightSize, lightSize);
                        this.ctx.fillRect(x + width - 8, y + 5, lightSize, lightSize);
                    }

                    // Draw label and level (only for first cell of each building)
                    if (building) {
                        const name = BUILDINGS[building.type].name;
                        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                        this.ctx.font = 'bold 9px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(name, x + width / 2 + 2, y + height / 2 - 5);

                        // Draw level indicator
                        if (building.level > 1) {
                            this.ctx.fillStyle = '#FFD700';
                            this.ctx.font = 'bold 8px Arial';
                            this.ctx.fillText(`Lv${building.level}`, x + width / 2 + 2, y + height / 2 + 8);
                        }

                        // Draw income indicator
                        const incomeValue = Math.floor(buildingData.income * (1 + (building.level - 1) * 0.3));
                        this.ctx.fillStyle = '#4caf50';
                        this.ctx.font = '7px Arial';
                        this.ctx.textAlign = 'right';
                        this.ctx.fillText(`$${incomeValue}`, x + width - 3, y + height - 2);
                    }
                }
            }
        }
    }

    updateStats() {
        this.updateUI();
    }

    updateClock() {
        const timeStr = `${String(Math.floor(this.gameHours)).padStart(2, '0')}:${String(Math.floor(this.gameMinutes)).padStart(2, '0')}`;
        document.getElementById('gameTime').textContent = `Day ${this.gameDays} • ${timeStr}`;
    }

    updateUI() {
        document.getElementById('money').textContent = `$${Math.floor(this.money).toLocaleString()}`;
        document.getElementById('income').textContent = `$${Math.floor(this.totalIncome).toLocaleString()}`;
        document.getElementById('passengers').textContent = this.totalPassengers.toLocaleString();
        document.getElementById('planesPerHour').textContent = Math.floor(this.planesPerHour);
    }

    renderUI() {
        const container = document.getElementById('buildingsContainer');
        container.innerHTML = '';

        for (const [key, buildingData] of Object.entries(BUILDINGS)) {
            const card = document.createElement('div');
            card.className = 'building-card';
            if (this.selectedBuilding === key) {
                card.classList.add('selected');
            }

            const buildingsOfType = this.buildings.filter(b => b.type === key);
            const count = buildingsOfType.length;
            const avgLevel = count > 0 ? Math.round(buildingsOfType.reduce((sum, b) => sum + b.level, 0) / count) : 1;

            const canAfford = this.money >= buildingData.cost;
            const buttonClass = canAfford ? '' : 'disabled';

            const incomeWithLevel = Math.floor(buildingData.income * (1 + (avgLevel - 1) * 0.3));

            card.innerHTML = `
                <div class="building-name">${buildingData.name}</div>
                <div class="building-cost">Cost: $${buildingData.cost}</div>
                <div class="building-income">Income: $${incomeWithLevel}/sec</div>
                <div class="building-desc">${buildingData.description}</div>
                ${count > 0 ? `<div class="upgrade-info"><div class="upgrade-level">Count: ${count} | Avg Level: ${avgLevel}</div></div>` : ''}
            `;

            const button = document.createElement('button');
            button.className = `build-button ${buttonClass}`;
            button.disabled = !canAfford;
            button.textContent = this.selectedBuilding === key ? 'Selected - Click Map' : 'Select & Build';

            button.addEventListener('click', () => {
                // Allow deselection even if not affordable
                this.selectedBuilding = this.selectedBuilding === key ? null : key;
                this.renderUI();

                if (this.selectedBuilding === key) {
                    if (!canAfford) {
                        document.getElementById('infoText').textContent =
                            `Selected: ${buildingData.name}. Not enough money! ($${Math.floor(this.money)} / $${buildingData.cost})`;
                    } else {
                        document.getElementById('infoText').textContent =
                            `Selected: ${buildingData.name}. Click on the map to build. Cost: $${buildingData.cost}`;
                    }
                } else {
                    document.getElementById('infoText').textContent =
                        'Click on a building type to select it, then click on the map to build.';
                }
            });

            card.appendChild(button);
            container.appendChild(card);
        }
    }

    showMessage(text, isError = false) {
        const message = document.createElement('div');
        message.className = `message ${isError ? 'error' : ''}`;
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game
    const game = new Game();

    // Set up speed controls
    document.getElementById('pauseBtn').addEventListener('click', () => {
        game.gameSpeed = 0;
        updateSpeedButtons(0);
    });

    document.getElementById('speedBtn1x').addEventListener('click', () => {
        game.gameSpeed = 1;
        updateSpeedButtons(1);
    });

    document.getElementById('speedBtn4x').addEventListener('click', () => {
        game.gameSpeed = 4;
        updateSpeedButtons(4);
    });

    document.getElementById('speedBtn10x').addEventListener('click', () => {
        game.gameSpeed = 10;
        updateSpeedButtons(10);
    });

    function updateSpeedButtons(speed) {
        document.getElementById('pauseBtn').classList.toggle('active', speed === 0);
        document.getElementById('speedBtn1x').classList.toggle('active', speed === 1);
        document.getElementById('speedBtn4x').classList.toggle('active', speed === 4);
        document.getElementById('speedBtn10x').classList.toggle('active', speed === 10);
    }

    // Set up help modal
    const helpButton = document.getElementById('helpButton');
    const helpModal = document.getElementById('helpModal');
    const closeHelp = document.getElementById('closeHelp');

    // Open help modal
    helpButton.addEventListener('click', () => {
        helpModal.classList.add('show');
    });

    // Close help modal
    closeHelp.addEventListener('click', () => {
        helpModal.classList.remove('show');
    });

    // Close modal when clicking outside of it
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.remove('show');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpModal.classList.contains('show')) {
            helpModal.classList.remove('show');
        }
    });
});
