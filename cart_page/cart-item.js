import {OrderList, OrderItem} from '../utils/order-list.js'
import {MenuModel} from '../utils/menu_model.js'


const MAX_ITEM_AMOUNT = 50;


export class CartItemCard{
    /**
     * @param {OrderItem} orderItem 
     * @param {MenuModel} menuModel 
     * @param {OrderList} orderList 
     */
    constructor(orderItem, menuModel, orderList){
        this._menuModel = menuModel;
        this._orderList = orderList;
        
        this._orderItem = orderItem;
        this.itemID = orderItem.item_id;
        this.amount = orderItem.count;

        this._item_model = menuModel.get_item_model_by_id(this.itemID);
        this.name = this._item_model.name;
        this.cost = this._calcCost();
    }

    _calcCost(){
        let price = this._item_model.base_price;
        for (const option_name in this._orderItem.options){
            const option_model = this._menuModel.get_option_model_by_name(option_name);
            for (const option_value of this._orderItem.get_option_values_by_option_name(option_name)){
                price += option_model.get_variant_by_value(option_value).price_increase;
            }
        }
        return price;
    }

    createItemViewElement(){
        const itemTemplate = document.querySelector(".cart-form #item-template");
        const node = itemTemplate.content.cloneNode(true);
        node.querySelector(".item-name").textContent = this.name;

        node.querySelector(".remove-button").addEventListener('click', (ev) => this.onDeleteClicked(ev));

        const itemCounter = node.querySelector(".item-amount");
        itemCounter.setAttribute('value', String(this.amount));
        itemCounter.addEventListener('input', (ev) => this.onCountChanged(ev));
        
        node.querySelector('.itemID').setAttribute('value', String(this.itemID));
        node.querySelector('.itemOptions').setAttribute('value', JSON.stringify(this._orderItem.options));
        // console.log(node.querySelector('.itemOptions').getAttribute('value'));

        this.updateView(node);
        return node;
    }

    onCountChanged(event){
        const amount = event.target.value;
        if (amount > MAX_ITEM_AMOUNT || amount < 1){
            return;
        }
        this._orderItem.count = amount;
        this._orderList.setItem(this._orderItem);
        // console.log(amount);
        this.amount = amount;
        this.updateView(event.target.closest(".item-card"));
    }

    onDeleteClicked(event){
        // console.log("deleting");
        this._orderList.removeItem(this._orderItem);
        event.target.closest(".item-card").remove();
    }

    updateView(node){
        console.log(node);
        node.querySelector('.amount-of-items-view').textContent = String(this.amount);
        node.querySelector('.one-item-cost').textContent = String(this.cost);
        node.querySelector('.multi-item-cost').textContent = String(this.cost * this.amount);
    }
}