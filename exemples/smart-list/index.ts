import Factory from "../../src/index";

const smartListHTML = /*html */ `
<style>
.sort-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.list-wrapper {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  min-height: 200px;
}

.sort-btn {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(37, 117, 252, 0.2);
  display: block;
  margin: 0 auto;
}

.sort-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(37, 117, 252, 0.3);
}

.sort-btn:active {
  transform: translateY(0);
}

/* Animation for list items */
.list-wrapper > * {
  animation: fadeIn 0.5s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<div class="sort-container">
  <div class="list-wrapper">
    <slot></slot>
  </div>
  <button class="sort-btn">Sort</button>
  <input id="order" name="order" type="checkbox">
  <label for="order" re-render="ascending">{{ascending?'Ascending':'Descending'}}</label>
</div>
`;

function sortChild(
  parent: Node,
  childs: NodeListOf<Element>,
  reverse: boolean = false
) {
  const childArray = Array.from(childs);
  childArray.sort((a, b) => {
    const orderA = a.getAttribute("order") ?? a.textContent;
    const orderB = b.getAttribute("order") ?? b.textContent;
    return orderA < orderB ? 1 : -1;
  });
  if (reverse) childArray.reverse();
  childArray.forEach((el) => {
    parent.appendChild(el);
  });
}

Factory("smart-list", smartListHTML, {
  state: {
    ascending: false,
  },
  eventListener: {
    button: [
      {
        event: "click",
        handler() {
          const childs = this.querySelectorAll("*");
          sortChild(this, childs, this.state.ascending);
        },
      },
    ],
    "#order": [
      {
        event: "click",
        handler(ev) {
          const value = (ev.target as HTMLInputElement).checked;
          this.state.ascending = value;
        },
      },
    ],
  },
});
