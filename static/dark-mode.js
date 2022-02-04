let isDark = false;
window.onload = () => {
    const btn = document.getElementById('darkmode-toggle');
    btn.innerHTML = isDark ? 'Light mode' : 'Dark mode'
    btn.addEventListener("click", function () {
        document.body.classList.toggle("dark-theme");
        isDark = !isDark
        btn.innerHTML = isDark ? 'Light mode' : 'Dark mode'
        localStorage.setItem("mode", isDark ? 'dark' : 'light')
    });
}
const stored = localStorage.getItem("mode")

let toSet;
if (stored === null) {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    toSet = prefersDarkScheme.matches
} else {
    toSet = stored === 'dark'
}

if (toSet === true) {
    isDark = true
    document.body.classList.add('dark-theme');
    console.log("to dark")
} else {
    console.log("to light")
    isDark = false
    document.body.classList.remove('dark-theme');
}