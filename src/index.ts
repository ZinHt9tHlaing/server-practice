import "dotenv/config";
import { app } from "./app";
import { prisma } from "./lib/prisma";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 8000;
const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info("Prisma DB connected");

    app.listen(PORT, () => {
      logger.info(`Server ready at: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error({ error }, "Failed to connect Prisma DB");
    process.exit(1);
  }
};

startServer();
