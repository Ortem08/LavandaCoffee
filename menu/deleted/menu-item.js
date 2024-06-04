export class MenuItem {
    constructor(id, name, options = [new MenuItemOption()]) {
        this.id = id;
        this.name = name;
        this.options = options;
    }
}

export class MenuItemOption {
    constructor(option = null, price = 0) {
        this.option = option;
        this.price = price;
    }
}
