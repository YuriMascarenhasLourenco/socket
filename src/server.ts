import express from 'express';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from  'dotenv'

dotenv.config()

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

server.listen(process.env.PORT,()=>{
    console.log('servidor rodando',process.env.PORT)
});

app.use(express.static(path.join(__dirname, '../public')));

declare module "socket.io" {
    interface Socket {
      username: string; // Defina a propriedade 'username' como string ou o tipo desejado
    }
  }

let connectedUsers:string[] = [];

io.on('connection', (socket) => {
    console.log('Conexão detectada...');

    if(socket.username){}
    socket.on('join-request', (username:string) => {
        socket.username = username;
        connectedUsers.push(username);
        console.log(connectedUsers);

        socket.emit('user-ok', connectedUsers);
        socket.broadcast.emit('list-update', {
            joined: username,
            list: connectedUsers,
        });
    });

    socket.on('disconnect', () => {
        connectedUsers = connectedUsers.filter(u => u !== socket.username);
        console.log(connectedUsers);

        socket.broadcast.emit('list-update', {
            left: socket.username,
            list: connectedUsers,
        });
    });

    socket.on('send-msg', (txt) => {
        const obj = {
            username: socket.username,
            message: txt,
        };

        socket.broadcast.emit('show-msg', obj);
    });
});
