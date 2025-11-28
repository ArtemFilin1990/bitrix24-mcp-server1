.PHONY: up down build lint test docker-build release clean help

# Default target
help:
	@echo "Available targets:"
	@echo "  up           - Start the application locally"
	@echo "  down         - Stop the application"
	@echo "  build        - Build the project"
	@echo "  lint         - Run linter"
	@echo "  test         - Run tests"
	@echo "  docker-build - Build Docker image"
	@echo "  release      - Create a release build"
	@echo "  clean        - Remove build artifacts"

up:
	npm start

down:
	@echo "Stopping application..."
	@pkill -f "node.*server\.js$$" 2>/dev/null || true

build:
	npm run build

lint:
	npm run lint --if-present

test:
	npm test --if-present

docker-build:
	docker build -t bitrix24-mcp-server .

release: clean build
	@echo "Release build complete"

clean:
	rm -rf build dist coverage .nyc_output
