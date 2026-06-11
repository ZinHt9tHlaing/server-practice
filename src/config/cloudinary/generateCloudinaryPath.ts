import { v2 as cloudinary } from "cloudinary";
import { ENV } from "../env";

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

interface CloudinaryPathInput {
  folderName: string;
  fileName: string;
}

/**
 * 📍 ၁။ အသစ်ထည့်သွင်းလိုက်သော Reusable Function
 * Folder Name နှင့် File Name ကို အခြေခံပြီး Cloudinary ရဲ့
 * Official SDK သုံးကာ စိတ်ချရသော HTTPS Image URL ကို ကြိုတင်တွက်ချက်ထုတ်ပေးသည်။
 */
const generateCloudinaryPath = ({
  folderName,
  fileName,
}: CloudinaryPathInput) => {
  const publicId = `${folderName}/${fileName}`;

  const imageUrl = cloudinary.url(publicId, {
    secure: true,
  });

  return { publicId, imageUrl };
};

/**
 * ၂။ သင့်တွင် ရှိပြီးသားဖြစ်သော အလုပ်လုပ်ပုံ (မပြောင်းလဲပါ)
 * ၎င်းသည် Worker ထဲတွင်သာ အလုပ်လုပ်မည်ဖြစ်ပြီး Optimized Buffer ကို upload တင်ပေးသည်။
 */

export default generateCloudinaryPath;
