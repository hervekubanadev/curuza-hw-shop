.PHONY: dev build lint typecheck test docker-build docker-up docker-down docker-logs clean

NODE_VERSION ?= 22
BUN_VERSION ?= 1.2

dev:
	bun run dev

build:
	bun run build

lint:
	bun run lint

typecheck:
	bunx tsc --noEmit

test:
	bunx vitest run --reporter=verbose

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

clean:
	rm -rf dist .output .vinxi .tanstack .nitro
