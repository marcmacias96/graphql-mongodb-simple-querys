const POST_ADDED = 'POST_ADDED';
const pubsub = require('../src/index')
export default {
  
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
