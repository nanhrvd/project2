function init() {
    if (!localStorage.getItem('username'))
        localStorage.setItem('username', null);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('hello world');
    init();
    console.log('init');
    if (localStorage.getItem('username') == null) {
        toggle_class('logged_in', 'disabled');
    }
});

function toggle_class(queryClass, newClass) {
    to_disable = document.querySelectorAll(queryClass);
    var i;
    for (i = 0; i < to_disable.length; i++) {
        to_disable[i].classList.toggle(newClass);
    }
}
