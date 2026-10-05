from flask import Blueprint, redirect, render_template, url_for


main_bp = Blueprint("main", __name__)


@main_bp.get("/")
def index():
    return render_template("index.html")


@main_bp.get("/index.html")
@main_bp.get("/MindFlow.html")
def legacy_index():
    return redirect(url_for("main.index"))


@main_bp.get("/style.css")
def legacy_stylesheet():
    return redirect(url_for("static", filename="style.css"))


@main_bp.get("/script.js")
def legacy_script():
    return redirect(url_for("static", filename="script.js"))


@main_bp.get("/manifest.json")
def legacy_manifest():
    return redirect(url_for("static", filename="manifest.json"))
