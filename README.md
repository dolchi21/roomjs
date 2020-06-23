# roomjs

### Usage
```js
import Room from '@dolchi21/roomjs'
```

### Host a room
```js
const room = await Room.host('looking-for-someone')
```

### Join a room
```js
// on browser0
const room = await Room.joinAs('looking-for-someone', 'Phil')
// on browser1
const room = await Room.joinAs('looking-for-someone', 'Peter')

// on any browser
await room.list() // ['Phil', 'Peter']
```
