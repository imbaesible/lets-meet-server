import { Socket } from "socket.io";
import { v4 as uuidV4 } from "uuid";

const rooms: Record<string, string[]> = {}

interface IRoomParams {
    roomId: string;
    peerId: string;
}

export const roomHandler = (socket: Socket) => {
    const createRoom = ({ peerId }: { peerId: string }) => {
        const roomId = uuidV4()
        rooms[roomId] = []
        socket.emit('room-created', { roomId })
        joinRoom({ roomId, peerId });
    }
    const joinRoom = ({ roomId, peerId }: IRoomParams) => {
        if(rooms[roomId]){
            rooms[roomId].push(peerId)
            socket.join(roomId)
            socket.to(roomId).emit('user-joined', { roomId, peerId })
            socket.emit('get-users-list', {
                roomId,
                participants: rooms[roomId],
            })
        } else {
            createRoom({ peerId });
        }

        socket.on("disconnect", () => {
            leaveRoom({ roomId, peerId })
        })
    }

    const leaveRoom = ({ roomId, peerId }: IRoomParams) => {
        rooms[roomId] = rooms[roomId]?.filter((peer) => peer !== peerId)
        socket.to(roomId).emit('user-disconnected', peerId)
    }

    socket.on('create-room', createRoom)
    socket.on('join-room', joinRoom)
}