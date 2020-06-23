import Peer from 'peerjs'
import { EventEmitter } from 'events'

import * as Lib from './lib'
import { RoomTasks, RoomSendData } from './types'

export default class Room extends EventEmitter {
    peer: Peer
    conn: Peer.DataConnection
    tasks: RoomTasks
    constructor(peer: Peer, conn: Peer.DataConnection) {
        super()
        this.peer = peer
        this.tasks = {}
        this.conn = conn
        this.setConnection(conn)
    }
    setConnection(conn: Peer.DataConnection) {
        this.conn = conn
        this.conn.on('error', err => {
            console.error('room', conn.label, err)
        })
        this.conn.on('data', data => {
            switch (data.type) {
                case 'LIST': {
                    return this.emit('peers', data.payload)
                }
                case 'NEW_PEER': {
                    return this.emit('peer.new', data.payload)
                }
                case 'RESPONSE': {
                    const cb = this.tasks[data.uuid]
                    if (!cb) return
                    cb(null, data.payload)
                    this.tasks[data.uuid] = undefined
                    delete this.tasks[data.uuid]
                    return
                }
                case 'RESPONSE/ERROR': {
                    const cb = this.tasks[data.uuid]
                    if (!cb) return
                    cb(data.error)
                    this.tasks[data.uuid] = undefined
                    delete this.tasks[data.uuid]
                    return
                }
                default: return
            }
        })
        return new Promise<Peer.DataConnection>(resolve => {
            if (conn.open) return resolve(conn)
            conn.on('open', () => resolve(conn))
        })
    }
    getConnection() {
        return this.conn
    }
    async reconnect() {
        const conn = await Lib.connectPeer(this.peer, this.conn.peer)
        await this.setConnection(conn)
    }
    list() {
        return this.send<string[]>({ type: 'LIST' })
    }
    ping() {
        const start = Date.now()
        return this.send({ type: 'PING' }).then(ts => {
            const end = Date.now()
            console.log(start, ts, end)
            return end - start
        })
    }
    async send<T>(data: RoomSendData) {
        if (!this.conn.open) await this.reconnect()
        return new Promise<T>((resolve, reject) => {
            data.uuid = Date.now()
            this.conn.send(data)
            this.tasks[data.uuid] = (err: Error, res: T) => {
                err ? reject(err) : resolve(res)
            }
        })
    }
    subscribe(event: string) {
        const unsub = () => this.send({ type: 'UNSUBSCRIBE', payload: event })
        return this.send({ type: 'SUBSCRIBE', payload: event }).then(() => unsub)
    }
}