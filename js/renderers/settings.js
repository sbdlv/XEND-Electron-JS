let UI = {
    vCard: {
        FN: $("#fn"),
        DESC: $("#desc"),
        PHOTO: $("#photo"),
        PHOTO_IMG: $("#photo-img")
    },
    entries: {
        all: $("[data-tab]")
    }
}

function fixMissingPFP(og) {
    let img = og.target ? og.target : og;
    img.src = "img/no_pfp.svg";
}

function save() {
    let vCard = {
        FN: $("#fn").val(),
        DESC: $("#desc").val(),
        PHOTO_BASE_64: $("#photo").val()
    }

    window.xendAPI.setVCard(vCard).then(() => {
        showAlert("success", "Perfil actualizado.");
    }).catch((err) => {
        console.error(err);
        showAlert("error", "Error al actualizar el perfil.")
    });
}

function loadChat() {
    window.xendAPI.loadChat();
}

function loadTab(event) {
    let ogElement = $(event.target);

    let tab = ogElement.data("tab");
    $(".tab--active").removeClass("tab--active");
    $("#tab-" + tab).addClass("tab--active");

    $(".pill-button--active").removeClass("pill-button--active");
    ogElement.addClass("pill-button--active");
}

//main
//Load and display current vCard
window.xendAPI.getLocalVCard().then((vCard) => {
    console.log(vCard);
    UI.vCard.FN.val(vCard.FN);
    UI.vCard.DESC.val(vCard.DESC);
    UI.vCard.PHOTO_IMG.attr("src", `data:image/png;base64, ${vCard.PHOTO}`);
    UI.vCard.PHOTO.val(vCard.PHOTO);
});

UI.entries.all.on("click", loadTab);




async function editPFP() {
    let base64photo = await window.xendAPI.promptVCardImage();

    if (base64photo) {
        UI.vCard.PHOTO.val(base64photo);
        UI.vCard.PHOTO_IMG.attr("src", `data:image/png;base64, ${base64photo}`);
    }
}

function logout() {
    window.xendAPI.logoutXMPP().catch(console.error);
}

function deleteAllChats() {
    window.xendAPI.deleteAllMessages().then(() => {
        showAlert("success", "Chats eliminados correctamente.")
    }).catch((err) => {
        console.error(err)
        showAlert("error", "No se han podido eliminar los chats.")
    });
}

function deleteData() {
    window.xendAPI.deleteCurrentData().catch((err) => {
        console.error(err)
        showAlert("error", "No se han podido eliminar los datos del usuario actual.")
    });
}

function deletePhoto() {
    UI.vCard.PHOTO.val("");
    UI.vCard.PHOTO_IMG.attr("src", "");
}