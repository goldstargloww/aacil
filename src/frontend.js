function should_use_dark_theme(watcher) {
    let user_choice = localStorage.getItem("theme");
    if (user_choice !== null) {
        // There is an explicit choice here
        return user_choice === "dark";
    }

    // Otherwise, use the system default
    return watcher.matches;
}

function set_theme(watcher) {
    if (should_use_dark_theme(watcher)) {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
}

let system_theme_watcher = window.matchMedia("(prefers-color-scheme: dark)");
// Set the theme once on load
set_theme(system_theme_watcher);
// Update the theme if the system default changes
system_theme_watcher.addEventListener("change", set_theme);

function on_main_page_load() {
    let light_theme_button = document.getElementById("light_theme");
    let dark_theme_button = document.getElementById("dark_theme");

    // Mark the user's choice, if there is one
    let user_choice = localStorage.getItem("theme");
    if (user_choice !== null) {
        if (user_choice === "dark")
            dark_theme_button.checked = true;
        else
            light_theme_button.checked = true;
    }

    // Handle the theme being set manually
    light_theme_button.addEventListener("click", () => {
        localStorage.setItem("theme", "light");
        set_theme(system_theme_watcher);
    });
    dark_theme_button.addEventListener("click", () => {
        localStorage.setItem("theme", "dark");
        set_theme(system_theme_watcher);
    });
}
// Make sure function is exported to HTML
window.on_main_page_load = on_main_page_load;
