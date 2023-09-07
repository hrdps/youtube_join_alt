import express from 'express';
import { config } from 'dotenv';
import errorMiddleware from './middlewares/Error.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

config({
  path: './config/config.env',
});

const app = express();

//using Middlewares

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());

const corsOptions = {
  credentials: true,
  exposedHeaders: ['set-cookie'],
  origin: [
    'https://roaring-moxie-789c0e.netlify.app',
    'http://localhost:3000',
    'https://superlative-genie-3f162a.netlify.app',
  ],
  methods: 'GET, POST, PUT, DELETE',
  allowedHeaders:
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
};

app.use(cors(corsOptions));

// app.use('*', cors({ origin: true, credentials: true }));
// app.use(
//   cors({
//     credentials: true,
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     origin: true, // whatever ports you used in frontend
//   })
// );
//importing routes and controllers

import course from './routes/courseRoutes.js';
import user from './routes/userRoutes.js';
import payment from './routes/paymentRoute.js';
import other from './routes/otherRoute.js';

app.use('/api/v1', course);
app.use('/api/v1', user);
app.use('/api/v1', payment);
app.use('/api/v1', other);
app.get('/', (req, res) => {
  res.send(
    'Backend is working, click <a href="http://localhost:3000/" target="_blank">here</a> to access the frontend'
  );
});
export default app;

app.use(errorMiddleware);
