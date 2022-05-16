function login(og) {
    $(og).prop("disabled", true);
    let userAndDomain = $("#user-and-domain").val();
    userAndDomain = userAndDomain.split("@");

    let user = userAndDomain[0];
    let domain = userAndDomain[1];
    let password = $("#password").val();
    let server = $("#server").val();
    let port = $("#port").val();


    window.xendAPI.loginXMPP(user, domain, password, server, port).then(
        (isNotError) => {
            if(!isNotError){
                $(og).prop("disabled", false);
            }
            //console.log("Logeado!")
        }
    ).catch(
        (err) => {
            $(og).prop("disabled", false);
            console.error("Unkwonw error");
            //console.log("Error en el login")
        }
    )
}