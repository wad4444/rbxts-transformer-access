# rbxts-transformer-access
Allows you to directly index a method without calling it,
allowing you to easily pass it to another function, reducing the boilerplate code:

```ts
import { Players } from "@rbxts/services";

class foo {
	private onPlayer(player: Player) {}
	private onInit() {
		Players.PlayerAdded.Connect(this.onPlayer);
	}
}
```

```ts
import { Players } from "@rbxts/services";

const foo = {
    bar() {}
}

Players.PlayerAdded.Connect(foo.bar)
```