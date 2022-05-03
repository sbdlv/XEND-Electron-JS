let chatListItems = $("#chats_list_items");
let chattingWith = "";
let chattingWithName = $("#chatting-with-name");
let chattingWithAt = $("#chatting-with-at");
let chatTimeline = $("#chat__area__timeline");
let message_input = $("#message_input");

message_input.on("keypress", sendMessage);

function onNewMessage(event, msg) {
  //TODO: Manage to create/update chat list item and if it is current chat, append the new message bubble
  let list_item = $(`.chats_list_item[data-user="${msg.from}"]`);

  //Create or update list item
  if (list_item.length) {
    list_item.find(".chats_list_item__info__msg").text(msg.body);
    list_item.prependTo(chatListItems);
  } else {
    chatListItems.prepend(
      $("<button></button>").append(
        $("<img/>").addClass("chats_list_item__pfp").attr("src", "img/pfp1.jpg"),
        $("<div></div>").append(
          $("<div></div>").addClass("chats_list_item__info__name").text("Temp name"),
          $("<div></div>").addClass("chats_list_item__info__msg").text(msg.body),
        ).addClass("chats_list_item__info")
      ).addClass("chats_list_item").attr("data-user", msg.from).attr("onclick", "changeChat(this)")
    )
  }

  
  //If the message is from the current chattingWith, then show the message on the timeline
  if(chattingWith == msg.from){
    chatTimeline.append(
      getChatBubble(msg.body, false)
    )
  }
  
}

function changeChat(og) {
  chatTimeline.children().remove();

  $(".chats_list_item--active").removeClass("chats_list_item--active");

  chattingWith = $(og).addClass("chats_list_item--active").attr("data-user");

  let vCard = getVCard(chattingWith);

  chattingWithAt.text(chattingWith);
}

function getVCard(user_at) {

}

function getChatBubble(msg, isLocalMessage = false) {
  return $("<div></div>").text(msg).addClass("chat_bubble").addClass(isLocalMessage ? "" : "chat_bubble--remote");
}

window.xendAPI.addNewMessageHandler(onNewMessage);


setTimeout(async () => {
  console.log(await window.xendAPI.getVCard("usuario2@xend"));
}, 1000)


function updateChattingWith(user_at, full_name = "Temp") {
  chattingWithAt.text(user_at);
  chattingWithName.text(full_name);
}


function sendMessage(event) {
  if(event.key === "Enter"){
    console.log(window.xendAPI.sendMsg(chattingWith, message_input.val())); 
    chatTimeline.append(
      getChatBubble(message_input.val(), true)
    )
  }
}