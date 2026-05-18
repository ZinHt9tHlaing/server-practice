import cron from "node-cron";
import {
  createOrUpdateSetting,
  getSettingStatus,
} from "@/services/settingServices";

export const maintenanceModeJob = () => {
  // */2 * * * * * => 2 seconds
  cron.schedule("* 5 * * *", async () => {
    // Run a task every 5 A.M
    console.log("Running a task every 5am For testing purpose");

    const setting = await getSettingStatus("maintenance_mode");
    if (setting?.value === "true") {
      await createOrUpdateSetting("maintenance_mode", "false");
      console.log("Now maintenance mode is off");
    }
  });
};
