let alertsRoot = $("<div></div>").attr("id", "simple_alerts");

$(document.body).append(alertsRoot);

/**
 * 
 * @param {('success'|'error'|'info')} type 
 * @param {string} msg 
 */
function showAlert(type, msg) {
    let alert = $("<div></div>").text(msg).addClass("simple-alert").addClass(type);

    alertsRoot.prepend(alert);

    setTimeout(()=>{
        alert.remove();
    }, 5000)
}