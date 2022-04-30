let chatListItems = $("#chats_list_items");
let chattingWith = "";
let chattingWithName = $("#chatting-with-name");
let chattingWithAt = $("#chatting-with-at");
let chatTimeline = $("#chat__area__timeline");

function chat(msg) {
  console.log(window.xendAPI.chatWith("usuario2", msg));
}

function onNewMessage(event, msg) {
  //TODO: Manage to create/update chat list item and if it is current chat, append the new message bubble
  let list_item = $(`.chats_list_item[data-user="${msg.from}"]`);

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

}

function changeChat(og) {
  $(".chats_list_item--active").removeClass("chats_list_item--active");

  chattingWith = $(og).addClass("chats_list_item--active").attr("data-user");

  let vCard = getVCard(chattingWith);

  chattingWithAt.text(chattingWith);

  chatTimeline.children().remove();
}

function getVCard(user_at) {
  
}

window.xendAPI.addNewMessageHandler(onNewMessage);


setTimeout(async()=>{
  console.log(await window.xendAPI.getVCard("usuario2@xend"));
}, 1000)