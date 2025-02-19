#!/bin/python

import requests
from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def index():
    ids = []
    profiles = requests.get("https://api.hglabor.de/stats/ffa/top?sort=kills").json()
    for profile in profiles:
        ids.append(profile["playerId"])

    return render_template("index.html", profiles=ids)


@app.route("/<string:id>")
def profile(id: str):
    data = requests.get(f"https://api.hglabor.de/stats/ffa/{id}").json()
    try:
        name = requests.get(f"https://api.minecraftservices.com/minecraft/profile/lookup/{id}").json()["name"]
    except KeyError:
        name = "no response"

    return render_template("profile.html", name=name, profile=data)


if __name__ == "__main__":
    app.run()
