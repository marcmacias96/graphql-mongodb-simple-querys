import http from 'http';
import express from 'express';
const app = express();

import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost/graphql-mongo',{useNewUrlParser: true})
  .then(() => console.log('connected to db'))
  .catch(err => console.log(err));
import Car from './models/Car';

import { ApolloServer,PubSub} from 'apollo-server-express';

const POST_ADDED = 'POST_ADDED';

import typeDefs from './schema';
const  resolvers = {
  Subscription : {
    cars : {
      subscribe: () => pubsub.asyncIterator([POST_ADDED]),
    }
  },

  Query: {
    allCars: async (parent, args, { Car }) => {
      const cars = await Car.find();
      return cars.map(x => {
        x._id = x._id.toString();
        return x;
      })
    }
  },
  Mutation: {
    createCar: async (parent, args, { Car }) => {
      const car = await new Car(args).save();
      car._id = car._id.toString();
      pubsub.publish(POST_ADDED, { cars: car });
      return car;
    }
  }
}


// settings
app.set('port', process.env.PORT || 3000);
const pubsub = new PubSub();
const SERVER = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: {
    onConnect: () => console.log('Connected to websocket'),
  },
  context: ({ req, res }) => ({ req, res, pubsub ,Car}),
  introspection: true,
  playground: true,
  playground: {
      endpoint: `http://localhost:3000/graphql`,
      settings: {
          'editor.theme': 'dark'
      }
  }
})

SERVER.applyMiddleware({
  app
})
const httpServer = http.createServer(app);
SERVER.installSubscriptionHandlers(httpServer);

// start the server
httpServer.listen(app.get('port'), () => {
  console.log('server on port', app.get('port'));
});
