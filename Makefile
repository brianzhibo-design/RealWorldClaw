.PHONY: dev test lint validate docker-up docker-down

dev:
	@echo "Starting backend..."
	cd platform && uvicorn api.main:app --reload &
	@echo "Starting frontend..."
	cd frontend && npm run dev

test:
	cd platform && pytest
	cd frontend && npm test

lint:
	cd platform && ruff check .
	cd frontend && npm run lint

validate:
	python3 tools/manifest-validator/validate_seed_components.py

deploy-api:
	cd platform && fly deploy

deploy-web:
	cd frontend && vercel --prod

docker-dev:
	docker-compose up --build

docker-up:
	docker compose up -d

docker-down:
	docker compose down
