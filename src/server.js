import express from 'express';
import compress from 'compression';
import app from '.'

const port = process.env.PORT || 3000;
app()
  .listen(port, ()=> { console.log('Server listening'); });
