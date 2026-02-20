.PHONY: dev test lint validate

dev:
	cd platform && pip install -r requirements.txt && python -m api.main

test:
	cd platform && python -m pytest -v

lint:
	cd platform && ruff check .

validate:
	cd tools/manifest-validator && python validate.py ../../components/clawbie-v4/

deploy-api:
	cd platform && fly deploy

deploy-web:
	cd frontend && vercel --prod

docker-dev:
	docker-compose up --build
