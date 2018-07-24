import os, datetime, time
from operator import itemgetter
from pytz import timezone
from tzlocal import get_localzone
import pytz

from flask import Flask, session, render_template, request, url_for, redirect, jsonify
from flask_session import Session

from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# list of all channels
channel_list = {'general-server':'general'}

# messages
messages = {"general-server":[]}

@app.route("/")
def index():
    return render_template("index.html")

# add_server adds a new server and returns a list of servers
# passing in None returns a list of current serveers
@socketio.on("add_server")
def add_server(data):
    server_id = data["id"]
    name = data["name"]
    if name is None:
        emit("refresh_serverList", sorted(list(channel_list.values())), broadcast=True)
        return
    if server_id not in channel_list:
        channel_list[server_id] = name
        messages[server_id] = []
        parsed_list = [server[:-7] for server in channel_list]
        emit("refresh_serverList", sorted(list(channel_list.values())), broadcast=True)
    return

@socketio.on("add_message")
def add_message(data):
    # parse message
    message = data["message"]
    server = data["server"]
    user = data["user"]
    time = datetime.datetime.utcnow().replace(tzinfo=pytz.utc)
    processed_msg = (time, user, message)

    # keep only the most recent 100 messages
    if server not in messages:
        messages[server] = [];
    elif len(messages[server]) > 100:
        cut = len(messages[server]) - 100
        messages[server] = messages[server][cut:]

    # save most recent message at end of list
    messages[server].append(processed_msg)
    emit("new_messages", server, broadcast=True)

@app.route("/messages", methods=["POST"])
def get_messages():
    # check correct method
    if request.method != 'POST':
        return jsonify({"success":False})

    # check server is created
    server = request.form.get("server")
    if server not in channel_list:
        return jsonify({"success":False})

    # convert message timezones to local time
    msg_list = messages[server]
    local_msg_list = [];
    local_tz = get_localzone()
    for msg in msg_list:
        local_msg = [msg[0].astimezone(local_tz), msg[1], msg[2]]
        local_msg_list.append(local_msg)
    local_msg_list.sort(key=itemgetter(0))
    for msg in local_msg_list:
        msg[0] = msg[0].strftime("%b %d, %Y %H:%M")

    # sort by local time
    return jsonify({"messages":local_msg_list, "success":True})
    
