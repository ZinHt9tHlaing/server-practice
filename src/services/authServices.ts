import { prisma } from "@/lib/prisma";
import { Prisma } from "../../generated/prisma/client";

export const getUserByPhone = async (phone: string) => {
  return prisma.user.findUnique({
    where: { phone },
  });
};

export const createOtp = async (otpData: Prisma.OtpCreateInput) => {
  return prisma.otp.create({
    data: otpData,
  });
};

export const getOtpByPhone = async (phone: string) => {
  return prisma.otp.findUnique({
    where: { phone },
  });
};

export const updateOtp = async (
  id: string,
  otpData: Prisma.OtpUpdateInput
) => {
  return prisma.otp.update({
    where: { id },
    data: otpData,
  });
};
