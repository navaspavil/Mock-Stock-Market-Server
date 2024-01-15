const fastify = require("fastify")({ logger: true });
const { faker } = require("@faker-js/faker");

/** Mock Data Generation */
function generateMockData(symbol, period, startDate, endDate) {
  let data = [];
  let currentDate = new Date(startDate);
  endDate = new Date(endDate);

  while (currentDate <= endDate) {
    data.push({
      date: currentDate.toISOString().split("T")[0],
      close: faker.finance.amount(100, 500, 2),
      high: faker.finance.amount(500, 1000, 2),
      low: faker.finance.amount(50, 100, 2),
      volume: faker.datatype.number({ min: 1000, max: 10000 }),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (period === "hourly") {
    data = data.flatMap((d) => {
      let hourlyData = [];
      let lastClose = parseFloat(d.close);

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
        });

        lastClose = hourlyClose; // Update last close for the next hour
      }

      return hourlyData;
    });
  }

  return data;
}

fastify.get("/api/search", async (request, reply) => {
  const { symbol, period, startDate, endDate } = request.query;

  if (!symbol || !period || !startDate || !endDate) {
    reply.status(400).send({ message: "Missing required query parameters" });
    return;
  }

  const stockData = generateMockData(symbol, period, startDate, endDate);

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
