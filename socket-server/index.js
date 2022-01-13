const app = require('express')();
const http = require('http').createServer(app);

//https://www.digitalocean.com/community/tutorials/angular-socket-io

// Initializing a new instance of socket.io
const io = require('socket.io')(http, {
  cors: {
    origins: ['http://localhost:4200'],
  },
});

const documents = {};

// Listening on the connection and disconnection events incoming sockets
io.on('connection', (socket) => {
  let previousId;

  // Takes care of joing and leaving rooms
  const safeJoin = (currentId) => {
    socket.leave(previousId);
    socket.join(currentId, () => console.log(`Socket ${socket.id} joined room ${currentId}`));
    previousId = currentId;
  };

  //  emit the document stored back to the client
  socket.on('getDoc', (docId) => {
    safeJoin(docId);
    socket.emit('document', documents[docId]);
  });

  //
  socket.on('addDoc', (doc) => {
    documents[doc.id] = doc;
    safeJoin(doc.id);

    // socket emit back to only initiating the client,
    // io emitting to everyone connected to the server.
    io.emit('documents', Object.keys(documents));
    socket.emit('document', doc);
  });

  socket.on('editDoc', (doc) => {
    documents[doc.id] = doc;
    socket.to(doc.id).emit('document', doc);

    console.log(`A user ${socket.id} has connected`);

    // broadcast to all the clients to ensure the new connection receives
    // the latest document changes
    io.emit('documents', Object.keys(documents));
  });


  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


// Starts the server on port 3000

http.listen(4444, () => {
  console.log('listening http on port 4444');
});
