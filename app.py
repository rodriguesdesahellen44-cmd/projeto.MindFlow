from flask import Flask

from config import Config
from database import initialize_database
from routes import register_blueprints


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    register_blueprints(app)
    return app


app = create_app()


if __name__ == "__main__":
    initialize_database()
    app.run(host="127.0.0.1", port=8000, debug=True)
