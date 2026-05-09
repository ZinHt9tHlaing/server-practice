import { prisma } from "../src/lib/prisma";
import bcrypt from "bcrypt";
import { logger } from "../src/utils/logger";
import { faker } from "@faker-js/faker";

// const userData: Prisma.UserCreateInput[] = [
//   {
//     phone: "778661260",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf80",
//   },
//   {
//     phone: "778661261",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf81",
//   },
//   {
//     phone: "778661262",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf82",
//   },
//   {
//     phone: "778661263",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf83",
//   },
//   {
//     phone: "778661264",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf84",
//   },
//   {
// ];

const createRandomUser = () => {
  return {
    phone: faker.phone.number({ style: "international" }),
    password: faker.internet.password(),
    email: faker.internet.email(),
    randomToken: faker.internet.jwt(),
  };
};

export const userData = faker.helpers.multiple(createRandomUser, {
  count: 5,
});

async function main() {
  logger.info(`Start seeding...`);

  await prisma.user.deleteMany();
  const salt = await bcrypt.genSalt(10);

  for (const user of userData) {
    const hashedPassword = await bcrypt.hash(user.password, salt);

    await prisma.user.create({
      data: {
        phone: user.phone,
        password: hashedPassword,
        email: user.email,
        randomToken: user.randomToken,
      },
    });
  }

  logger.info(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    logger.error("Error seeding: ", error);
    await prisma.$disconnect();
    process.exit(1); // Exit with failure code
  });
