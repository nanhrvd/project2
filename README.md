# Project 2

Web Programming with Python and JavaScript

INDEX.JS
Features/Optimizations:
Form validation for all forms

Pressing the currently active server's tab will not redo a get request for messages
Server list is scrollable

Typing a name of a pre-existing server will not make a request to add a new server
Typing the name of a pre-existing server will set that as active
	As above, will not redo a get request for messages

You only refresh message list if the channel you are on receives a message
	ie. if you are on general, you wont pull message updates on other tabs until you click them

Ability to log out
	logout will clear and disable all areas requiring login status
	logout will clear local storage


Additional Creative Feature:
SERVER LIST UPDATE TRACKER
When a new message is posted on a server that is not currently active, a pill badge will show up next to the server
	Pill badge contains number of new messages in that server
	Tracking is capped at 100 messages
	Update tracking begins on login
	Logging out will clear update tracking
	Selecting a new server will reset the counter and clear the pill

To test pill functionality with only one user, comment out static/index.js line 138:
    socket.on("new_message") is currently configured to not track the active server
    comment out existing implementation and uncomment the below single user testing code
    	this allows pills to track new messages posted by the user in the current active server
    	NOTE: to reset counters in single user testing, you must click off of the current server then re-click it
    		this is because clicking the current server button immediately returns false
    		otherwise, it'd be inefficient to reset the counter of an untracked server on every click


APPLICATION.PY
Contains socket.io and messages API

INDEX.HTML
The webpage

MYSTYLE.CSS
CSS style sheet