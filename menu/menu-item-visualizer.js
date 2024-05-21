export class MenuItemVisualizer {
    constructor(menuItem) {
        this.menuItem = menuItem;
        this.selectedOption = menuItem.options[0];
    }

    addToCart() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        let name = this.menuItem.name;
        if (this.selectedOption.option){
            name += `, ${this.selectedOption.option}`;
        }
        cart.push({ id: this.menuItem.id, name: name, price: this.selectedOption.price });
        localStorage.setItem('cart', JSON.stringify(cart));

        alert(`${name} добавлен в корзину`);
        console.log(localStorage.getItem('cart'));
        // localStorage.removeItem('cart');
    }

    visualize() {
        const menuItem = this.createMenuItemElement();
        const options = this.createOptionVisualization();

        menuItem
            .querySelector('.options-container')
            .appendChild(options);

        this.handleAddToCart(menuItem);
        if (options.className === 'option-select'){
            this.updatePriceOnChange(options, menuItem);
        }

        return menuItem;
    }

    handleAddToCart(menuItem){
        menuItem
            .querySelector('.add-to-cart-button')
            .addEventListener('click', () => this.addToCart());
    }

    updatePriceOnChange(selector, menuItem) {
        selector.addEventListener('change', () => {
            const selectedIndex = selector.selectedIndex;
            this.selectedOption = this.menuItem.options[selectedIndex];
            const newPrice = this.selectedOption.price;
            menuItem.querySelector('.price').textContent = `${newPrice} ₽`;
        });
    }

    createMenuItemElement() {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <img src="./menu-image/${this.menuItem.id}" alt="${this.menuItem.name}">
            <p class="name">${this.menuItem.name}</p>
            <div class="options-container"></div>
            <p class="price">${this.selectedOption.price} ₽</p>
            <button class="add-to-cart-button">Добавить в корзину</button>
        `;
        return menuItem;
    }


    createOptionVisualization() {
        if (Array.isArray(this.menuItem.options) && this.menuItem.options.length > 1) {
            return this.createSelector(this.menuItem.options);
        }

        const p = document.createElement('p');
        p.textContent = this.selectedOption.option;

        return p;
    }

    createSelector(options) {
        const selector = document.createElement('select');
        selector.className = 'option-select';

        options.forEach(menuItemOption => {
            const element = document.createElement('option');
            element.value = menuItemOption.option;
            element.textContent = menuItemOption.option;
            selector.appendChild(element);
        });

        return selector;
    }
}
