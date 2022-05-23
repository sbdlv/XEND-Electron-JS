/**
 * 
 * @param {Array} iq 
 * @returns 
 */
function iqArrayToVCard(iq) {
    let vCard = {};

    iq.forEach(vCardProp => {
        let propName = vCardProp.name;

        if (vCardProp.children.length > 1) {
            vCardProp.children.forEach(childProp => {
                if (childProp.children[0] !== undefined) {
                    vCard[propName][childProp.name] = childProp.children[0];
                }
            });
        } else {
            vCard[propName] = vCardProp.children[0]
        }
    });

    return vCard;
}

exports.iqArrayToVCard = iqArrayToVCard;