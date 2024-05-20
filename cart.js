
class ItemCard{
    constructor(itemID, name, cost, amount=1){
        this.itemID = itemID;
        this.name = name;
        this.cost = cost;
        this.amount = amount;

        this.addItemToItemList();
    }

    addItemToItemList(){
        const itemTemplate = document.querySelector(".cart-form #item-template");
        const node = itemTemplate.content.cloneNode(true);
        node.querySelector(".item-name").textContent = this.name;

        node.querySelector(".remove-button").addEventListener('click', (ev) => this.onDeleteClicked(ev));

        const itemCounter = node.querySelector(".item-amount");
        itemCounter.setAttribute('value', String(this.amount));
        itemCounter.addEventListener('input', (ev) => this.onCountChanged(ev));
        
        this.updateView(node);
        document.querySelector(".cart-form .item-list").appendChild(node);
    }

    onCountChanged(event){
        const amount = event.target.value;
        console.log(amount);
        this.amount = amount;
        this.updateView(event.target.closest(".item-card"));
    }

    onDeleteClicked(event){
        // console.log("deleting");
        event.target.closest(".item-card").remove();
    }

    updateView(node){
        console.log(node);
        node.querySelector('.amount-of-items-view').textContent = String(this.amount);
        node.querySelector('.one-item-cost').textContent = String(this.cost);
        node.querySelector('.multi-item-cost').textContent = String(this.cost * this.amount);
    }
}


const here = new ItemCard("kajfdh", "coffee for a dog", 1000, 12);

new ItemCard("kajfdh2", "coffee for a fish", 400, 2);

new ItemCard("kajfdh3", "coffee for a hooman", 10, 13);
