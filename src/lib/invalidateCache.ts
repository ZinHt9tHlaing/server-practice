import redisConnection from "@/config/redisClient";

const invalidateCache = async (pattern: string) => {
  try {
    // scanStream သည် event-driven pattern ဖြစ်တယ်။ ပြီးသွားပြီ မပြီးသေးဘူးဆိုတဲ့ event တွေကို ထုတ်ပေးတယ်။ အဲ့ stream object က data, end, error event တွေ ရှိမယ်
    const stream = redisConnection.scanStream({
      match: pattern,
      count: 100,
    }); // 100စီ ပိုင်း ပိုင်းပြီး ရှာမယ်,

    // တစ်ခုချင်းစီ စုလိုက် ဖျက်လိုက်မလုပ်တော့ပဲ, data တွေကို အရင်အစုလိုက်ယူလာပြီး အကုန်လုံးကို တစ်ခါတည်း ပို့ပေးမယ်, သက်သာမယ့် နည်းလမ်းဖြစ်တယ်
    // စုပြီး တပြိုင်နက်တည်းပို့နိုင်လို့ pipeline ကိုသုံးတာ
    const pipeline = redisConnection.pipeline();
    let totalKeys = 0; // ရှာတွေ့လား မတွေ့လားဆိုတာ ဆုံးဖြတ်လို့ရအောင်လို့

    // ရှာလို့တွေ့ရင် dataဆိုတဲ့ event အလုပ်လုပ်
    stream.on("data", (keys: string[]) => {
      // keys array ထဲမှာ key တွေ ရှိရင်
      if (keys.length > 0) {
        // loopပတ်ပြီး key တွေကို pipeline ထဲထည့်မယ်
        keys.forEach((key) => {
          pipeline.del(key);
          totalKeys++;
        });
      }
    });

    // redis ကပေးလိုက်တဲ့ key ကို ဖျက်တာက မပြီးသေးပဲ user ကိုပြီးပြီလို့ ပြောတာလည်းဖြစ်နိုင်တယ်, user က နောက်တစ်ကြိမ် request တစ်ခုတက်လာရင် race condition ဖြစ်သွားနိုင်တယ် (2 ခုပြိုင်ပြီး command တွေဝင်လာတာ ဖြစ်နိုင်)
    // တစ်ကယ်ပြီးတာသေချာအောင် Promise သုံးပြီး စောင့်ခိုင်းထားမယ် (Double check လုပ်ပေးတာ)
    // Wrap stream events in a Promise
    await new Promise<void>((resolve, reject) => {
      // end event က data အကုန်ရပြီလို့ပြောတာ
      stream.on("end", async () => {
        try {
          if (totalKeys > 0) {
            await pipeline.exec(); // ပို့ပေးလိုက်တဲ့ command တွေကို တပြိုင်နက်တည်း အလုပ်လုပ်ခိုင်းတာ
            console.log(
              `Cache invalidation completed: ${totalKeys} keys deleted.`
            );
          }

          resolve();
        } catch (execError) {
          console.error("Error executing pipeline:", execError);
          reject(execError);
        }
      });

      // errorတစ်ခုခုတက်ရင် error event ပြန်ပေးတယ််
      stream.on("error", (error) => {
        console.error("Stream Error: ", error);
        reject(error);
      });
    });

    // Process keys in batches
  } catch (error) {
    console.error("Cache Invalidation error: ", error);
    throw error;
  }
};

export { invalidateCache };
