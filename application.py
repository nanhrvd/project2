import os

from flask import Flask, session, render_template, request, url_for, redirect
from flask_session import Session

from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# list of all channels
channel_list = set('general')

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("add_server")
def vote(data):
    name = data["name"]
    if name in set:
    	return;
    else:
	    channel_list.add(name)
	    emit("refresh_serverList", channel_list, broadcast=True)