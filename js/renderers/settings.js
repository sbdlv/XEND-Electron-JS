let UI = {
    vCard: {
        userJID: $("#local-user-jid"),
        FN: $("#fn"),
        DESC: $("#desc"),
    },
    entries: {
        all: $("[data-tab]")
    }
}

function save() {
    let vCard = {
        FN: $("#fn").val(),
        DESC: $("#desc").val(),
    }

    window.xendAPI.setVCard(vCard).then(console.log).catch(console.error);
}

function loadChat() {
    window.xendAPI.loadChat();
}

function loadTab(event){
    let ogElement = $(event.target);

    let tab = ogElement.data("tab");
    $(".tab--active").removeClass("tab--active");
    $("#tab-" + tab).addClass("tab--active");

    $(".pill-button--active").removeClass("pill-button--active");
    ogElement.addClass("pill-button--active");
}

//main

(async ()=>{
    let userJID = await window.xendAPI.getLocalUserJID();
    UI.vCard.userJID.text(userJID);
})();

//Load and display current vCard
window.xendAPI.getVCard("usuario1@xend").then((vCard) => {
    console.log(vCard);
    UI.vCard.FN.val(vCard.FN);
    UI.vCard.DESC.val(vCard.DESC);
});

UI.entries.all.on("click", loadTab);