import Peer from 'peerjs'
import * as Lib from './lib'
import { EventEmitter } from 'events'
import { RoomHostConnections, RoomHostSubscriptions } from './types'

function initialSubscriptions(): RoomHostSubscriptions {
    return {
        'peer.new': {}
    }
}
export default class RoomHost extends EventEmitter {
    peer: Peer
    connections: RoomHostConnections = {}
    subscriptions: RoomHostSubscriptions = initialSubscriptions()
    constructor(peer: Peer) {
        super()
        this.peer = peer
        this.setPeer(peer)
    }
    setPeer(peer: Peer) {
        this.peer = peer
        this.connections = {}
        this.subscriptions = initialSubscriptions()
        this.peer.on('connection', async conn => {
            await Lib.awaitEvent('open', conn)
            this.connections[conn.peer] = conn
            conn.on('close', () => {
                delete this.connections[conn.peer]
                this.emit('connection.close', conn)
            })
            conn.on('error', (error) => {
                error.connection = conn
                this.emit('connection.error', error)
            })
            conn.on('open', () => this.emit('connection.open', conn))
            this.onNewPeer(conn.peer)
            conn.on('data', data => {
                switch (data.type) {
                    case 'LIST': {
                        const peers = Object.keys(this.connections)
                        return conn.send({
                            type: 'RESPONSE', uuid: data.uuid,
                            payload: peers
                        })
                    }
                    case 'PING': {
                        return conn.send({
                            type: 'RESPONSE', uuid: data.uuid,
                            payload: Date.now()
                        })
                    }
                    case 'SUBSCRIBE': {
                        try {
                            const eventName = data.payload
                            this.subscriptions[eventName][conn.peer] = conn
                            return conn.send({
                                type: 'RESPONSE', uuid: data.uuid,
                                payload: Date.now()
                            })
                        } catch (err) { return }
                    }
                    case 'UNSUBSCRIBE': {
                        try {
                            const eventName = data.payload
                            delete this.subscriptions[eventName][conn.peer]
                            return conn.send({
                                type: 'RESPONSE', uuid: data.uuid,
                                payload: Date.now()
                            })
                        } catch (err) { return }
                    }
                }
            })
        })
    }
    onNewPeer(peerId: string) {
        Object.values(this.subscriptions['peer.new']).forEach(conn => {
            if (!conn.open) return
            conn.send({ type: 'NEW_PEER', payload: peerId })
        })
    }
    broadcast(message: any) {
        Object.values(this.connections).forEach(conn => {
            conn.send(message)
        })
    }
    static async create(namespace: string) {
        const peer = await Lib.createPeer(namespace + '_host')
        return new RoomHost(peer)
    }
}
