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
app.use(
  cors({
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // whatever ports you used in frontend
  })
);
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
