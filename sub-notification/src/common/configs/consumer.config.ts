import "dotenv/config";

export const consumerConfig = {
  rabbitMq: {
    url: process.env.RABBIT_MQ_URL || "",
    exchange: process.env.RABBIT_MQ_EXCHANGE || "",
  },
  //Future implementation
  //   redis:{

  //   }
};
