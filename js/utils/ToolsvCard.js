/**
 * 
 * @param {Array} iq 
 * @returns 
 */
function iqArrayToVCard(iq) {
    let vCard = {
        FN: "",
        DESC: "",
        PHOTO: "",
    };

    iq.forEach(vCardProp => {
        switch (vCardProp.name) {
            case "FN":
            case "DESC":
                vCard[vCardProp.name] = vCardProp.children[0];
                break;
            case "PHOTO":
                vCard["PHOTO"] = vCardProp.children[1].children[0]
                break;
        }
    });

    return vCard;

    // iq.forEach(vCardProp => {
    //     let propName = vCardProp.name;

    //     if (vCardProp.children.length > 1) {
    //         vCardProp.children.forEach(childProp => {
    //             if (childProp.children[0] !== undefined) {
    //                 vCard[propName][childProp.name] = childProp.children[0];
    //             }
    //         });
    //     } else {
    //         vCard[propName] = vCardProp.children[0]
    //     }
    // });

    // return vCard;
}

exports.iqArrayToVCard = iqArrayToVCard;