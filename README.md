# Endless Road

A Three.js based visual art piece simulating an endless road journey through a desert landscape.

## Overview

This project creates a 3D scene of an endless road stretching through a desert environment. It features realistic visuals including:

- A procedurally generated endless road with lane markings
- Dynamic street lamps with realistic lighting
- Stylized wireframe buildings with emissive windows
- Desert objects (cacti, rocks, dead trees)
- Day/night cycle with corresponding lighting changes
- Interactive camera controls

## Features

- **Physically Based Rendering (PBR)**: Uses MeshStandardMaterial for realistic material appearances with proper lighting
- **Dynamic Lighting**: Real-time shadows and lighting effects that change with time of day
- **Performance Optimizations**: Uses instanced meshes for repeated elements
- **Interactive Controls**: Camera movement using keyboard and mouse
- **Time Cycle**: Toggle between day and night modes
- **Responsive Design**: Adapts to different screen sizes

## Controls

- **WASD/Arrow Keys**: Move camera
- **Mouse Drag**: Look around (OrbitControls)
- **N Key**: Toggle between day and night
- **Mouse Movement**: Show/hide UI elements

## Technical Implementation

The project uses several Three.js features:
- Custom shaders for sky gradient
- Point lights and shadows
- Instanced meshes for performance
- OrbitControls for camera movement
- BufferGeometry for efficient geometry handling
- Canvas-generated textures

## Browser Support

Works in all modern browsers that support WebGL.

## Credits

Created as a Three.js art piece. Uses Three.js r128.

## License

MIT 