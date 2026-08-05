// We are using -v2 *just in case* anybody has settings left over
// from the previous attempt to deploy a theme switcher.
// The suffix makes sure everyone is starting from scratch.
const LOCALSTORAGE_THEME = "theme-v2";

function load_theme() {
    // Look up the existing choice
    let user_choice = localStorage.getItem(LOCALSTORAGE_THEME);
    if (user_choice !== null) {
        // and set the page theme, if it exists
        document.documentElement.setAttribute("data-theme", user_choice);
    }
}
// On _every_ page, load the user's preferred theme
load_theme();

// This function _only_ runs on the "index.html" page
function on_main_page_load() {
    let theme_dropdown = document.getElementById("theme_switcher");

    let user_choice = localStorage.getItem(LOCALSTORAGE_THEME);
    if (user_choice !== null) {
        // Make the dropdown stay in sync with the saved value
        theme_dropdown.value = user_choice;
    }

    // Handle updates
    theme_dropdown.addEventListener("change", () => {
        let theme = theme_dropdown.value;
        // Set the page theme
        document.documentElement.setAttribute("data-theme", theme);
        // *and* remember it for later
        localStorage.setItem(LOCALSTORAGE_THEME, theme);
    });
}
// Make sure function is exported to HTML
window.on_main_page_load = on_main_page_load;
