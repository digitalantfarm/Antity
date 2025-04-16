# System Patterns: Antity

## System Architecture

Antity employs a multi-layered architecture that separates rendering, logic, and state management:

```mermaid
flowchart TD
    World["World (Main Thread)"]
    Worker["Worker Thread"]
    PIXI["PIXI.js Renderer"]
    
    User -->|"Click"| World
    World -->|"postMessage()"| Worker
    Worker -->|"postMessage()"| World
    World -->|"Render Updates"| PIXI
    PIXI -->|"Display"| Canvas["Canvas (DOM)"]
```

### Key Components
1. **Main Thread (World)**: Handles rendering and DOM interaction
2. **Worker Thread**: Contains entity logic and lifecycle management
3. **Rendering Engine**: Uses PIXI.js for sprite-based rendering

## Design Patterns

### 1. Actor Model
Entities operate as independent actors with encapsulated state:
- Each Antity instance has its own lifecycle, state, and behavior
- Communication happens through message passing between actors

### 2. Web Worker Parallelism
- Each entity runs in its own worker thread
- Isolates computation from the rendering thread
- Uses message passing for communication
- Improves performance by offloading entity logic

### 3. Component-Based Entity System
```mermaid
flowchart TD
    World["World"]
    Antity["Antity"]
    Byproduct["Byproduct"]
    Sprite["PIXI Sprite"]
    
    World -->|"contains"| Antity
    World -->|"contains"| Byproduct
    Antity -->|"generates"| Byproduct
    Byproduct -->|"can hatch into"| Antity
    Antity -->|"represented by"| Sprite
    Byproduct -->|"represented by"| Sprite
```

Entities are composed of:
- Unique identifier (UUID)
- Position data (offset)
- Lifecycle state (alive/dead)
- Visual representation (sprite)
- Behavior patterns

### 4. Observer Pattern
- World object observes worker messages
- Listeners respond to specific message types
- Decouples entity logic from rendering

### 5. Factory Pattern
- World creates entities through a factory method (`startWorker`)
- Entities can spawn other entities (through fertile byproducts)

## Implementation Paths

### Entity Lifecycle
```mermaid
flowchart LR
    Creation["Creation"]-->Movement["Movement"]
    Movement-->Byproduct["Byproduct Generation"]
    Byproduct-->Death["Death"]
    Byproduct-->|"if fertile"|Hatching["Hatching"]
    Hatching-->NewEntity["New Entity"]
```

1. **Creation**: Entity instantiated by click or hatching
2. **Movement**: Random direction changes based on probability
3. **Byproduct Generation**: Chance-based creation of byproducts
4. **Reproduction**: Fertile byproducts incubate and hatch
5. **Death**: After lifespan expires

### Communication Flow
```mermaid
sequenceDiagram
    User->>World: Click Event
    World->>Worker: Create Entity Message
    Worker->>Antity: Instantiate
    Antity->>Worker: Lifecycle Updates
    Worker->>World: State Updates
    World->>PIXI: Render Updates
    PIXI->>Browser: Display Updates
```

## Technical Constraints
1. **Worker Messaging Overhead**: Message passing has performance implications with many entities
2. **Synchronization Challenges**: Maintaining consistency between logic and rendering threads
3. **Rendering Performance**: PIXI ParticleContainer optimization for many sprites
4. **Browser Compatibility**: Web Worker and Canvas API dependencies

## Key Technical Decisions
1. Use of Web Workers for parallelization
2. PIXI.js as rendering engine for performance
3. UUID-based entity tracking
4. Probability-based behavior system
5. Sprite-based visual representation
