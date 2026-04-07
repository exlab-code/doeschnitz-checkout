#!/bin/sh
# Seed volumes with baked-in data on first deploy (when volumes are empty)

# Seed content if volume is empty
if [ -z "$(ls -A /app/content 2>/dev/null)" ]; then
  echo "Seeding content from image..."
  cp -r /app/content-seed/* /app/content/
fi

# Seed media if volume is empty
if [ -z "$(ls -A /app/public/media 2>/dev/null)" ]; then
  echo "Seeding media from image..."
  cp -r /app/media-seed/* /app/public/media/ 2>/dev/null || true
fi

exec node server.js
