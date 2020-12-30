function showSnackbar(value) {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar");
    x.innerHTML = value
    // Add the "show" class to DIV
    x.className = "show";

    // After 3 seconds, remove the show class from DIV
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
}
var doesChangeOccure = false // for refreshing home page
// function to refresh home page 
function refreshHome() {
    if (doesChangeOccure) {
        doesChangeOccure = false
        location.reload()
    }

}
// function to show loading animation 
function showLoading() {
    document.getElementById('loadingAnimation').style.display = 'block'
}
// function to close loading animation 
function hideLoading() {
    document.getElementById('loadingAnimation').style.display = 'none'
}