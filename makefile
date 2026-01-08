test:
	pytest --cov=app --cov-report=term-missing

test-html:
	pytest --cov=app --cov-report=html
	open htmlcov/index.html || xdg-open htmlcov/index.html

test-fast:
	pytest -m "not slow"

test-integration:
	pytest -m integration

clean:
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
	rm -rf __pycache__
	rm -rf */__pycache__
	rm -rf */*/__pycache__