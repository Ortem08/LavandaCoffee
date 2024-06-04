export const RAW_CART_KEY = 'cart';
const PROCESSED_CART_KEY = "cart_processed";


/**
 * can be used to store orders in localStorage
 */
export class OrderList{
    constructor(){
        this.orderItemsMap = new Map();
    }

    load(){
        const counted_values_list = this._loadList(PROCESSED_CART_KEY);

        for (const item_obj of counted_values_list){
            const order_item = new OrderItem(item_obj["id"], item_obj["options"], item_obj["count"]);
            const identifier = order_item.stringify_without_count();
            if (this.orderItemsMap.has(identifier)){
                this.orderItemsMap.get(identifier).count += order_item.count;
                continue;
            }
            this.orderItemsMap.set(identifier, order_item);
        }

        const not_counted_values_list = this._loadList(RAW_CART_KEY);

        for (const item_obj of not_counted_values_list){
            const order_item = new OrderItem(item_obj["id"], item_obj["options"]);
            const identifier = order_item.stringify_without_count();
            if (this.orderItemsMap.has(identifier)){
                this.orderItemsMap.get(identifier).count += order_item.count;
                continue;
            }
            this.orderItemsMap.set(identifier, order_item);
        }

        this._clear_local_storage(RAW_CART_KEY);
        this.save();
    }

    /**
     * automatically saved, no need in calling this manually (usually)
     */
    save(){
        const counted_list = [];
        for (let [_, order_item] of this.orderItemsMap){
            counted_list.push(order_item.to_obj());
        }
        localStorage.setItem(PROCESSED_CART_KEY, JSON.stringify(counted_list));
    }

    clear_all(){
        this._clear_local_storage(RAW_CART_KEY);
        this._clear_local_storage(PROCESSED_CART_KEY);
    }

    /**
     * if item like this exists, their counts are added together
     * @param {OrderItem} order_item
     * @returns
     */
    addItem(order_item){
        if (!order_item instanceof OrderItem){
            throw new Error('type of order_item must be OrderItem');
        }
        const identifier = order_item.stringify_without_count();
        if (this.orderItemsMap.has(identifier)){
            this.orderItemsMap.get(identifier).count += order_item.count;
            return;
        }
        this.orderItemsMap.set(identifier, order_item);
        this.save();
    }

    /**
     * if item like this exists, it will be replaced
     * @param {OrderItem} order_item 
     */
    setItem(order_item){
        if (!order_item instanceof OrderItem){
            throw new Error('type of order_item must be OrderItem');
        }
        const identifier = order_item.stringify_without_count();
        this.orderItemsMap.set(identifier, order_item);
        this.save();
    }

    removeItem(order_item){
        if (!order_item instanceof OrderItem){
            throw new Error('type of order_item must be OrderItem');
        }
        const identifier = order_item.stringify_without_count();
        this.orderItemsMap.delete(identifier);
        this.save();
    }

    /**
     * @returns {OrderItem[]}
     */
    get_all_order_items(){
        const result = [];
        for (let [_, order_item] of this.orderItemsMap){
            result.push(order_item);
        }
        return result;
    }

    _clear_local_storage(key){
        localStorage.removeItem(key);
    }

    _loadList(key){
        const list_string = localStorage.getItem(key);
        // console.log(list_string);
        if (list_string === null){
            return [];
        }
        return JSON.parse(list_string);
    }
}

export class OrderItem{
    constructor(item_id, options, count=1){
        this.item_id = item_id;
        this.options = options;
        this.count = count;
    }

    to_obj(){
        return {
            "id" : this.item_id, 
            "options" : this.options,
            "count" : this.count
        }
    }

    stringify_without_count(){
        return JSON.stringify({
            "id" : this.item_id, 
            "options" : this.options
        });
    }

    get_option_values_by_option_name(option_name){
        return this.options[option_name];
    }
}


