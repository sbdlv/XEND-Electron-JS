const { client, xml } = require("@xmpp/client");
const debug = require("@xmpp/debug");

const { jid } = require("@xmpp/jid");

let xmpp;

function login(username, password) {
  let xmpp = client({
    service: "xmpp://localhost:5222",
    domain: "xend",
    username: username,
    password: password,
  });

  debug(xmpp, true);

  xmpp.on("error", (err) => {
    console.error(err);
  });

  xmpp.on("offline", () => {
    console.log("offline");
  });

  xmpp.on("stanza", async (stanza) => {
    console.group(xmpp.address);
    console.log(stanza.toString());

    // if (stanza.is("message")) {
    //   await xmpp.send(xml("presence", { type: "unavailable" }));
    //   await xmpp.stop();
    // }

    console.groupEnd();
  });

  xmpp.on("online", async (address) => {
    console.log("ONLINE");
    console.log("ADDRESS", address);

    await xmpp.send(xml("presence"));
  });

  xmpp.start().catch(console.error);

  return xmpp;
}

function chat(username, msg) {

  let JID = jid(`${username}@xend`);

  xmpp.send(xml("message", {
    to: JID,
    type: "chat"
  }, xml("body", {}, msg))).catch((e) => {
    console.log(e);
  });
}

function chatWith2() {
  chat("usuario2", "Hola usuario2");
}

function loginAs1() {
  xmpp = login("usuario1", "usuario");
}

let xmpp2;

function loginAs2() {
  login("usuario2", "usuario");
}


//Main
loginAs1();
loginAs2();