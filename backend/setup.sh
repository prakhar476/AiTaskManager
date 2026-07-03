#!/bin/bash
# ── AI Task Manager — Backend Quick Setup ─────────────────────────────────────
set -e

echo "🚀 Setting up AI Task Manager backend..."

# 1. Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# 2. Activate
source venv/bin/activate

# 3. Install dependencies
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✅ Dependencies installed"

# 4. Download spaCy model
python -m spacy download en_core_web_sm -q
echo "✅ spaCy model downloaded"

# 5. Copy env file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ .env file created (update your SECRET_KEY before production!)"
fi

# 6. Run migrations
python manage.py migrate
echo "✅ Database migrated"

# 7. Create superuser (optional)
echo ""
echo "Would you like to create a superuser? (y/n)"
read -r CREATE_SUPER
if [ "$CREATE_SUPER" = "y" ]; then
    python manage.py createsuperuser
fi

echo ""
echo "🎉 Setup complete! Start the server with:"
echo "   source venv/bin/activate"
echo "   python manage.py runserver"
echo ""
echo "   (In a separate terminal, start Celery:)"
echo "   celery -A config worker --loglevel=info"
