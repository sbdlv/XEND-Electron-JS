let chattingWith = "";

let UI = {
  recentChats: $("#chats_list_items"),
  chat: {
    timeline: $("#chat__area__timeline"),
    input: $("#ui.chat.input"),
    remoteJID: $("#chatting-with-at"),
    remoteName: $("#chatting-with-name"),
  }
}

UI.chat.input.on("keypress", sendMessage);

function onNewMessage(event, msg) {
  let list_item = $(`.chats_list_item[data-user="${msg.from}"]`);

  //Create or update list item
  if (list_item.length) {
    list_item.find(".chats_list_item__info__msg").text(msg.body);
    list_item.prependTo(UI.recentChats);
  } else {
    UI.recentChats.prepend(
      getChatListItem(msg.from, msg.body)
    )
  }

  //If the message is from the current chattingWith, then show the message on the timeline
  if (chattingWith == msg.from) {
    UI.chat.timeline.append(
      getChatBubble(msg.body, false)
    )
  }

}

function getChatListItem(user_jid, body, isActive = false) {
  return $("<button></button>").append(
    $("<img/>").addClass("chats_list_item__pfp").attr("src", "img/pfp1.jpg"),
    $("<div></div>").append(
      $("<div></div>").addClass("chats_list_item__info__name").text("Temp name"),
      $("<div></div>").addClass("chats_list_item__info__msg").text(body),
    ).addClass("chats_list_item__info")
  ).addClass("chats_list_item").attr("data-user", user_jid).attr("onclick", "changeChat(this)").addClass(isActive ? "chats_list_item--active" : "")
}

async function changeChat(og) {
  UI.chat.timeline.children().remove();

  let listItem = $(og);
  swapActiveStatusChatListItem(listItem);

  updateChatUI(listItem.addClass("chats_list_item--active").attr("data-user"));
}

async function updateChatUI(remoteJID) {
  chattingWith = remoteJID;

  //Set chattingWith for future operations like sending messages etc.
  let vCard = await getVCard(chattingWith);

  //Update UI
  UI.chat.remoteJID.text(chattingWith);
  UI.chat.remoteName.text("User " + chattingWith);

  //TODO: Set avatar and FN from vCard

  //Append messages
  window.xendAPI.getMessagesFrom(chattingWith).then((messages) => {
    messages.forEach(message => {
      UI.chat.timeline.prepend(getChatBubble(message.body, message.sentLocally));
    });
  })
}

function swapActiveStatusChatListItem(newListItem, oldListItem = $(".chats_list_item--active")) {
  oldListItem.removeClass("chats_list_item--active");
  newListItem.addClass("chats_list_item--active").attr("data-user");
}

async function getVCard(user_at) {
  return await window.xendAPI.getVCard(user_at);
}

function getChatBubble(msg, isLocalMessage = false) {
  return $("<div></div>").text(msg).addClass("chat_bubble").addClass(isLocalMessage ? "" : "chat_bubble--remote");
}

window.xendAPI.addNewMessageHandler(onNewMessage);


setTimeout(async () => {
  console.log(await window.xendAPI.getVCard("usuario2@xend"));
}, 1000)


function updateChattingWith(user_at, full_name = "Temp") {
  UI.chat.remoteJID.text(user_at);
  UI.chat.remoteName.text(full_name);
}


function sendMessage(event) {
  if (event.key === "Enter") {
    console.log(window.xendAPI.sendMsg(chattingWith, UI.chat.input.val()));
    UI.chat.timeline.append(
      getChatBubble(UI.chat.input.val(), true)
    )
  }
}


function openNewChatModal() {
  $("#new-chat-modal").removeClass("modal-wrapper--hide");
}

function closeNewChatModal(og) {
  $(og).closest(".modal-wrapper").addClass("modal-wrapper--hide");
}

function startNewChat(og) {
  let remoteJID = $(og).closest("input").val();

  let list_item = $(`.chats_list_item[data-user="${remoteJID}"]`);
  //If the list item already exist, set the active status, if not, create it
  if (list_item.length) {
    swapActiveStatusChatListItem(list_item);
    //TODO:
  } else {
    UI.recentChats.prepend(
      getChatListItem(remoteJID, "", true)
    )
  }

  closeNewChatModal(og);

  //Load chat at the chat section
  updateChatUI(remoteJID);
}

//main

//Load last chatted users
window.xendAPI.getLastChattedUsers().then((chats) => {
  chats.forEach(chat => {
    if (chat.id != null) {
      UI.recentChats.prepend(
        getChatListItem(chat.remote_jid, chat.body, chat.sentLocally)
      )
    }
  });
}).catch((err) => {
  console.error("Couldn't get last chats. " + err);
})