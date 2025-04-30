"use strict";
// server.ts
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var body_parser_1 = require("body-parser");
var fs = require("fs");
var url_1 = require("url");
var path_1 = require("path");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_1.dirname)(__filename);
var app = (0, express_1.default)();
var PORT = 5000;
var Adminstatus = false;
var ADMIN = { username: 'admin_man', password: '1234' };
// Middleware
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use('/public', express_1.default.static((0, path_1.join)(__dirname, 'public')));
app.set('view engine', 'ejs');
// Utility Functions
var eventsFilePath = (0, path_1.join)(__dirname, 'data', 'events.json');
var registrationFilePath = (0, path_1.join)(__dirname, 'data', 'registration.json');
var getEvents = function () {
    var data = fs.readFileSync(eventsFilePath, 'utf8');
    return JSON.parse(data);
};
var saveEvents = function (events) {
    fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));
};
// Routes
app.get('/', function (req, res) {
    var events = getEvents();
    res.render('pages/events', { events: events, isAdmin: Adminstatus });
});
app.get('/admin', function (req, res) {
    res.render('pages/admin');
});
app.get('/logout', function (req, res) {
    var events = getEvents();
    Adminstatus = false;
    res.render('pages/events', { isAdmin: Adminstatus, events: events });
});
app.post('/admin', function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password;
    if (username === ADMIN.username && password === ADMIN.password) {
        Adminstatus = true;
        res.redirect('/events');
    }
    else {
        res.send('Invalid credentials');
    }
});
app.get('/events', function (req, res) {
    var events = getEvents();
    res.render('pages/events', { isAdmin: Adminstatus, events: events });
});
app.post('/events/add', function (req, res) {
    var events = getEvents();
    var newEvent = {
        id: events.length + 1,
        name: req.body.name,
        date: req.body.date,
        type: req.body.type,
        attendees: parseInt(req.body.attendees, 10) || 0
    };
    events.push(newEvent);
    saveEvents(events);
    res.redirect('/events');
});
app.get('/edits/:id/edit', function (req, res) {
    var events = getEvents();
    var event = events.find(function (e) { return e.id === Number(req.params.id); });
    res.render('pages/edits', { event: event });
});
app.post('/edits/:id', function (req, res) {
    var events = getEvents();
    var eventIndex = events.findIndex(function (e) { return e.id === Number(req.params.id); });
    if (eventIndex !== -1) {
        events[eventIndex] = __assign(__assign({}, events[eventIndex]), { name: req.body.name, date: req.body.date, type: req.body.type, attendees: parseInt(req.body.attendees, 10) || 0 });
        saveEvents(events);
    }
    res.redirect('/events');
});
app.post('/events/:id/delete', function (req, res) {
    var events = getEvents();
    var idToDelete = parseInt(req.params.id, 10);
    events = events.filter(function (event) { return event.id !== idToDelete; });
    saveEvents(events);
    res.redirect('/events');
});
app.post('/events', function (req, res) {
    var _a = req.body, event = _a.event, name = _a.name, email = _a.email;
    if (!event || !name || !email) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    var attendeeData = {
        eventName: event,
        attendee: {
            name: name,
            email: email
        }
    };
    fs.readFile(registrationFilePath, 'utf8', function (err, fileContent) {
        var registrationData = [];
        if (!err && fileContent) {
            registrationData = JSON.parse(fileContent);
        }
        registrationData.push(attendeeData);
        fs.writeFile(registrationFilePath, JSON.stringify(registrationData, null, 2), 'utf8', function (err) {
            fs.readFile(eventsFilePath, 'utf8', function (err, eventsContent) {
                var eventsData = JSON.parse(eventsContent);
                var eventToUpdate = eventsData.find(function (e) { return e.name === event; });
                if (eventToUpdate) {
                    eventToUpdate.attendees += 1;
                }
                fs.writeFile(eventsFilePath, JSON.stringify(eventsData, null, 2), 'utf8', function (err) {
                    res.redirect('/events');
                });
            });
        });
    });
});
app.listen(PORT, function () {
    console.log("Server is listening on port ".concat(PORT));
});
