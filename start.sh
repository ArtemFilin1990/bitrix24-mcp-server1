#!/bin/sh
# Entrypoint: prefer built dist if present, else fallback to server.js
# Note: In the container, TypeScript build output is copied to dist/

if [ -f "dist/index.js" ]; then
  exec node dist/index.js "$@"
elif [ -f "dist/server.js" ]; then
  exec node dist/server.js "$@"
else
  exec node server.js "$@"
fi
