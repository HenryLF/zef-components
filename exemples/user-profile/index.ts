import Factory, { globalStore } from "../../src/index";

const userProfileHTML = /*html */ `
<style>
  status-icon {
        height: 100%;
        aspect-ratio: 1/1;
        min-width: 20px;
        display: inline-block;
      }
</style>
  <div>
    <div style="display: flex;align-items: center;justify-content:space-between;width:  30%;">
        <h2>{{name}}</h2>
        <!-- here we don't re-render status icon to preserve transition -->
        <status-icon online={{online}}> </status-icon> 
    </div>
    <p>Friends: {{user.friends}}</p>
    <p>Best Friend : {{bestFriend}}</p>
    <button class="update-status" re-render="online">{{online?'Disconnect':'Connect'}}</button>
  </div>
`;

const statusIconHTML = /*svg */ `
<!-- here only the style needs to change -->
<style re-render='status'>
    circle{
        fill : {{status?'green':'red'}}
    }
</style>
<!-- We can do CSS too !! -->
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" 
  style="transition: fill 400ms ease-in"
  />
</svg>
`;

Factory("status-icon", statusIconHTML, {
  noShadowRoot: true,
  props: {
    //we use the parser to retrieve a boolean
    status: "json::online",
  },
});

Factory("user-profile", userProfileHTML, {
  state: {
    online: false,
  },
  storeListener: {
    name: "user.name", //you can subscribe to store nested property
    user: "user", //or to the whole store and index it later
    bestFriend: "user.friends.0", //array element can be accessed via index
  },
  eventListener: {
    ".update-status": [
      {
        event: "click",
        handler() {
          this.state.online = !this.state.online;
          // we're updating the online prop 'manually' (which doesn't re-render)
          this.$("status-icon")?.setAttribute("online", this.state.online);
        },
      },
    ],
  },
});

globalStore.setState({
  user: {
    status: "Online",
    name: "Jane",
    friends: ["Marc", "John"],
  },
});
