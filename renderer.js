let chatListItems = $("#chats_list_items");
let chattingWith = "";

console.log(chatListItems);

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
      $("<div></div>").append(
        $("<img/>").addClass("chats_list_item__pfp").attr("src", "img/pfp1.jpg"),
        $("<div></div>").append(
          $("<div></div>").addClass("chats_list_item__info__name").text("Temp name"),
          $("<div></div>").addClass("chats_list_item__info__msg").text(msg.body),
        ).addClass("chats_list_item__info")
      ).addClass("chats_list_item").attr("data-user", msg.from)
    )
  }

}

function changeChat(og) {
  $(".chats_list_item--active").removeClass("chats_list_item--active");

  chattingWith = $(og).addClass("chats_list_item--active").attr("data-user");
}

window.xendAPI.addNewMessageHandler(onNewMessage);