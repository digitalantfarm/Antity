# Active Context: Antity

## Current Work Focus
The project is currently in its initial implementation phase, focusing on:

1. **Core Movement & Behavior Systems**: The fundamental mechanics for entity movement, byproduct generation, and reproduction are implemented with randomness-based behaviors.

2. **Visual Representation**: Basic sprite rendering with PIXI.js is in place, with simple animations for movement and state changes.

3. **Life Cycle Management**: Entities have a defined lifespan, can create byproducts that sometimes become fertile, and the system maintains population through self-resurrection when needed.

## Recent Changes
As this is the initial documentation of the project, no recent changes are tracked yet. The code represents the first implementation of the Antity concept with:

- Entities that move with random direction changes
- Byproduct generation with random fertility
- Basic life cycle with birth, movement, and death
- Simple click-to-spawn interaction

## Next Steps
Immediate priorities for project development include:

1. **AI Development**: Begin implementing more sophisticated behaviors beyond simple randomness.
   
2. **Visual Enhancements**: Improve the visual representation with more sophisticated animations and effects.

3. **Optimization**: Address potential performance issues with many entities by implementing better worker management and rendering optimizations.

4. **Interaction Expansion**: Add more ways for users to interact with and influence the system.

5. **Documentation**: Continue to document the system architecture and behaviors to facilitate future enhancements.

## Active Decisions & Considerations

### Technical Decisions
1. **Web Worker Usage**: The decision to use web workers for entity logic provides good separation of concerns but creates overhead for message passing.

2. **Sprite-Based Rendering**: Using PIXI.js sprites provides efficient rendering but limits the visual complexity that could be achieved with custom WebGL shaders.

3. **Probability-Based Behavior**: The current implementation relies on random number generation for behavior decisions, which is simple but limits complexity.

### User Experience Decisions
1. **Minimalist Interface**: The current design focuses on the visual experience with minimal UI elements, allowing the entities to be the focus.

2. **Click Interaction**: Simple click-to-spawn is the primary interaction method, keeping the experience accessible but potentially limiting engagement depth.

## Important Patterns & Preferences

### Code Organization
- Class-based entity definitions
- Separation of rendering and logic
- Message-based communication between threads

### Naming Conventions
- CamelCase for class names (Antity, Byproduct)
- camelCase for variables and methods
- Descriptive action names in messages (createAntity, moveAntity, etc.)

### Architectural Preferences
- Decoupled components communicating through messages
- Central World object as the coordinator
- Entity autonomy with independent worker threads

## Learnings & Project Insights
The project demonstrates how complex, organic-feeling behaviors can emerge from simple rules and randomness. Key insights include:

1. **Emergent Complexity**: Even with simple probability-based behaviors, interesting patterns emerge from the system as a whole.

2. **Performance Considerations**: Web workers provide good separation but create overhead that needs to be managed for larger populations.

3. **Visual Simplicity**: The minimal visual design allows the movement patterns to be the focus, creating an aesthetic that is both abstract and seemingly organic.
