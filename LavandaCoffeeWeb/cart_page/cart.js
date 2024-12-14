import {CartItemCard} from './cart-item.js';
import { create_menu_model } from '../utils/menu_model.js';
import { OrderList, RAW_CART_KEY } from '../utils/order-list.js';

create_menu_model().then(
    (menuModel) => {
        const order_list = new OrderList();
        order_list.load();
        for (const order_item of order_list.get_all_order_items()){
            addItemToItemList(new CartItemCard(order_item, menuModel, order_list));
        }

        window.dispatchEvent(new CustomEvent('cartLoad'));
    }
);

function addItemToItemList(card){
    const node = card.createItemViewElement();
    document.querySelector(".cart-form .item-list").appendChild(node);
}


