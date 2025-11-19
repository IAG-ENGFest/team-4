# Airport Manager - Web Browser Game

A Rollercoaster Tycoon-style airport management game built with HTML5 Canvas and JavaScript.

## How to Play

### Getting Started
1. Open `index.html` in your web browser
2. You start with $5,000 to build your airport
3. **Click the "? Help Menu" button** at the top of the right panel for a comprehensive tutorial
4. The help menu explains all game mechanics, controls, and strategies

### Quick Start Guide
1. **Build a Runway** ($2,000) - Planes need this to land
2. **Build a Terminal** ($1,000) - You need this to count passengers
3. Watch planes start arriving automatically!
4. **Right-click buildings** to upgrade them and increase income

### Building Facilities
1. **Select a building** from the right panel by clicking the "Select & Build" button
2. **Click on the map** to place the building
3. Each building generates income and has different costs and benefits
4. **Important:** You need a Terminal to count passengers from landing planes

### Buildings Available

- **Terminal** ($1,000) - Handles passenger boarding. Essential for starting your airport
- **Runway** ($2,000) - Allows planes to land and take off. Required for flight operations
- **Hangar** ($3,000) - Stores and maintains aircraft
- **Fuel Station** ($1,500) - Increases plane capacity and frequency
- **Maintenance** ($2,500) - Improves aircraft efficiency
- **Cargo Hub** ($2,000) - Handles cargo operations
- **Restaurant** ($800) - Generates revenue from dining services

### Upgrading Buildings
1. **Right-click** on any building to upgrade it
2. Each upgrade costs 50% of the original building cost × current level
3. Upgrades increase income by 30% per level

### Game Mechanics
- **Money** - Your current funds (starts at $5,000)
- **Income/sec** - Total income generated per second by all buildings
- **Passengers** - Total passengers that have landed (requires a Terminal building)
- **Planes/hour** - How many planes can land per hour (based on runway count)

### Passenger System
- **How to get passengers:** Build a Terminal building
- **Passenger arrival:** Each plane that lands brings 50-150 passengers (random)
- **Why you need a Terminal:** Without one, planes still land but passengers aren't counted
- **Visual feedback:** Watch for blue particles when planes land successfully
- **Passenger messages:** You'll see notifications like "Plane landed! +75 passengers"

### Strategy Tips
- Start by building multiple **Terminals** to receive passengers
- Build at least one **Runway** to enable flights
- Upgrade buildings to increase income exponentially
- Build **Support facilities** (Hangar, Fuel Station) to unlock bonuses
- Plan your airport layout efficiently - buildings have different sizes

### Tips for Success
1. Focus on building terminals early to generate steady income
2. Upgrade buildings to increase profitability faster than building new ones
3. Balance terminal capacity with runway capacity
4. Support facilities enhance your primary buildings' efficiency
5. The game has no time limit - play at your own pace!

## Visual Features

### Animated Elements
- **Planes** - Simple red triangle aircraft with cockpit windows visible approaching your runways
- **Exhaust Trails** - Gray smoke trails for incoming flights, orange flames for takeoffs
- **Long Runways** - Realistic rectangular runways (5 cells wide) with white stripe markings
- **Flight Operations** - Planes smoothly land at random positions along the runway, stay for 2 seconds, then take off
- **Particle Effects** - Blue particles burst when planes land, orange flames when they take off
- **Moving Clouds** - Continuously scrolling clouds across the sky for atmosphere
- **Building Activity** - Pulsing yellow lights on income-generating buildings show they're working
- **Landing Indicators** - Green glow appears around planes that have successfully landed
- **Status Overlay** - Real-time display of current money, active planes, and building count

### Dynamic Visuals
- **Gradient Background** - Beautiful sky gradient from day blue to light horizon
- **Rotating Aircraft** - Planes rotate to face the direction they're flying
- **Exhaust Trails** - Visual smoke trails behind moving aircraft
- **Landing Indicators** - Green glow appears when planes successfully land
- **Level Indicators** - Gold badges show building upgrade levels (Lv2, Lv3, etc.)

## Files
- `index.html` - Game interface and styling
- `game.js` - Game logic, mechanics, and all visual rendering (738 lines)
- `README.md` - This file

## Technical Details
- Built with HTML5 Canvas for rendering
- Pure JavaScript (no dependencies)
- Responsive design that adapts to window size
- Smooth 60 FPS gameplay with delta-time based animation
- Advanced particle system for visual effects
- Realistic plane pathfinding and movement
- Performance optimized with proper object pooling

## How It Works

The game spawns planes based on your runway count:
- **Each runway** can handle ~2-4 flights per hour (depending on upgrades)
- Planes automatically fly from off-screen, land at your runways, and depart
- Each landing brings passengers to your terminal
- Income is continuously calculated from all active buildings
- Upgrade buildings to increase their efficiency and income

Enjoy building your airport empire! 🛫


