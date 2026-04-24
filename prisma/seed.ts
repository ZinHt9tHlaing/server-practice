import { prisma } from "../src/lib/prisma";

export const FAKE_POSTS = [
  {
    title: "First post",
    body: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Veniam, maiores. Quos unde voluptatum omnis corporis autem maiores quam. Maxime, veritatis possimus voluptatibus a vitae molestiae officia sequi illum expedita nobis?",
  },
  {
    title: "Second post",
    body: "Lorem ipsum dolor sit amet consectetur adipiscing elit at nec mi convallis, gravida porttitor imperdiet venenatis dis potenti vestibulum montes ante accumsan, proin egestas eleifend risus quam vulputate inceptos nulla id cursus. Fringilla massa metus ut purus nostra hendrerit dapibus lectus, imperdiet litora tristique cubilia nisl ac nullam cum pharetra, per nec sodales magna facilisis et arcu.",
  },
  {
    title: "Third post",
    body: "Lorem ipsum dolor sit amet consectetur adipiscing elit, per posuere senectus aliquet et ridiculus nibh, habitant magna platea quis ac fringilla. Suspendisse semper nisl purus rutrum sem cubilia ad est tincidunt, tempus cum in maecenas primis urna a nisi suscipit, at blandit sagittis enim condimentum libero dictumst nam.",
  },
];

async function main() {
  await prisma.post.deleteMany();

  // Create a new user with a post
  const user = await prisma.post.createMany({
    data: FAKE_POSTS,
  });
  console.log("Created user:", user);

  // Fetch all users with their posts
  const allUsers = await prisma.post.findMany();
  console.log("All users:", JSON.stringify(allUsers, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
