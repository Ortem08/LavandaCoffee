import { MenuItemVisualizer } from './menu-item-visualizer.js';
import { create_menu_model } from '../utils/menu_model.js';
import { OrderList } from "../utils/order-list.js";

const ORDER_LIST = new OrderList();
ORDER_LIST.load();

function splitByType(menuModel) {
    const drinks = [];
    const desserts = [];

    menuModel.item_models_map.forEach((item) => {
        if (item.type === 'drink') {
            drinks.push(item);
        } else if (item.type === 'dessert') {
            desserts.push(item);
        }
    });

    return { drinks, desserts };
}

function generateMenuItems(section, items, menuModel) {
    const container = document.getElementById(section);
    items.forEach(item => {
        const visualizer = new MenuItemVisualizer(item, menuModel, ORDER_LIST);
        container.appendChild(visualizer.visualize());
    });
}

async function initializeMenu() {
    const menuModel = await create_menu_model();

    const { drinks, desserts } = splitByType(menuModel);

    generateMenuItems('drinks', drinks, menuModel);
    generateMenuItems('desserts', desserts, menuModel);
}

document.addEventListener('DOMContentLoaded', initializeMenu);
