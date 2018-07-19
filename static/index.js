var socket;

document.addEventListener('DOMContentLoaded', () => {
    socketio_init();
    var_init();
    form_init();
    button_init();
    console.log('init');

    // get servers
    socket.emit('add_server', {'name': null});

    // check login status
    console.log("js username is " + localStorage.getItem('username'));
    if (localStorage.getItem('username') === '') {
        logged_out(true);
    } else {
        logged_out(false);
    }

});

// initialization functions
function var_init() {
    console.log("VAR INIT")
    if (localStorage.getItem("username") === null)
        localStorage.setItem("username", "");
    if (localStorage.getItem("last_viewed") === null)
        localStorage.setItem("last_viewed", "");
}

function form_init() {
    setup_login();
    setup_logout();
}

function button_init() {
    // disable all input buttons pending validation
    var buttons = document.querySelectorAll('[type=submit]').forEach(function(button) {
        button.disabled = true;
    });
    // for (var i = 0; i < buttons.length; i++) {
    //     buttons[i].disabled = true;
    // }
    setup_validation("#username_input", "#username_button");
    setup_validation("#new_server_input", "#new_server_button");

    // no validation for logout button
    document.querySelector("#logout_button").disabled = false;
}

function socketio_init() {
    socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    // When connected, configure buttons
    socket.on('connect', () => {
        console.log("CNXN EST to socket io");
        // Server creation button should add a new button
        document.getElementById("new_server_form").onsubmit = () => { 
            console.log("SUBMITTED new server form");           
            var server_name = document.querySelector("#new_server_input").value;
            document.querySelector("#new_server_input").value = '';
            var server_id = server_name.replace("-", "--").replace(" ", "-") + "-server";
            localStorage.setItem("current_server", server_id);
            console.log("about to emit ADD_SERVER");
            socket.emit('add_server', {'name': server_name});
            console.log("RETURNING FALSE");
            return false;
        };
    });

    // When a new server is announced, refresh the list
    socket.on('refresh_serverList', data => {
        console.log("REFRESH SERVERLIST CALLED");
        var channels;
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
        }
        // for (var i = 0; i < data.length; i++) {
        //     var safe_server = data[i].replace("-", "--").replace(" ", "-");
        //     var serverID = safe_server + "-server";
        //     var messageID = safe_server + "-messages";
        //     var parse = {server_id:serverID, message_id:messageID, server:safe_server, server_name:data[i]};
        //     parsed_data.push(parse);
        // }

        // generate server list
        var temp_class = "btn list-group-item list-group-item-action logged_in servers";
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
        html_temp = "<div class=\"tab-pane fade\" id=\"{{ message_id }}\"" + 
                    "role=\"tabpanel\" aria-labelledby=\"{{ server_id }}\">" +
                    "{{ message_id }}, parent is {{ server_id }}</div>"
        var message_master_temp = "{{#each this }} " + html_temp + " {{/each}}"
        const message_template = Handlebars.compile(message_master_temp);
        const message_content = message_template(parsed_data);


        // insert content
        server_list.innerHTML = server_content;
        message_area.innerHTML = message_content;
        bind_server_buttons();

        // check for last active server button and message
        if (localStorage.getItem("current_server") != null) {
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
            console.log("getting message tab " + messages_id);
            message.classList.add("active");
            message.classList.add("show");
        }
    });

    socket.on('refresh_chatList', data => {

    });
}

function bind_server_buttons() {
    var server_buttons = document.querySelectorAll(".servers");
    for (let button of server_buttons) {
        console.log(button);
        button.onclick = () => {
            console.log("SAVED CURRENT SERVER " + button.id);
            localStorage.setItem("current_server", button.id);
        };
    }
    // for (var i = 0; i < server_buttons.length; i++) {
    //     console.log(server_buttons[i]);
    //         this.onclick() = () => {
    //         console.log("SAVED CURRENT SERVER " + server_buttons[i].id);
    //         localStorage.setItem("current_server", server_buttons[i].id);
    //     };
    // }
}

function logged_out(loggedOut) {
    console.log("logging out");
    to_modify = document.querySelectorAll(".logged_in");
    console.log(to_modify);
    console.log("passed int " + loggedOut);
    if (loggedOut){
        // turn off areas that require login
        for (let areas of to_modify) {
            console.log("disabled");
            areas.classList.add("disabled");
            areas.disabled = true;
        }
        // for (var i = 0; i < to_modify.length; i++) {
        //     console.log("disabled");
        //     this.classList.add("disabled");
        //     this.disabled = true;
        // }
        // reset login value and turn on login form
        document.querySelector("#username_input").value = '';

        // turn off new server input
        document.querySelector("#new_server_input").value = '';
        document.querySelector("#new_server_button").disabled = true;

        display_login(true);
    } else {
        // turn on areas requiring login
        for (let areas of to_modify) {
            areas.classList.remove("disabled");
            areas.disabled = false;
        }
        // for (i = 0; i < to_modify.length; i++) {
        //     this.classList.remove("disabled");
        //     this.disabled=false;
        // }
        // turn off login form and turn on logout
        var message = "Hello " + localStorage.getItem('username');
        document.getElementById('logout_message').placeholder = message;
        display_login(false); 
        // render servers
        socket.emit('add_server', {'name': null});
    }
}

// Setup login submission handler
function setup_login() {
    document.querySelector('#new_username').onsubmit = () => {
        var input = document.querySelector("#username_input").value;
        console.log("input is " + input);
        console.log("username set to " + input);
        localStorage.setItem('username', input);
        logged_out(false);
        return false;
    };
}

// Setup logout submission handler
function setup_logout() {
    document.querySelector('#logout_request').onsubmit = () => {
        console.log("log out button clicked");
        localStorage.removeItem('username');
        localStorage.removeItem('current_server');
        logged_out(true);
        return false;
    };
}
function display_login(to_display) {
    if (to_display) {
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
// function toggle_class(queryClass, newClass) {
//     console.log("toggling class ." + queryClass);
//     to_toggle = document.querySelectorAll("." + queryClass);
//     console.log(to_toggle);
//     var i;
//     for (i = 0; i < to_toggle.length; i++) {
//         console.log("disabled");
//         to_toggle[i].classList.toggle(newClass);
//         if (newClass === "disabled") {
//             if (to_toggle[i].hasAttribute("disabled")) {
//                 to_toggle[i].removeAttribute("disabled")
//             } else {
//                 to_toggle[i].setAttribute("disabled", true);
//             }
//         }
//     }
//     console.log(to_toggle);
// }