import {CartItemCard} from './cart-item.js';
import { create_menu_model, OptionVariant } from '../utils/menu_model.js';
import { OrderList, RAW_CART_KEY } from '../utils/order-list.js';


let a = new OrderList();
a.load();
// if (a.get_all_order_items().length === 0){
//     fill_in_test_values();
// }
// a = null;


create_menu_model().then(
    (menuModel) => {
        const order_list = new OrderList();
        order_list.load();
        for (const order_item of order_list.get_all_order_items()){
            addItemToItemList(new CartItemCard(order_item, menuModel, order_list));
        }
    }
);


function fill_in_test_values(){
    localStorage.setItem(RAW_CART_KEY, JSON.stringify([
        {
            "id": 42,
            "options" : {
                "volume_tier_small" : ["150 мл"],
                "topping" : ["Клюква"]
            }
        },
        {
            "id": 42,
            "options" : {
                "volume_tier_small" : ["150 мл"],
                "topping" : ["Клюква", "Шоколад"]
            }
        },
        {
            "id": 42,
            "options" : {
                "volume_tier_small" : ["150 мл"],
                "topping" : ["Клюква"]
            }
        }
    ]));
}


function addItemToItemList(card){
    const node = card.createItemViewElement();
    document.querySelector(".cart-form .item-list").appendChild(node);
}


