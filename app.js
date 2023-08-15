import express from 'express';
import { config } from 'dotenv';
import errorMiddleware from './middlewares/Error.js';
import cookieParser from 'cookie-parser';

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
