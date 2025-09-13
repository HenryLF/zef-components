import Factory from "../src/index";
const todoHTML = /*html*/ `
  <div>
    <h2>Todo List</h2>
    <form>
      <input type="text">
      <button type="submit" >Add</button>
    </form>
    <ul for-loop="index,item in items">
    <li>
      <span>{{item.text}}</span>
      <button class="delete" index={{index}} >Delete</button>
    </li>
    </ul>
    <div if="test">
      yeah yeah yeah
    </div>
  </div>
`;

Factory("todo-list", todoHTML, {
  state: {
    items: [],
    test: false,
  },
  eventListener: {
    form: [
      {
        event: "submit",
        handler(e) {
          e.preventDefault();
          const input = this.$("input") as HTMLInputElement;
          this.state.items.unshift({ text: input.value });
          input.value = "";
          this.state.test = !this.state.test;
        },
      },
    ],
    ".delete": [
      {
        event: "click",
        handler(ev) {
          const idAttr = (ev.target as HTMLButtonElement).getAttribute("index");
          const id = parseInt(idAttr ?? "");
          this.state.items = this.state.items.filter((_, k) => k != id);
        },
      },
    ],
  },
});
