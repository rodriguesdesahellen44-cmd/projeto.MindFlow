from routes.main import main_bp
from routes.state import state_bp


def register_blueprints(app):
    app.register_blueprint(main_bp)
    app.register_blueprint(state_bp)
