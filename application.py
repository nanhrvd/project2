import os

from flask import Flask, session, render_template, request, url_for, redirect
from flask_session import Session

from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# list of all channels
channel_list = set(['general'])

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("add_server")
def add_server(data):
    name = data["name"]
    if name is None:
        print("name is none")
        emit("refresh_serverList", list(channel_list), broadcast=True)
        return
    print("name is: " + name);
    print("channel list contains:");
    for i in channel_list:
        print(i);
    if name not in channel_list:
        channel_list.add(name)
        emit("refresh_serverList", list(channel_list), broadcast=True)
    return