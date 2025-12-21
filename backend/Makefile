.PHONY: help install dev test lint format run docker-up docker-down docker-build migrate

help:
	@echo "Available commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Install dev dependencies"
	@echo "  make run         - Run development server"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run linters"
	@echo "  make format      - Format code"
	@echo "  make migrate     - Run database migrations"
	@echo "  make docker-up   - Start Docker containers"
	@echo "  make docker-down - Stop Docker containers"
	@echo "  make docker-build- Build Docker image"

install:
	pip install -r requirements.txt

dev:
	pip install -r requirements.txt
	pip install -e .[dev]

run:
	uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest

test-cov:
	pytest --cov=src --cov-report=html --cov-report=term-missing

lint:
	ruff check src tests
	black --check src tests

format:
	black src tests
	ruff check --fix src tests

migrate:
	alembic upgrade head

migrate-create:
	alembic revision --autogenerate -m "$(msg)"

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-shell:
	docker-compose exec api /bin/bash

