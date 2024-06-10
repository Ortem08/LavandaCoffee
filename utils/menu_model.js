export async function create_menu_model(){
    return new MenuModel(await get_menu_list_map());
}


export class MenuModel{
    /**
     * @param {object} menu_list_map - big object from json file
     */
    constructor(menu_list_map){
        this._menu_list_map_raw = menu_list_map;
        
        this.option_models_map = new Map();
        this._fill_option_models_map(menu_list_map);
        
        this.item_models_map = new Map();
        this._fill_item_models_map(menu_list_map);
    }

    /**
     * @returns {ItemModel | undefined} undefined if item not found
     */
    get_item_model_by_id(item_id){
        return this.item_models_map.get(item_id);
    }

    /**
     * @returns {OptionModel | undefined} undefined if option not found
     */
    get_option_model_by_name(name){
        return this.option_models_map.get(name);
    }

    _fill_option_models_map(menu_list_map){
        for (const option_name in menu_list_map["options"]){
            this.option_models_map.set(option_name, new OptionModel(
                        option_name, menu_list_map["options"][option_name]
                ));
        }
    }

    _fill_item_models_map(menu_list_map){
        for (const item_obj of menu_list_map["menu_items"]){
            this.item_models_map.set(item_obj["id"], new ItemModel(item_obj));
        }
    }
}


export class ItemModel{
    constructor(json_obj){
        this.item_id = json_obj["id"];
        this.name = json_obj["name"];
        this.type = json_obj["type"];
        this.image_name = json_obj["image_name"];
        this.base_price = json_obj["base_price"];
        this.available_options_names = json_obj["available_options"];
    }
}

export class OptionModel{
    constructor(name, json_obj){
        this.name = name;
        this.default_variant = null;

        this.multichoice = false;
        if ("multichoice" in json_obj){
            this.multichoice = json_obj["multichoice"];
            this.default_variant = [];
        }
        
        this.possible_variants = [];
        for (const variant of json_obj["variants"]){
            this.possible_variants.push(new OptionVariant(variant["value"], variant["price_increase"]));
        }
        
        this.default_variant_index = null;
        if ("default_variant_ind" in json_obj){
            this.default_variant_index = json_obj["default_variant_ind"];
            this.default_variant = this.possible_variants[this.default_variant_index];
        }
    }

    /**
     * @returns {OptionVariant[]}
     */
    get_possible_variants(){
        return this.possible_variants;
    }

    /**
     * 
     * @returns {OptionVariant}
     */
    get_default_variant(){
        return this.default_variant;
    }

    /**
     * 
     * @param {*} value 
     * @returns {OptionVariant}
     */
    get_variant_by_value(value){
        for (const variant of this.possible_variants){
            if (variant.value === value){
                return variant;
            }
        }
        throw new Error(`value ${value} not found for option ${this.name}`);
        return null;
    }
}


export class OptionVariant{
    constructor(value, price_increase){
        this.value = value;
        this.price_increase = price_increase;
    }
}


let _menu_list_map_buffer = null;


async function get_menu_list_map(){
    if (_menu_list_map_buffer !== null){
        return _menu_list_map_buffer;
    }
    const res = await fetch('../menu/menu_list_map.json');
    if (!res.ok){
        throw new Error("failed fetching menu_list_map");
    }

    return await res.json();
}

