const server = require('http').createServer();
const socket = require('socket.io')(server);

socket.on('connection', client => {
    console.log('******** 有链接了 ********');
    client.on('disconnect', ev => console.log('-------- 连接断开 ->', ev));

    client.on('log', (...msg) => {
        console.log(...msg);
    });
});

server.listen(4400, () => console.log('==== Server run at port::4400. ===='));
