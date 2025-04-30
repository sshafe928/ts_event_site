// server.ts

import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Application = express();
const PORT: number = 5000;


type EventType = 'Workshop' | 'Conference' | 'Webinar' | 'Seminar'; 

interface Event {
    id: number;
    name: string;
    date: string;
    type: EventType | string; 
    attendees: number;
}

interface Attendee {
    name: string;
    email: string;
}

interface Registration {
    eventName: string;
    attendee: Attendee;
}

let Adminstatus = false;
const ADMIN = { username: 'admin_man', password: '1234' };

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Utility Functions
const eventsFilePath = join(__dirname, 'data', 'events.json');
const registrationFilePath = join(__dirname, 'data', 'registration.json');

const getEvents = (): Event[] => {
    const data = fs.readFileSync(eventsFilePath, 'utf8');
    return JSON.parse(data) as Event[];
};

const saveEvents = (events: Event[]): void => {
    fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));
};

// Routes

app.get('/', (req: Request, res: Response) => {
    const events = getEvents();
    res.render('pages/events', { events, isAdmin: Adminstatus });
});

app.get('/admin', (req: Request, res: Response) => {
    res.render('pages/admin');
});

app.get('/logout', (req: Request, res: Response) => {
    const events = getEvents();
    Adminstatus = false;
    res.render('pages/events', { isAdmin: Adminstatus, events });
});

app.post('/admin', (req: Request, res: Response) => {
    const { username, password }: { username: string; password: string } = req.body;

    if (username === ADMIN.username && password === ADMIN.password) {
        Adminstatus = true;
        res.redirect('/events');
    } else {
        res.send('Invalid credentials');
    }
});

app.get('/events', (req: Request, res: Response) => {
    const events = getEvents();
    res.render('pages/events', { isAdmin: Adminstatus, events });
});

app.post('/events/add', (req: Request, res: Response): void => {
    const events = getEvents();

    const newEvent: Event = {
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

app.get('/edits/:id/edit', (req: Request, res: Response): void => {
    const events = getEvents();
    const event = events.find(e => e.id === Number(req.params.id));
    res.render('pages/edits', { event });
});

app.post('/edits/:id', (req: Request, res: Response): void => {
    const events = getEvents();
    const eventIndex = events.findIndex(e => e.id === Number(req.params.id));

    if (eventIndex !== -1) {
        events[eventIndex] = {
            ...events[eventIndex],
            name: req.body.name,
            date: req.body.date,
            type: req.body.type,
            attendees: parseInt(req.body.attendees, 10) || 0
        };
        saveEvents(events);
    }

    res.redirect('/events');
});

app.post('/events/:id/delete', (req: Request, res: Response): void => {
    let events = getEvents();
    const idToDelete = parseInt(req.params.id, 10);
    events = events.filter(event => event.id !== idToDelete);
    saveEvents(events);
    res.redirect('/events');
});

app.post('/events', (req: Request, res: Response): void => {
    const { event, name, email } = req.body;

    if (!event || !name || !email) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const attendeeData: Registration = {
        eventName: event,
        attendee: {
            name,
            email
        }
    };

    fs.readFile(registrationFilePath, 'utf8', (err, fileContent) => {
        let registrationData: Registration[] = [];

        if (!err && fileContent) {
            registrationData = JSON.parse(fileContent) as Registration[];
        }

        registrationData.push(attendeeData);

        fs.writeFile(registrationFilePath, JSON.stringify(registrationData, null, 2), 'utf8', err => {
            fs.readFile(eventsFilePath, 'utf8', (err, eventsContent) => {
                let eventsData: Event[] = JSON.parse(eventsContent);

                const eventToUpdate = eventsData.find(e => e.name === event);
                if (eventToUpdate) {
                    eventToUpdate.attendees += 1;
                }

                fs.writeFile(eventsFilePath, JSON.stringify(eventsData, null, 2), 'utf8', err => {
                    res.redirect('/events');
                });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
