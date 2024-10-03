from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
# from flask_redis import FlaskRedis
from flask_session import Session
from flask_migrate import Migrate
from .db import db
from .constants import Config
from .login import login_bp
from .routes import routes_bp
from .events import after_insert_daily_log, add_tracking_entries_after_insert  # Import event listeners

bcrypt = Bcrypt()
# redis_store = FlaskRedis()
sess = Session()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    sess.init_app(app)
    Migrate(app, db)  # Initialize Flask-Migrate

    # Enable CORS
    CORS(app, supports_credentials=True, origins=['http://localhost:3000'])

    # Register blueprints
    app.register_blueprint(routes_bp)
    app.register_blueprint(login_bp)

    with app.app_context():
        db.create_all()  # Create all tables if they don't exist

    return app
