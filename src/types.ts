import Peer from 'peerjs'

export type RoomTask = (err: any, data?: any) => any
export interface RoomSendData {
    type: string
    payload?: any
    uuid?: any
}
export interface RoomTasks {
    [key: string]: RoomTask | undefined
}
export interface RoomHostConnections {
    [key: string]: Peer.DataConnection
}
export interface RoomHostSubscriptions {
    [key: string]: RoomHostConnections
}