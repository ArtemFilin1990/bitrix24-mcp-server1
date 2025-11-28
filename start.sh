#!/bin/sh
# Entrypoint: prefer built dist if present, else fallback to server.js

if [ -f "dist/server.js" ]; then
  exec node dist/server.js "$@"
elif [ -f "dist/index.js" ]; then
  exec node dist/index.js "$@"
else
  exec node server.js "$@"
fi
