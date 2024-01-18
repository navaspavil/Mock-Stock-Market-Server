const fastify = require("fastify")({ logger: true });
const { faker } = require("@faker-js/faker");
const cors = require("@fastify/cors");
require("dotenv").config();

fastify.register(cors, {
  origin: process.env.CORS_ORIGIN ?? false,
});

/** Mock Data Generation */
function generateMockData(period, startDate, endDate) {
  let data = [];
  let openPrice = undefined;

  while (startDate <= endDate) {
    const closePrice = faker.finance.amount(100, 500, 2);
    const low = closePrice - faker.number.float({ min: 10, max: 100 });

    data.push({
      date: startDate.toISOString().split("T")[0],
      close: closePrice,
      high: faker.finance.amount(500, 1000, 2),
      low: low.toFixed(2),
      open: openPrice ?? faker.finance.amount(500, 1000, 2),
      volume: faker.number.int({ min: 1000, max: 10000 }),
    });

    openPrice = closePrice;
    startDate.setDate(startDate.getDate() + 1);
  }

  if (period === "hourly") {
    data = data.flatMap((d) => {
      let hourlyData = [];
      let lastClose = parseFloat(d.close);
      let openPrice = parseFloat(d.open);

      for (let hour = 0; hour < 24; hour++) {
        let hourlyHigh = lastClose + faker.number.float({ min: 0, max: 10 });
        let hourlyLow = lastClose - faker.number.float({ min: 0, max: 10 });
        let hourlyClose = faker.number.float({
          min: hourlyLow,
          max: hourlyHigh,
        });

        hourlyData.push({
          ...d,
          date: `${d.date} ${String(hour).padStart(2, "0")}:00:00`,
          high: hourlyHigh.toFixed(2),
          low: hourlyLow.toFixed(2),
          close: hourlyClose.toFixed(2),
          open: openPrice,
        });

        lastClose = hourlyClose;
        openPrice = hourlyClose.toFixed(2);
      }

      return hourlyData;
    });
  }

  return data;
}

fastify.get("/api/search", async (request, reply) => {
  const { symbol, period = "daily", startDate, endDate } = request.query;

  if (!symbol) {
    reply.status(400).send({ message: "Invalid stock name" });
    return;
  }

  if (!startDate) {
    reply.status(400).send({ message: "Invalid start date" });
    return;
  }

  if (!endDate) {
    reply.status(400).send({ message: "Invalid end date" });
    return;
  }
  const formattedStartDate = new Date(startDate);
  const formattedEndDate = new Date(endDate);

  if (formattedEndDate < formattedStartDate) {
    reply.status(400).send({ message: "Invalid date range" });
    return;
  }

  const stockData = generateMockData(
    period,
    formattedStartDate,
    formattedEndDate
  );

  return reply.status(200).send({
    message: "Data fetched successfully",
    status: 200,
    data: {
      stockData,
      symbol,
      period,
    },
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
