#!/bin/bash
set -e

echo "==> Installing InvenTree dependencies..."

cd src/backend

# Install without hash checking (setuptools issue)
pip install --no-deps -r requirements.txt || pip install -r requirements.txt --no-deps

# Install setuptools separately
pip install setuptools

# Now install with dependencies
pip install -r requirements.txt --no-binary :all: || pip install -r requirements.txt

echo "==> Running migrations..."
cd InvenTree
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Setup completed successfully!"
