const express = require("express");
const cors = require("cors");
require("dotenv-safe").config({ allowEmptyValues: false, example: undefined });
const mongoose = require("mongoose");
const UserModel = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const Ticket = require("./models/Ticket");
const Event = require("./models/Event");
const Joi = require("joi");

const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET;

app.set('trust proxy', 1);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(helmet());
app.use(hpp());
// request id for correlation
app.use((req, _res, next) => {
  req.id = crypto.randomUUID();
  next();
});
morgan.token('id', (req) => req.id);
app.use(morgan(process.env.NODE_ENV === 'production' ? ':id :method :url :status :res[content-length] - :response-time ms' : ':id :method :url :status :response-time ms'));

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

// Dev-friendly CORS: allow any localhost or 127.0.0.1 origin (any port)
function isDevLocalOrigin(origin) {
  try {
    const url = new URL(origin);
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

app.use(
   cors({
      credentials: true,
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || isDevLocalOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
   })
);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });
const createEventLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });
const likeLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 60 });
const ticketsLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30 });
app.use(['/login','/register'], authLimiter);

mongoose.connect(process.env.MONGO_URL);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, uploadsDir);
   },
   filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, unique + '-' + safeName);
   },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type'));
  }
});

app.get("/test", (req, res) => {
   res.json("test ok");
});

// Liveness
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness: check db connection
app.get('/readyz', async (_req, res) => {
  try {
    const state = mongoose.connection.readyState; // 1 connected
    if (state === 1) return res.status(200).json({ db: 'connected' });
    return res.status(503).json({ db: 'not_connected', state });
  } catch (e) {
    return res.status(503).json({ db: 'error' });
  }
});

const registerSchema = {
  validate: (body) => {
    const schema = Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/[A-Z]/)
        .pattern(/[a-z]/)
        .pattern(/[0-9]/)
        .pattern(/[^A-Za-z0-9]/)
        .required(),
    });
    return schema.validate(body);
  }
};

app.post("/register", async (req, res) => {
   const { error, value } = registerSchema.validate(req.body);
   if (error) return res.status(400).json({ error: error.message });
   const { name, email, password } = value;

   try {
      const userDoc = await UserModel.create({
         name,
         email,
         password: bcrypt.hashSync(password, bcryptSalt),
      });
      res.json(userDoc);
   } catch (e) {
      res.status(422).json(e);
   }
});

const loginSchema = {
  validate: (body) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required(),
    });
    return schema.validate(body);
  }
};

app.post("/login", async (req, res) => {
   const { error, value } = loginSchema.validate(req.body);
   if (error) return res.status(400).json({ error: error.message });
   const { email, password } = value;

   const userDoc = await UserModel.findOne({ email });

   if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
   }

   const passOk = bcrypt.compareSync(password, userDoc.password);
   if (!passOk) {
      return res.status(401).json({ error: "Invalid password" });
   }

  jwt.sign(
      {
         email: userDoc.email,
         id: userDoc._id,
      },
      jwtSecret,
      { expiresIn: '1h' },
      (err, token) => {
         if (err) {
            return res.status(500).json({ error: "Failed to generate token" });
         }
         res
           .cookie("token", token, {
             httpOnly: true,
             secure: process.env.NODE_ENV === 'production',
             sameSite: 'strict',
             maxAge: 60 * 60 * 1000,
           })
           .json(userDoc);
      }
   );
});

app.get("/profile", (req, res) => {
   const { token } = req.cookies;
   if (token) {
      jwt.verify(token, jwtSecret, {}, async (err, userData) => {
         if (err) throw err;
         const { name, email, _id } = await UserModel.findById(userData.id);
         res.json({ name, email, _id });
      });
   } else {
      res.json(null);
   }
});

app.post("/logout", (req, res) => {
   res.clearCookie("token", {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'strict'
   }).json(true);
});

// Using Event model from models/Event

const createEventSchema = {
  validate: (body) => {
    const schema = Joi.object({
      owner: Joi.string().required(),
      title: Joi.string().min(3).max(150).required(),
      description: Joi.string().min(10).required(),
      organizedBy: Joi.string().required(),
      eventDate: Joi.date().iso().required(),
      eventTime: Joi.string().required(),
      location: Joi.string().required(),
      Participants: Joi.number().integer().min(0),
      Count: Joi.number().integer().min(0),
      Income: Joi.number().min(0),
      ticketPrice: Joi.number().min(0).required(),
      Quantity: Joi.number().integer().min(0),
      likes: Joi.number().integer().min(0),
      Comment: Joi.array().items(Joi.string()),
    });
    return schema.validate(body);
  }
};

app.post("/createEvent", createEventLimiter, upload.single("image"), async (req, res) => {
   try {
      const eventData = req.body;
      const { error } = createEventSchema.validate(eventData);
      if (error) return res.status(400).json({ error: error.message });
      eventData.image = req.file ? req.file.path : "";
      const newEvent = new Event(eventData);
      await newEvent.save();
      res.status(201).json(newEvent);
   } catch (error) {
      res.status(500).json({ error: "Failed to save the event to MongoDB" });
   }
});

app.get("/createEvent", async (req, res) => {
   try {
      const events = await Event.find();
      res.status(200).json(events);
   } catch (error) {
      res.status(500).json({ error: "Failed to fetch events from MongoDB" });
   }
});

app.get("/event/:id", async (req, res) => {
   const { id } = req.params;
   if (!mongoose.Types.ObjectId.isValid(id)) {
     return res.status(400).json({ error: "Invalid event id" });
   }
   try {
      const event = await Event.findById(id);
      res.json(event);
   } catch (error) {
      res.status(500).json({ error: "Failed to fetch event from MongoDB" });
   }
});

app.post("/event/:eventId", likeLimiter, async (req, res, next) => {
   try {
     const { eventId } = req.params;
     if (!mongoose.Types.ObjectId.isValid(eventId)) {
       return res.status(400).json({ error: "Invalid event id" });
     }
     const updated = await Event.findByIdAndUpdate(
       eventId,
       { $inc: { likes: 1 } },
       { new: true }
     );
     if (!updated) return res.status(404).json({ message: 'Event not found' });
     res.json(updated);
   } catch (err) {
     next(err);
   }
});

app.get("/events", (req, res) => {
   Event.find()
      .then((events) => {
         res.json(events);
      })
      .catch((error) => {
         console.error("Error fetching events:", error);
         res.status(500).json({ message: "Server error" });
      });
});

app.get("/event/:id/ordersummary", async (req, res) => {
   const { id } = req.params;
   if (!mongoose.Types.ObjectId.isValid(id)) {
     return res.status(400).json({ error: "Invalid event id" });
   }
   try {
      const event = await Event.findById(id);
      res.json(event);
   } catch (error) {
      res.status(500).json({ error: "Failed to fetch event from MongoDB" });
   }
});

app.get("/event/:id/ordersummary/paymentsummary", async (req, res) => {
   const { id } = req.params;
   if (!mongoose.Types.ObjectId.isValid(id)) {
     return res.status(400).json({ error: "Invalid event id" });
   }
   try {
      const event = await Event.findById(id);
      res.json(event);
   } catch (error) {
      res.status(500).json({ error: "Failed to fetch event from MongoDB" });
   }
});

const createTicketSchema = {
  validate: (body) => {
    const schema = Joi.object({
      userid: Joi.string().required(),
      eventid: Joi.string().required(),
      ticketDetails: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        eventname: Joi.string().required(),
        eventdate: Joi.date().iso().required(),
        eventtime: Joi.string().required(),
        ticketprice: Joi.number().min(0).required(),
        qr: Joi.string().required(),
      }).required(),
      count: Joi.number().integer().min(0).default(0),
    });
    return schema.validate(body);
  }
};

app.post("/tickets", ticketsLimiter, async (req, res) => {
   try {
      const { error, value } = createTicketSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.message });
      const newTicket = new Ticket(value);
      await newTicket.save();
      return res.status(201).json({ ticket: newTicket });
   } catch (error) {
      console.error("Error creating ticket:", error);
      return res.status(500).json({ error: "Failed to create ticket" });
   }
});

app.get("/tickets/:id", async (req, res) => {
   try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ticket id" });
      }
      const ticket = await Ticket.findById(id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      res.json(ticket);
   } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
   }
});

app.get("/tickets/user/:userId", (req, res) => {
   const userId = req.params.userId;

   Ticket.find({ userid: userId })
      .then((tickets) => {
         res.json(tickets);
      })
      .catch((error) => {
         console.error("Error fetching user tickets:", error);
         res.status(500).json({ error: "Failed to fetch user tickets" });
      });
});

app.delete("/tickets/:id", async (req, res) => {
   try {
      const ticketId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return res.status(400).json({ error: "Invalid ticket id" });
      }
      await Ticket.findByIdAndDelete(ticketId);
      res.status(204).send();
   } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ error: "Failed to delete ticket" });
   }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});

// Centralized error handler (must be last)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.id}]`, err);
  }
  res.status(status).json({ error: message, requestId: req.id });
});
