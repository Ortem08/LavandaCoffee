import { MenuItemVisualizer } from './menu-item-visualizer.js';
import { MenuItem, MenuItemOption } from './menu-item.js';

const drinks = [
    new MenuItem(1, 'Кофе с лавандой фирменный', [
        new MenuItemOption('100 мл', 150),
        new MenuItemOption('200 мл', 200)
    ]),
    new MenuItem(2, 'Капучино', [
        new MenuItemOption('200 мл', 200)
    ]),
    new MenuItem(5, 'Кофе 3в1', [
        new MenuItemOption(null, 300)
    ])
];

const desserts = [
    new MenuItem(3, 'Шоколад', [
        new MenuItemOption('с клубникой', 200),
        new MenuItemOption('с лавандой', 250),
        new MenuItemOption('тёмный', 1000),
        new MenuItemOption('молочный', 10)
    ]),
    new MenuItem(4, 'Чизкейк', [
        new MenuItemOption('с голубикой', 350)
    ])
];


function generateMenuItems(section, items) {
    const container = document.getElementById(section);
    items.forEach(item => {
        const visualizer = new MenuItemVisualizer(item);
        container.appendChild(visualizer.visualize());
    });
}

document.addEventListener('DOMContentLoaded', () => {
    generateMenuItems('drinks', drinks);
    generateMenuItems('desserts', desserts);
});
