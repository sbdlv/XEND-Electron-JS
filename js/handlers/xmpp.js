// module.exports = {
//     getVCard: async function (event) {
//         return await xmpp_connection.sendReceive(xml(
//             "iq",
//             {
//                 from: current_user_at,
//                 id: 'v3',
//                 to: user,
//                 type: "get"
//             },
//             xml(
//                 "vCard",
//                 {
//                     xmlns: 'vcard-temp'
//                 }
//             )
//         ));
//     }
// }