import { OrderItem, RAW_CART_KEY  } from '../utils/order-list.js';
import { createTimeoutNotification } from '../utils/notification/notification-creator.js'

export class MenuItemVisualizer {
    constructor(menuItem, menuModel, orderList) {
        this.menuItem = menuItem;
        this.menuModel = menuModel;
        this.selectedOptions = new Map();
        this.orderList = orderList;

        this.initializeSelectedOptions();
    }

    initializeSelectedOptions() {
        this.menuItem.available_options_names.forEach(optionName => {
            const optionModel = this.menuModel.get_option_model_by_name(optionName);
            if (optionModel) {
                if (optionModel.multichoice) {
                    this.selectedOptions.set(optionModel.name, []);
                } else {
                    this.selectedOptions.set(optionModel.name, optionModel.get_default_variant());
                }
            }
        });
    }

    addToCart() {
        const options = {};
        this.selectedOptions.forEach((selectedOptions, optionName) => {
            if (Array.isArray(selectedOptions)) {
                options[optionName] = selectedOptions.map(option => option.value);
            } else {
                options[optionName] = [ selectedOptions.value ];
            }
        });

        const orderItem = new OrderItem(this.menuItem.item_id, options);
        this.orderList.addItem(orderItem);

        createTimeoutNotification(`Добавлено в корзину.`, `append-to-cart`);
    }



    visualize() {
        const menuItem = this.createMenuItemElement();
        const optionsContainer = menuItem.querySelector('.options-container');

        this.menuItem.available_options_names.forEach(optionName => {
            const optionModel = this.menuModel.get_option_model_by_name(optionName);
            if (optionModel) {
                const optionSelector = this.createSelector(optionModel);
                optionsContainer.appendChild(optionSelector);
            }
        });

        this.handleAddToCart(menuItem);
        this.updatePrice(menuItem);

        return menuItem;
    }

    handleAddToCart(menuItem) {
        menuItem.querySelector('.add-to-cart-button').addEventListener('click', () => this.addToCart());
    }

    createMenuItemElement() {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <div class="photo-holder">
                <img class="menu-item-image" src="./menu-image/${this.menuItem.image_name}" alt="${this.menuItem.name}">
            </div>
            <div class="menu-item-details">
                <p class="menu-item-name">${this.menuItem.name}</p>
                <div class="options-container"></div>
                <p class="menu-item-price">${this.menuItem.base_price} ₽</p>
                <button class="add-to-cart-button">Добавить в корзину</button>
            </div>
        `;
        return menuItem;
    }

    createSelector(optionModel) {
        const container = document.createElement('div');
        container.className = 'option-container';

        if (optionModel.multichoice) {
            this.createMultiChoiceOptions(optionModel, container);
        } else {
            container.classList.add('horizontal');
            this.createSingleChoiceOptions(optionModel, container);
        }

        return container;
    }

    createMultiChoiceOptions(optionModel, container) {
        optionModel.possible_variants.forEach(variant => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${variant.value}">
                <span>${variant.value}<br>(+${variant.price_increase} ₽)</span>
            `;
            label.querySelector('input').addEventListener('change', () => {
                this.updateSelectedOptions(optionModel, container);
                this.updatePrice(container.closest('.menu-item'));
            });

            container.appendChild(label);
        });
    }

    createSingleChoiceOptions(optionModel, container) {
        optionModel.possible_variants.forEach((variant, index) => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="radio" name="${optionModel.name}${this.menuItem.item_id}" value="${variant.value}" 
                    ${index === optionModel.default_variant_index ? 'checked' : ''}>
                <span>${variant.value}<br>(+${variant.price_increase} ₽)</span>
            `;
            label.querySelector('input').addEventListener('change', (event) => {
                this.updateSelectedOptions(optionModel, event.target.value);
                this.updatePrice(container.closest('.menu-item'));
            });

            container.appendChild(label);
        });
    }

    updateSelectedOptions(optionModel, containerOrValue) {
        if (optionModel.multichoice) {
            const selectedValues = Array.from(containerOrValue.querySelectorAll('input:checked')).map(input => input.value);
            const selectedVariants = selectedValues.map(value => optionModel.get_variant_by_value(value));
            this.selectedOptions.set(optionModel.name, selectedVariants);
        } else {
            const selectedVariant = optionModel.get_variant_by_value(containerOrValue);
            this.selectedOptions.set(optionModel.name, selectedVariant);
        }
    }

    updatePrice(menuItem) {
        let totalPrice = this.menuItem.base_price;

        this.selectedOptions.forEach(selectedOptions => {
            if (Array.isArray(selectedOptions)) {
                selectedOptions.forEach(option => {
                    totalPrice += option.price_increase;
                });
            } else {
                totalPrice += selectedOptions.price_increase;
            }
        });

        menuItem.querySelector('.menu-item-price').textContent = `${totalPrice} ₽`;
    }
}
