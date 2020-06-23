import Peer from 'peerjs'

export function awaitEvent<T>(eventName: string, emitter: any) {
    return new Promise<T>(resolve => {
        const onEvent = (data: T) => {
            resolve(data)
            emitter.off(eventName, onEvent)
        }
        emitter.on(eventName, onEvent)
    })
}
export async function connectPeer(peer: Peer, id: string) {
    return new Promise<Peer.DataConnection>((resolve, reject) => {
        const conn = peer.connect(id)
        conn.on('error', reject)
        conn.on('open', () => resolve(conn))
    })
}
export async function createPeer(id: string) {
    return new Promise<Peer>((resolve, reject) => {
        const peer = new Peer(id)
        peer.on('error', reject)
        peer.on('open', id => resolve(peer))
    })
}
