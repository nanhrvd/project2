document.addEventListener('DOMContentLoaded', () => {
    var_init();
    form_init();
    button_init();
    console.log('init');

    // check login status
    console.log("username is " + localStorage.getItem('username'));
    if (localStorage.getItem('username') === '') {
        logged_out(true);
    } else {
        logged_out(false);
    }
});

// initializes variables and binds forms
function var_init() {
    localStorage.removeItem("username");

    if (!localStorage.getItem('username'))
        localStorage.setItem('username', '');
}

function form_init() {
    setup_login();
    setup_logout();
}

function button_init() {
    // disable all input buttons pending validation
    var buttons = document.querySelectorAll('[type=submit]');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
    }
    setup_validation("#username_input", "#username_button");
    setup_validation("#new_server_input", "#new_server_button");

    // no validation for logout button
    document.querySelector("#logout_button").disabled = false;
}

function socketio_init() {
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // When connected, configure buttons
    socket.on('connect', () => {

        // Server creation button should add a new button
        document.querySelector('button').forEach(button => {
            button.onclick = () => {
                var server_name = document.querySelector("#new_server_input").value;
                document.querySelector("#new_server_input").value = '';
                socket.emit('add_server', {'name': server_name});
            };
        });
    });

    // When a new server is announced, refresh the list
    socket.on('refresh_serverList', data => {
        var channels;
        var server_list = document.getElementById('server_list');
        // server_list.innerHTML = "";

        var message_area = document.getElementById('chat_logs');

        for(var i = 0; i < data.length; i++) {
            var server_id = "#" + data[i] + "-server"
            var tab_id = "#" + data[i] + "-messages";
            new_channel = document.createElement("a");
            new_channel.setAttribute("class", "btn list-group-item list-group-item-action logged_in");
            new_channel.setAttribute("role", "tab");
            new_channel.setAttribute("href", "tab_id");
            new_channel.setAttribute("data-toggle", "list");
            new_channel.setAttribute("aria-controls", data[i]);
            new_channel.setAttribute("id", server_id);
            new_channel.innerHTML = data[i];

            var new_messages = document.createElement("div");
            new_messages.setAttribute("class", "tab-pane fade");
            new_messages.setAttribute("role", "tabpanel");
            new_messages.setAttribute("id", tab_id);
            new_messages.setAttribute("aria-labelledby", server_id);
            new_messages.innerHTML = "TEMPORARY VAL";


            server_list.append(new_channel);
            message_area.append(new_messages);

        }
    });

    socket.on('refresh_chatList', data => {

    });
}

function logged_out(loggedOut) {
    console.log("logging out");
    to_modify = document.querySelectorAll(".logged_in");
    console.log(to_modify);
    console.log("passed int " + loggedOut);
    if (loggedOut){
        // turn off areas that require login
        for (var i = 0; i < to_modify.length; i++) {
            console.log("disabled");
            to_modify[i].classList.add("disabled");
            to_modify[i].disabled = true;
        }
        // reset login value and turn on login form
        document.querySelector("#username_input").value = '';

        // turn off new server input
        document.querySelector("#new_server_input").value = '';
        document.querySelector("#new_server_button").disabled = true;

        display_login(true);
    } else {
        // turn on areas requiring login
        for (i = 0; i < to_modify.length; i++) {
            to_modify[i].classList.remove("disabled");
            to_modify[i].disabled=false;
        }
        // turn off login form and turn on logout
        var message = "Hello " + localStorage.getItem('username');
        document.getElementById('logout_message').placeholder = message;
        display_login(false);        
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
        localStorage.removeItem('username');
        logged_out(true);
        return false;
    };
}
function display_login(to_display) {
    if (to_display) {
        document.querySelector("#login_prompt").style.display = "block";
        document.querySelector("#login_form").style.display = "block";
        document.querySelector("#logout_form").style.display = "none";
    } else {
        document.querySelector("#login_prompt").style.display = "none";
        document.querySelector("#login_form").style.display = "none";
        document.querySelector("#logout_form").style.display = "block";
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