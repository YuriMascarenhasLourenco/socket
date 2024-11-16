import { io, Socket } from 'socket.io-client';
import {JSDOM} from 'jsdom'
const socket: Socket = io();  

let username: string = '';
let userList: string[] = [];

const dom= new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>chat</title>
</head>
<body>
   
    <div class="page" id="loginPage">
        <h1>Qual seu nome?</h1>
        <input type="text" id="loginNameInput" placeholder="nome">
    </div>
    <div class="page" id="chatPage">
        <div class="chatArea">
            <ul class="chatList">
                
            </ul>
            <ul class="userList">
            </ul>
        </div>
        <div class="chatInput">
            <input type="text" id="chatTextInput" placeholder="digite uma mensagem ">
        </div>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script src="client.js"></script>
</body>
</html>`)

const document= dom.window.document

const loginPage = document.getElementById('loginPage') as HTMLElement;
const chatPage = document.getElementById('chatPage') as HTMLElement;

const loginInput = document.getElementById('loginNameInput') as HTMLInputElement;
const textInput = document.getElementById('chatTextInput') as HTMLInputElement;

console.log(loginInput)
loginPage.style.display = 'flex';
chatPage.style.display = 'none';


function renderUserList(): void {
    const ul = document.querySelector('.userList') as HTMLUListElement;
    ul.innerHTML = '';

    userList.forEach(user => {
        ul.innerHTML += `<li>${user}</li>`;
    });
}


function addMessage(type: 'status' | 'msg', user: string | null, msg: string): void {
    const ul = document.querySelector('.chatList') as HTMLUListElement;

    switch (type) {
        case 'status':
            ul.innerHTML += `<li class="m-status">${msg}</li>`;
            break;
        case 'msg':
            if (username === user) {
                ul.innerHTML += `<li class="m-txt"><span class="me">${user}</span> ${msg}</li>`;
            } else {
                ul.innerHTML += `<li class="m-txt"><span>${user}</span> ${msg}</li>`;
            }
            break;
    }

    ul.scrollTop = ul.scrollHeight;
}


loginInput.addEventListener('keyup', (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
        const name = loginInput.value.trim();
        if (name !== '') {
            username = name;
            document.title = `Chat (${username})`;
            socket.emit('join-request', username);
        }
    }
});


textInput.addEventListener('keyup', (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
        const txt = textInput.value.trim();
        textInput.value = '';

        if (txt !== '') {
            addMessage('msg', username, txt);
            socket.emit('send-msg', txt);
        }
    }
});


socket.on('user-ok', (list: string[]): void => {
    loginPage.style.display = 'none';
    chatPage.style.display = 'flex';
    textInput.focus();

    addMessage('status', null, 'Conectado!');
    userList = list;
    renderUserList();
});


socket.on('list-update', (data: { joined?: string, left?: string, list: string[] }): void => {
    if (data.joined) {
        addMessage('status', null, `${data.joined} entrou no chat.`);
    }

    if (data.left) {
        addMessage('status', null, `${data.left} saiu do chat.`);
    }

    userList = data.list;
    renderUserList();
});


socket.on('show-msg', (data: { username: string, message: string }): void => {
    addMessage('msg', data.username, data.message);
});


socket.on('disconnect', (): void => {
    addMessage('status', null, 'Você foi desconectado!');
    userList = [];
    renderUserList();
});


socket.on('reconnect_error', (): void => {
    addMessage('status', null, 'Tentando reconectar...');
});

socket.on('reconnect', (): void => {
    addMessage('status', null, 'Reconectado!');

    if (username !== '') {
        socket.emit('join-request', username);
    }
});
