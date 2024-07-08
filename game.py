import pygame
import sys
import math
import random
import time

# Initialize Pygame
pygame.init()

# Set up display
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE)
pygame.display.set_caption("Dynamic Firework Stars")

# Define colors
BLACK = (0, 0, 0)

# Define star parameters
def generate_star():
    star_type = random.choice(["growing", "exploding", "unreal"])
    length = random.choices(range(5, 51), weights=[50 - i for i in range(5, 51)], k=1)[0]
    return {
        'type': star_type,
        'position': (random.randint(0, WIDTH), random.randint(0, HEIGHT)),
        'phase': random.uniform(0, 2 * math.pi),
        'color_phase': (random.uniform(0, 2 * math.pi), random.uniform(0, 2 * math.pi), random.uniform(0, 2 * math.pi)),
        'sides': random.randint(1, 13),
        'duration': random.randint(5, 15),
        'start_time': time.time(),
        'length': length,  # Weighted random length for each star
        'initial_length': length / 5,  # Start with a smaller length
        'width': random.randint(1, 3),  # Random width for the lines
        'trail': []  # Trail buffer
    }

# Initialize number of stars
num_stars = random.randint(1, 100)
stars = [generate_star() for _ in range(num_stars)]

trail_length = 30  # Length of the star trails
trail_fade_time = 5.0  # Time for trail to fade back to black

# Function to ensure color values are within the valid range
def clamp_color(value):
    return max(0, min(255, int(value)))

# Function to generate a random RGB color
def random_color():
    return (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))

# Function to generate a color for a specific position
def position_color(x, y, phase, elapsed_time):
    return (
        clamp_color(255 * (0.5 + 0.5 * math.sin(phase + x * 0.01 + elapsed_time * 0.01))),
        clamp_color(255 * (0.5 + 0.5 * math.sin(phase + y * 0.01 + elapsed_time * 0.01))),
        clamp_color(255 * (0.5 + 0.5 * math.sin(phase + (x + y) * 0.01 + elapsed_time * 0.01)))
    )

# Function to draw the stars with their respective behaviors
def draw_stars(screen, frame_count):
    current_time = time.time()
    for star in stars:
        elapsed_time = current_time - star['start_time']
        if elapsed_time > star['duration']:
            stars.remove(star)
            continue

        fade_time = 2  # Duration for fading in/out
        grow_time = star['duration'] / 2  # Half the duration to grow, half to fade
        opacity = 1.0
        if elapsed_time < fade_time:
            opacity = elapsed_time / fade_time
        elif elapsed_time > star['duration'] - fade_time:
            opacity = (star['duration'] - elapsed_time) / fade_time
        
        position = star['position']
        phase = star['phase'] + elapsed_time * 0.1  # Adding rotation
        sides = star['sides']
        width = star['width']

        length = star['initial_length'] + (star['length'] - star['initial_length']) * min(elapsed_time / grow_time, 1)
        for j in range(int(length)):
            x_offset = j if j % 2 == 0 else -j
            y_offset = j if j % 2 == 0 else -j
            for side in range(sides):
                angle = side * (2 * math.pi / sides) + phase
                x = int(position[0] + x_offset * math.cos(angle))
                y = int(position[1] + y_offset * math.sin(angle))
                line_color = position_color(x, y, phase, elapsed_time)
                pygame.draw.line(screen, line_color, (position[0], position[1]), (x, y), width)
                star['trail'].append({'position': (x, y), 'color': line_color, 'time': current_time})

        # Draw trails
        for trail in star['trail']:
            trail_age = current_time - trail['time']
            if trail_age < trail_fade_time:
                trail_opacity = max(0, 1 - (trail_age / trail_fade_time))
                trail_color = (
                    clamp_color(trail['color'][0] * trail_opacity),
                    clamp_color(trail['color'][1] * trail_opacity),
                    clamp_color(trail['color'][2] * trail_opacity)
                )
                pygame.draw.circle(screen, trail_color, trail['position'], width // 2)
            else:
                star['trail'].remove(trail)

# Initialize variables for smooth transitions
last_update_time = time.time()
target_num_stars = num_stars
transition_time = 5.0  # Time between changes in seconds

# Main loop
frame_count = 0
clock = pygame.time.Clock()

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

    screen.fill(BLACK)

    current_time = time.time()
    if current_time - last_update_time > transition_time:
        last_update_time = current_time
        target_num_stars = random.randint(1, 100)

    # Smoothly adjust the number of stars to match target_num_stars
    if len(stars) < target_num_stars:
        stars.append(generate_star())
    elif len(stars) > target_num_stars:
        stars.pop(random.randint(0, len(stars) - 1))

    draw_stars(screen, frame_count)

    frame_count += 1  # Keep frame count increment for star animations

    pygame.display.flip()
    clock.tick(60)
