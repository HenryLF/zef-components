import Factory from "../../src/index";
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
  </div>
`;

Factory<{ items: { text: string }[] }>("todo-list", todoHTML, {
  state: {
    items: [],
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
