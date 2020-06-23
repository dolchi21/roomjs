import Peer from 'peerjs'

import * as Lib from './lib'
import Room from './Room'
import RoomHost from './RoomHost'

export default class RoomJS {
    peer: Peer
    constructor(peer: Peer) {
        this.peer = peer
    }
    async join(namespace: string) {
        const conn = await Lib.connectPeer(this.peer, namespace + '_host')
        return new Room(this.peer, conn)
    }
    static async host(namespace: string) {
        const host = await RoomHost.create(namespace)
        return host
    }
    static async joinAs(namespace: string, username: string) {
        const client = await RoomJS.login(namespace + '_user_' + username)
        return client.join(namespace)
    }
    static async login(username: string) {
        const peer = await Lib.createPeer(username)
        peer.on('error', err => {
            if (peer.disconnected) peer.reconnect()
        })
        return new RoomJS(peer)
    }
}
