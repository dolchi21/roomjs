import Peer from 'peerjs'
export interface RoomHostConnections {
    [key: string]: Peer.DataConnection
}
export interface RoomHostSubscriptions {
    [key: string]: RoomHostConnections
}
export type RoomHostEvent = 'open'|'close'
export interface RoomSendData {
    type: string
    payload?: any
    uuid?: any
}
export interface RoomTasks {
    [key: string]: RoomTask | undefined
}
export type RoomTask = (err: any, data?: any) => any