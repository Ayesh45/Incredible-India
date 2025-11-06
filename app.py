from flask import Flask, render_template, jsonify, send_from_directory
import os, json

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "static", "data")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/state-data")
def api_state_data():
    path = os.path.join(DATA_DIR, "stateData.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    return jsonify({}), 200

@app.route("/api/india-states")
def api_india_states():
    path = os.path.join(DATA_DIR, "india_states.geojson")
    if os.path.exists(path):
        return send_from_directory(DATA_DIR, "india_states.geojson")
    return jsonify({}), 200

if __name__ == "__main__":
    app.run(debug=True)
