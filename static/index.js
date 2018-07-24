var socket;
var counters;

document.addEventListener('DOMContentLoaded', () => {
    // initializers
    socketio_init();
    var_init();
    form_init();
    button_init();
    
    // get servers
    socket.emit('add_server', {'name': null, 'id':null});

    // check login status
    if (localStorage.getItem('username') === '') {
        logged_out(true);
    } else {
        logged_out(false);
    }
});

// initialization functions
function var_init() {
    if (localStorage.getItem("username") === null)
        localStorage.setItem("username", "");
    if (localStorage.getItem("last_viewed") === null)
        localStorage.setItem("last_viewed", "");
    // update tracking starts when you log in
    counters = {"general-server":0};
}

function form_init() {
    setup_login();
    setup_logout();
    setup_msg_input();
}

function button_init() {
    // disable all input buttons pending validation
    var buttons = document.querySelectorAll('[type=submit]').forEach(function(button) {
        button.disabled = true;
    });
    setup_validation("#username_input", "#username_button");
    setup_validation("#new_server_input", "#new_server_button");
    setup_validation("#message_input", "#message_post");

    // no validation for logout button
    document.querySelector("#logout_button").disabled = false;
}

function socketio_init() {
    // setup socket connect
    socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // setup new server form
    socket.on('connect', () => {
        document.getElementById("new_server_form").onsubmit = () => { 
            var server_name = document.querySelector("#new_server_input").value;
            // reset form
            document.querySelector("#new_server_input").value = '';

            // parse input as html id, check if is current
            var server_id = server_name.replace("-", "--").replace(" ", "-") + "-server";
            if (localStorage.getItem("current_server") == server_id) {
                return false;
            }

            // update current server if doesn't exist and emit add server
            localStorage.setItem("current_server", server_id);
            if(document.getElementById(server_id) == null) {
                socket.emit('add_server', {'id': server_id, 'name':server_name});
            } else {
                load_current();
            }
            return false;
        };
    });

    // When a new server is announced, refresh the list
    socket.on('refresh_serverList', data => {
        var server_list = document.getElementById('server_list');
        var message_area = document.getElementById('chat_logs');

        // parse data
        var parsed_data = [];
        for (let parse of data) {
            var safe_server = parse.replace("-", "--").replace(" ", "-");
            var serverID = safe_server + "-server";
            var messageID = safe_server + "-messages";
            var parsed = {server_id:serverID, message_id:messageID, server:safe_server, server_name:parse};
            parsed_data.push(parsed);

            // setup counter
            if (!(serverID in counters)) {
                counters[serverID] = 0;
            }
        }

        // generate server list through handlebars
        var temp_class = "btn list-group-item list-group-item-action logged_in servers d-flex justify-content-between";
        if (localStorage.getItem('username') === '')
            temp_class += " disabled";
        var html_temp = "<a class=\"" + temp_class + 
                            "\" role=\"tab\"" +
                            "href=\"#{{ message_id }}" + 
                            "\" data-toggle=\"list\" aria-controls=\"{{ server }}\"" +
                            "id=\"{{ server_id }}\" aria-selected=\"false\">{{ server_name }}</a>"
        var server_master_temp = "{{#each this }} " + html_temp + " {{/each}}"

        const server_template = Handlebars.compile(server_master_temp);
        const server_content = server_template(parsed_data);

        // generate message list
        html_temp = "<div class=\"tab-pane fade messages\" id=\"{{ message_id }}\"" + 
                    "role=\"tabpanel\" aria-labelledby=\"{{ server_id }}\">" +
                    "<ul class=\"list-group list-group-flush\" id=\"{{ message_id }}-list\"></ul>" +
                    "</div>"
        var message_master_temp = "{{#each this }} " + html_temp + " {{/each}}"
        const message_template = Handlebars.compile(message_master_temp);
        const message_content = message_template(parsed_data);

        // insert content and setup buttons
        server_list.innerHTML = server_content;
        message_area.innerHTML = message_content;
        bind_server_buttons();
        load_current();
    });

    // if current then update, else update new message counter
    socket.on('new_messages', data => {
        var current_id = localStorage.getItem("current_server");
        if (data == current_id) {
            get_messages();
        } else if (localStorage.getItem("username" != "")) {
            counters[current_id]++;
            load_counters(current_id);
        }
        return false;

        // NOTE: following code for single user testing purposes only
        // var current_id = localStorage.getItem("current_server");
        // counters[current_id]++;
        // load_counters(current_id);
        // if (data == current_id) {
        //     get_messages();
        // }
        // return false;
    });
}

// sets up the server buttons
function bind_server_buttons() {
    var server_buttons = document.querySelectorAll(".servers");
    for (let button of server_buttons) {
        button.onclick = () => {
            // do nothing if already current
            if (localStorage.getItem("current_server") == button.id) {
                return false;
            }
            localStorage.setItem("current_server", button.id);
            get_messages();

            // reset update counter
            counters[button.id] = 0;
            load_counters(button.id);
        };
    }
}

// loads server button w/ update pill
function load_counters(server_id) {
    // check logged in
    var user = localStorage.getItem("username");
    if (user === "") {
        counters[server_id] = 0;
        return false;
    }

    // check for pill
    var pill_id = server_id + "-updates"
    var pill = document.getElementById(pill_id);
    if (pill === null) {
        // create pill
        var temp = "<span class=\"badge badge-primary badge-pill\" id=\"{{ pill_id }}\"></span>";
        const pill_template = Handlebars.compile(temp);
        
        var data = {"pill_id":pill_id}
        pill = pill_template(data);
        document.getElementById(server_id).innerHTML += pill;
        pill = document.getElementById(pill_id);
    }

    // update pill
    if (counters[server_id] != 0) {
        if (counters[server_id] > 100) {
            counterst[server_id] = 100;
        }
        pill.innerHTML = counters[server_id];
    } else {
        pill.innerHTML = "";
    }
    return false;
}

// removes active status from all chat servers and message areas
function remove_active() {
    var server_buttons = document.querySelectorAll(".servers");
    for (let button of server_buttons) {
        button.classList.remove("show");
        button.classList.remove("active");
        button.setAttribute("aria-selected", "false");
    }
    var server_messages = document.querySelectorAll(".messages");
    for (let message of server_messages) {
        message.classList.remove("show");
        message.classList.remove("active");
    }
}

// check for current active server button and message, set as active
function load_current() {
    if (localStorage.getItem("current_server") != null) {
        remove_active();
        var current = document.getElementById(localStorage.getItem("current_server"));
        if (current == null) {
            localStorage.removeItem("current_server");
            return false;
        }
        current.classList.add("active");
        current.classList.add("show");
        current.setAttribute("aria-selected", "true");

        var messages_id = localStorage.getItem("current_server");
        var message = document.getElementById(messages_id.slice(0, -6) + "messages");
        message.classList.add("active");
        message.classList.add("show");
        get_messages();
    }
}

// changes login area: 
// (True): displays login prompt
// (False): displays logout prompt
function display_login(logged_out) {
    if (logged_out) {
        document.querySelector("#login_prompt").style.display = "block";
        document.querySelector("#login_form").style.display = "block";
        document.querySelector("#logout_form").style.display = "none";
        document.querySelector("#chat_logs").style.display = "none";
    } else {
        document.querySelector("#login_prompt").style.display = "none";
        document.querySelector("#login_form").style.display = "none";
        document.querySelector("#logout_form").style.display = "block";
        document.querySelector("#chat_logs").style.display = "block";
    }
} 

// action taken by login / logout
// (True): renders page in logged out status
// (False): renders page in logged in status
function logged_out(loggedOut) {
    to_modify = document.querySelectorAll(".logged_in");
    if (loggedOut){
        // turn off areas that require login
        for (let areas of to_modify) {
            areas.classList.add("disabled");
            areas.disabled = true;
        }

        // clear and disable servers and messages
        remove_active();

        // remove messages
        // this ensure people can't read messages through inspect element
        document.querySelector("#message_input").value = '';
        document.querySelector('#message_post').disabled = true;

        // reset login value and turn on login form
        document.querySelector("#username_input").value = '';
        document.querySelector('#username_button').disabled = true;
        // turn off new server input
        document.querySelector("#new_server_input").value = '';
        document.querySelector("#new_server_button").disabled = true;
        // clear update tracker pills
        document.querySelectorAll(".badge-pill").forEach(function(pill){
            pill.innerHTML="";
        });
        // reset local storage
        localStorage.clear();
        var_init();

        display_login(true);
    } else {
        // turn on areas requiring login
        for (let areas of to_modify) {
            areas.classList.remove("disabled");
            areas.disabled = false;
        }
        // turn off login form and turn on logout
        var message = "Hello " + localStorage.getItem('username');
        document.getElementById('logout_message').placeholder = message;
        display_login(false); 
        // render servers
        localStorage.setItem('current_server', "general-server");
        socket.emit('add_server', {'name': null, "id":null});
    }
}

// Setup login submission handler
function setup_login() {
    document.querySelector('#new_username').onsubmit = () => {
        var input = document.querySelector("#username_input").value;
        localStorage.setItem('username', input);
        logged_out(false);
        return false;
    };
}

// Setup logout submission handler
function setup_logout() {
    document.querySelector('#logout_request').onsubmit = () => {
        localStorage.removeItem('username');
        localStorage.removeItem('current_server');
        logged_out(true);
        return false;
    };
}

function setup_msg_input() {
    document.querySelector('#new_message_form').onsubmit = () => {
        var input = document.querySelector('#message_input').value;
        var server = localStorage.getItem("current_server");
        var user = localStorage.getItem("username");
        socket.emit("add_message", {"message":input, "server":server, "user":user});
        document.querySelector('#message_input').value = '';
        document.querySelector('#message_post').disabled = true;
        return false;
    };
}

function get_messages() {
    var server = localStorage.getItem("current_server");
    var request = new XMLHttpRequest();
    request.open("POST", "/messages", true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send("server="+localStorage.getItem("current_server"));
    request.onload = () => {
        const data = JSON.parse(request.responseText);
        if (!data.success) {
            localStorage.removeItem("current_server");
            return false;
        }

        // parse data
        var parsed_data = [];
        for (let msg of data.messages) {
            var time = String(msg[0]) + " " + msg[1]
            var message = msg[2]
            parsed_data.push({"intro":time, "message":message})
        }

        // generate message list
        var list_temp = "{{#each this }}" +
                        "<li class=\"list-group-item\">" + 
                        "{{ intro }} <br>" +
                        "{{ message }} </li>" +
                        "{{/each}}"
        const msg_list_template = Handlebars.compile(list_temp);
        const msg_list_content = msg_list_template(parsed_data);

        var print_msg_area = document.getElementById(localStorage.getItem("current_server").slice(0, -6) + "messages-list");
        print_msg_area.innerHTML = msg_list_content;     
    }
}

// Enable button only if there is text in the input field
// all 3 types of button checks are bound to this check b.c there are ways to exploit each individually
// eg. keyup: hold down backspace, can hit enter on empty string b.c backspace never released
function setup_validation(input_area, button) {
    function disable_submit() {   
        var input = document.querySelector(input_area).value;
        if (/\S/.test(input))
            document.querySelector(button).disabled = false;
        else
            document.querySelector(button).disabled = true;
    }
    document.querySelector(input_area).addEventListener('keydown', disable_submit);
    document.querySelector(input_area).addEventListener('keyup', disable_submit);
    document.querySelector(input_area).addEventListener('keypress', disable_submit);
}
