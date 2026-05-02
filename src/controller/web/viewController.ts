import { Request, Response, NextFunction } from "express";

export const homeView = (req: Request, res: Response) => {
  res.render("index", { title: "Home" });
};

export const aboutView = (req: Request, res: Response) => {
  const users = [
    { name: "John", age: 30 },
    { name: "Jane", age: 25 },
  ];

  res.render("about", { title: "About Us", users });
};
