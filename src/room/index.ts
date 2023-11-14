import { Socket } from "socket.io";
import { v4 as uuidV4 } from "uuid";

const rooms: Record<string, string[]> = {}
const chats: Record<string, IMessage[]> = {}

interface IRoomParams {
    roomId: string;
    peerId: string;
}

interface IMessage {
    content: string;
    author?: string;
    timestamp: number;
}

export const roomHandler = (socket: Socket) => {
    const createRoom = ({ peerId }: { peerId: string }) => {
        const roomId = uuidV4()
        rooms[roomId] = []
        socket.emit('room-created', { roomId })
        joinRoom({ roomId, peerId });
    }
    const joinRoom = ({ roomId, peerId }: IRoomParams) => {
        if(!rooms[roomId]) rooms[roomId] = [];
        if(!chats[roomId]) chats[roomId] = [];

        rooms[roomId]?.push(peerId)
        socket.join(roomId)
        socket.to(roomId).emit('user-joined', { roomId, peerId })
        socket.emit('get-messages', chats[roomId])
        socket.emit('get-users-list', {
            roomId,
            participants: rooms[roomId],
        })

        socket.on("disconnect", () => {
            leaveRoom({ roomId, peerId })
        })
    }

    const startSharing = ({peerId, roomId}: IRoomParams) => {
        socket.to(roomId).emit('user-started-sharing', peerId)
    }

    const stopSharing = (roomId: string) => {
        socket.to(roomId).emit('user-stopped-sharing')
    }

    const leaveRoom = ({ roomId, peerId }: IRoomParams) => {
        rooms[roomId] = rooms[roomId]?.filter((peer) => peer !== peerId)
        socket.to(roomId).emit('user-disconnected', peerId)
    }

    const addMessage = (roomId: string, message: IMessage) => {
        if(chats[roomId]){
            chats[roomId].push(message)
        } else {
            chats[roomId] = [message]
        }
        socket.to(roomId).emit('add-message', message)
    }

    socket.on('create-room', createRoom)
    socket.on('join-room', joinRoom)
    socket.on('start-sharing', startSharing)
    socket.on('stop-sharing', stopSharing)
    socket.on('send-message', addMessage)
}