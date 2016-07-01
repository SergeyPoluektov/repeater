# repeater
Repeater used in vehicle and fuel monitoring systems.
Contains 2 parts:
1. Server emulator.
2. Pool of terminal emulators.
3. Web app.

Server emulator
  TCP-server, that gets data from terminals and puts in DB. At this moment support only Omnicomm FAS Protocol.
  
Pool of terminal emulators
  TCP-clients, that gets data from DB and sends to some telematics server.
  At the first time check DB on the storing some data. Creates terminal emulator if there is data. Terminal emulator periodically polls DB and tries to connect to telematics server for send data. When connection is established terminal emulator sends all data to telematics server and deletes them from DB.

Web app
  Based on ExpressJS. App shows data in table view in browser. For markup used Twitter Bootstrap. Data sending to page via webSockets by socket.io library. Uses events from NodeJS EventEmitter for notifying web app from server emulator and terminal emulators when data is changed.
