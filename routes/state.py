import json
import sqlite3

from flask import Blueprint, current_app, jsonify, request
from werkzeug.exceptions import RequestEntityTooLarge

from models.state import read_state, write_state


state_bp = Blueprint("state", __name__)


@state_bp.get("/api/state")
def get_state():
    try:
        return jsonify(state=read_state())
    except sqlite3.Error:
        current_app.logger.exception("Falha ao ler os dados do banco SQLite")
        return jsonify(error="Não foi possível ler os dados salvos."), 500


@state_bp.put("/api/state")
def put_state():
    length = request.content_length
    if length is None or length <= 0 or length > 1_000_000:
        return jsonify(error="Tamanho de solicitação inválido."), 400

    try:
        payload = json.loads(request.get_data(cache=False))
        write_state(payload)
        return jsonify(ok=True)
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError) as error:
        return jsonify(error=str(error)), 400
    except RequestEntityTooLarge:
        return jsonify(error="Tamanho de solicitação inválido."), 400
    except sqlite3.Error:
        current_app.logger.exception("Falha ao gravar os dados no banco SQLite")
        return jsonify(error="Não foi possível salvar os dados."), 500
