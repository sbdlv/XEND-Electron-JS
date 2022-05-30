let chattingWith = "";
let recentMessageDate;

let UI = {
  profileCard: {
    userName: $("#local-user-name"),
    userJID: $("#local-user-jid"),
    userPhoto: $("#local-user-photo")
  },
  recentChats: $("#chats_list_items"),
  chat: {
    root: $("#chat"),
    timeline: $("#chat__area__timeline"),
    input: $("#message_input").on("keypress", sendMessage),
    remoteJID: $("#chatting-with-at"),
    remoteName: $("#chatting-with-name"),
    photo: $("#chatting-with-photo")
  },
  profileModal: {
    fn: $("#profile-fn"),
    jid: $("#profile-jid"),
    desc: $("#profile-desc"),
    photo: $("#profile-photo"),
  },
  newChatModal: {
    jid: $("#new-chat-jid")
  }
}

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

  //Create date-line if the message is from a different day from the previous one
  if (!isSameDayMonthAndYear(recentMessageDate, new Date())) {
    UI.chat.timeline.append(
      getDateTimeline(new Date())
    )
  }

  //If the message is from the current chattingWith, then show the message on the timeline
  if (chattingWith == msg.from) {
    UI.chat.timeline.append(
      getChatBubble(msg.body, false)
    )
  }

}

function getChatListItem(user_jid, body, isActive = false, photo = "") {
  return $("<button></button>").append(
    $("<img/>").addClass("chats_list_item__pfp").attr("src", `data:image/png;base64, ${photo}`).on("error", fixMissingPFP),
    $("<div></div>").append(
      $("<div></div>").addClass("chats_list_item__info__name").text(user_jid), //TODO: user proper vCard FN if available, if not, dont show anything ?
      $("<div></div>").addClass("chats_list_item__info__msg").text(body),
    ).addClass("chats_list_item__info")
  ).addClass("chats_list_item").attr("data-user", user_jid).attr("onclick", "changeChat(this)").addClass(isActive ? "chats_list_item--active" : "")
}

async function changeChat(og) {
  let listItem = $(og);

  UI.chat.root.removeClass("chat--empty");

  //Prevent processing if it is already the active chat
  if (listItem.hasClass("chats_list_item--active")) {
    return;
  }

  UI.chat.timeline.children().remove();
  swapActiveStatusChatListItem(listItem);

  updateChatUI(listItem.addClass("chats_list_item--active").attr("data-user"));
}

async function updateChatUI(remoteJID) {
  chattingWith = remoteJID;
  recentMessageDate = undefined;
  
  UI.chat.root.removeClass("chat--empty");

  //Set chattingWith for future operations like sending messages etc.
  let vCard = await getVCard(chattingWith);

  //Update UI
  UI.chat.remoteJID.text(chattingWith);
  UI.chat.remoteName.text(vCard.FN === "" ? chattingWith : vCard.FN);

  //Set avatar and FN from vCard
  UI.chat.photo.attr("src", `data:image/png;base64, ${vCard.PHOTO}`);

  /*
    NOTE:
    In the future, messages will be loaded by index offset etc. When fetching more messages,
    the last date-line should be removed.
  */
  //Append messages
  window.xendAPI.getMessagesFrom(chattingWith).then((messages) => {
    let lastMessageDate;

    messages.forEach(message => {
      let messageDate = new Date(message.date);
      console.log(messageDate, message.body);

      if (lastMessageDate === undefined || !isSameDayMonthAndYear(messageDate, lastMessageDate)) {
        UI.chat.timeline.append(getDateTimeline(messageDate))
        lastMessageDate = messageDate;
      }

      UI.chat.timeline.append(getChatBubble(message.body, message.sentLocally));
    });

    UI.chat.timeline.scrollTop(UI.chat.timeline[0].scrollHeight);

    //For incoming messages
    recentMessageDate = lastMessageDate;
  })
}

function getDateTimeline(messageDate) {
  return $("<div></div>").text(isSameDayMonthAndYear(new Date(), messageDate) ? "Hoy" : `${messageDate.getDate()}/${messageDate.getMonth()}/${messageDate.getFullYear()}`).addClass("date-line")
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

function updateChattingWith(user_at, full_name = "Temp") {
  UI.chat.remoteJID.text(user_at);
  UI.chat.remoteName.text(full_name);
}


function sendMessage(event) {
  if (event.key === "Enter") {
    let msgBody = UI.chat.input.val();
    let date = new Date();
    
    console.log(window.xendAPI.sendMsg(chattingWith, msgBody));
    
    if(!isSameDayMonthAndYear(date, recentMessageDate)){
      UI.chat.timeline.append(getDateTimeline(date));
    }
    
    UI.chat.timeline.append(
      getChatBubble(msgBody, true)
    )
    
    recentMessageDate = date;
    
    UI.chat.input.val("");
    updateChatListItem(msgBody);
  }
}


function openNewChatModal() {
  $("#new-chat-modal").removeClass("modal-wrapper--hide");
}

function closeNewChatModal(og) {
  $(og).closest(".modal-wrapper").addClass("modal-wrapper--hide");
}

async function startNewChat(event) {
  event.preventDefault();
  let remoteJID = UI.newChatModal.jid.val();

  let list_item = $(`.chats_list_item[data-user="${remoteJID}"]`);
  //If the list item already exist, set the active status, if not, create it
  if (list_item.length) {
    swapActiveStatusChatListItem(list_item);
    //TODO:
  } else {
    let vCard = await window.xendAPI.getVCard(remoteJID);

    UI.chat.root.removeClass("chat--empty");
    UI.recentChats.prepend(
      getChatListItem(remoteJID, "", true, vCard.PHOTO)
    )
  }

  closeNewChatModal(event.target);

  //Load chat at the chat section
  updateChatUI(remoteJID);
  
  return false;
}

function loadSettings() {
  window.xendAPI.loadSettings();
}

function isSameDayMonthAndYear(date1, date2) {
  if(date1 === undefined ||date2 === undefined){
    return false;
  }

  return date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear();
}

function openProfileModal() {
  window.xendAPI.getVCard(chattingWith).then((vCard) => {

    UI.profileModal.photo.attr("src", `data:image/png;base64, ${vCard.PHOTO}`);
    UI.profileModal.desc.text(vCard.DESC);
    UI.profileModal.jid.text(chattingWith);
    UI.profileModal.fn.text(vCard.FN);
    $("#profile-modal").removeClass("modal-wrapper--hide");
  }).catch(console.error);
}

function fixMissingPFP(og) {
  let img = og.target ? og.target : og;
  img.src = "img/no_pfp.svg";
}

function updateChatListItem(msg) {
  $(".chats_list_item--active").find(".chats_list_item__info__msg").text(msg);
}

//main

window.xendAPI.addNewMessageHandler(onNewMessage);

//Load last chatted users
window.xendAPI.getLocalUserJID().then((userJID) => {
  UI.profileCard.userJID.text(userJID);
})

window.xendAPI.getLocalVCard().then(async (vCard) => {
  if (vCard.PHOTO) {
    UI.profileCard.userPhoto.attr("src", `data:image/png;base64, ${vCard.PHOTO}`);
  } else {

  }
  if (vCard.FN) {
    UI.profileCard.userName.text(vCard.FN);
  } else {
    let userJID = await window.xendAPI.getLocalUserJID()
    UI.profileCard.userName.text(userJID);
  }
})

window.xendAPI.getLastChattedUsers().then((chats) => {
  console.log(`Loaded ${chats.length} chat/s`);

  chats.forEach(chat => {
    if (chat.id != null) {
      UI.recentChats.prepend(
        getChatListItem(chat.remote_jid, chat.body, false)
      )
    }
  });
}).catch((err) => {
  console.error("Couldn't get last chats. " + err);
})

