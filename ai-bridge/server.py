from flask import Flask, request, jsonify
from update_repo import update_file

app = Flask(__name__)

# 🧠 Main endpoint Antigravity will call
@app.route("/generate-and-update", methods=["POST"])
def generate_and_update():
    data = request.json

    prompt = data.get("prompt")
    file_path = data.get("file_path", "src/App.js")

    # 🔴 STEP: Antigravity generates code (we connect later)
    generated_code = call_antigravity(prompt)

    # 🔴 Push to GitHub
    update_file(file_path, generated_code, "AI auto update from prompt")

    return jsonify({"status": "success"})


# 🧠 TEMP FUNCTION (you will replace this later)
def call_antigravity(prompt):
    return f"""
import React from "react";

export default function App() {{
  return <h1>{prompt}</h1>;
}}
"""

if __name__ == "__main__":
    app.run(port=5000)
